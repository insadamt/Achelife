<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Actions\Seasons\StartNextSeason;
use App\Data\Portability\AccountRestoreRequest;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use App\Services\Portability\ArchiveStorage;
use App\Services\Portability\RestoreCatchUpService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\Concerns\BuildsPortableAccounts;
use Tests\TestCase;

class AccountRestoreTest extends TestCase
{
    use BuildsPortableAccounts;
    use RefreshDatabase;

    public function test_existing_instance_replacement_round_trips_the_complete_graph_and_is_repeatable(): void
    {
        CarbonImmutable::setTestNow('2026-09-15 12:00:00');
        $source = User::factory()->create(['name' => 'Portable Identity', 'email' => 'source@example.com']);
        $this->buildCompletePortableGraph($source);
        $target = User::factory()->create([
            'name' => 'Target Profile',
            'email' => 'target@example.com',
            'password' => 'correct-password',
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-09-01',
        ]);
        Season::query()->create(['user_id' => $target->id, 'season_number' => 1, 'start_date' => '2026-09-01', 'end_date' => '2026-09-30', 'season_points' => 0]);
        $archivePath = app(AccountArchiveExporter::class)->export($source);

        try {
            $validated = app(AccountArchiveValidator::class)->validate($archivePath);
            $request = new AccountRestoreRequest(false, 'RESTORE');
            $firstResult = app(RestoreAccountArchive::class)->execute($target, $validated, $request);
            $this->assertRestoredCompleteGraph($target->refresh());
            $this->assertNotNull($firstResult->safetyArchiveName);
            $this->assertFileExists(app(ArchiveStorage::class)->safetyPath($target, $firstResult->safetyArchiveName));

            $secondResult = app(RestoreAccountArchive::class)->execute($target, $validated, $request);
            $this->assertRestoredCompleteGraph($target->refresh());
            $this->assertNotNull($secondResult->safetyArchiveName);

            $nextSeason = app(StartNextSeason::class)->execute($target->refresh());
            $this->assertSame(2, $nextSeason->season_number);
            $this->assertSame('2026-09-15', $nextSeason->start_date->toDateString());
            $this->assertSame('manual', $target->refresh()->season_rollover_preference->value);
            $this->assertFalse($target->hold_next_season);
            $this->assertSame('2026-09-15', $target->seasonIntermissions()->whereNotNull('ended_before')->sole()->ended_before->toDateString());

            $newAccountId = DB::table('money_accounts')->insertGetId([
                'user_id' => $target->id,
                'name' => 'After restore',
                'currency' => 'USD',
                'initial_balance_minor' => 0,
                'theme_index' => 3,
                'visual_identifier' => '9999',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->assertGreaterThan(0, $newAccountId);
            $this->assertSame(2, $source->moneyAccounts()->count());
        } finally {
            @unlink($archivePath);
        }
    }

    public function test_replacement_requires_literal_confirmation_before_safety_export(): void
    {
        $source = User::factory()->create(['calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);
        $target = User::factory()->create(['password' => 'correct-password']);
        $archivePath = app(AccountArchiveExporter::class)->export($source);
        $validated = app(AccountArchiveValidator::class)->validate($archivePath);

        try {
            app(RestoreAccountArchive::class)->execute($target, $validated, new AccountRestoreRequest(false, 'restore'));
            $this->fail('Restore should have rejected invalid confirmation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('confirmation', $exception->errors());
            $this->assertSame(0, $target->seasons()->count());
        } finally {
            @unlink($archivePath);
        }
    }

    public function test_safety_export_failure_prevents_destructive_replacement(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        [$source, $target, $archivePath] = $this->simpleReplacementFixture();
        $validated = app(AccountArchiveValidator::class)->validate($archivePath);
        $exporter = \Mockery::mock(AccountArchiveExporter::class);
        $exporter->shouldReceive('export')->once()->withArgs(fn (User $user): bool => $user->is($target))->andThrow(new RuntimeException('Safety export failed.'));
        $this->app->instance(AccountArchiveExporter::class, $exporter);

        try {
            app(RestoreAccountArchive::class)->execute($target, $validated, new AccountRestoreRequest(false, 'RESTORE'));
            $this->fail('The restore should not begin without a safety export.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Safety export failed.', $exception->getMessage());
            $this->assertSame('Original target', $target->refresh()->name);
            $this->assertSame(1, $target->seasons()->count());
            $this->assertSame('Source replacement', $source->name);
        } finally {
            @unlink($archivePath);
        }
    }

    public function test_any_catch_up_failure_rolls_back_the_entire_database_replacement(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        [, $target, $archivePath] = $this->simpleReplacementFixture();
        $validated = app(AccountArchiveValidator::class)->validate($archivePath);
        $catchUp = \Mockery::mock(RestoreCatchUpService::class);
        $catchUp->shouldReceive('apply')->once()->andThrow(new RuntimeException('Catch-up failed.'));
        $this->app->instance(RestoreCatchUpService::class, $catchUp);

        try {
            app(RestoreAccountArchive::class)->execute($target, $validated, new AccountRestoreRequest(false, 'RESTORE'));
            $this->fail('The failed catch-up should roll back the restore.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Catch-up failed.', $exception->getMessage());
            $target->refresh();
            $this->assertSame('Original target', $target->name);
            $this->assertSame('2026-08-01', $target->seasons()->sole()->start_date->toDateString());
            $this->assertSame(0, $target->seasonIntermissions()->count());
        } finally {
            @unlink($archivePath);
        }
    }

    private function assertRestoredCompleteGraph(User $target): void
    {
        $this->assertSame('Portable Identity', $target->name);
        $this->assertSame('target@example.com', $target->email);
        $this->assertTrue(Hash::check('correct-password', $target->password));
        $this->assertSame(1, $target->seasons()->count());
        $this->assertSame(1, $target->tasks()->count());
        $this->assertSame(1, $target->habits()->count());
        $this->assertSame(1, $target->diaryEntries()->count());
        $this->assertSame(1, $target->people()->count());
        $this->assertSame(1, $target->laws()->count());
        $this->assertSame(1, $target->violations()->count());
        $this->assertSame(1, $target->objectives()->count());
        $this->assertSame(2, $target->moneyAccounts()->count());
        $this->assertSame(2, $target->moneyTransactions()->count());
        $this->assertSame(1, $target->moneySubscriptions()->count());
        $this->assertSame(25, $target->moneyTransactions()->where('type', 'transfer')->value('fee_minor'));
        $this->assertSame('money.expense.financial', $target->moneyCategories()->sole()->preset_key);
        $occurrence = $target->moneySubscriptionOccurrences()->whereDate('due_date', '2026-08-10')->sole();
        $this->assertSame('paid', $occurrence->status->value);
        $this->assertSame($target->id, $occurrence->transaction->user_id);
        $this->assertSame(1, $target->moneySubscriptionOccurrences()->where('status', 'skipped')->count());
        $personId = $target->people()->sole()->id;
        $content = $target->diaryEntries()->sole()->content;
        $this->assertSame($personId, $content[1]['personId']);
        $this->assertSame('restore', $target->seasonIntermissions()->sole()->reason->value);
        $this->assertSame(1, $target->seasons()->whereNotNull('finalized_at')->count());
    }

    /** @return array{User, User, string} */
    private function simpleReplacementFixture(): array
    {
        $source = User::factory()->create(['name' => 'Source replacement', 'calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);
        $target = User::factory()->create(['name' => 'Original target', 'password' => 'correct-password', 'calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $target->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);

        return [$source, $target, app(AccountArchiveExporter::class)->export($source)];
    }
}
