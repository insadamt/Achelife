<?php

namespace Tests\Feature\Constitution;

use App\Actions\Constitution\ArchiveLaw;
use App\Actions\Constitution\DeleteUnusedLaw;
use App\Actions\Constitution\UpdateLaw;
use App\Enums\LawSeverity;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesConstitution;
use Tests\TestCase;

class LawLifecycleTest extends TestCase
{
    use CreatesConstitution, RefreshDatabase;

    public function test_laws_support_exactly_three_severities_with_fixed_penalties_and_no_custom_penalty(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->constitutionUserCreatedOn('2026-08-01');

        foreach ([LawSeverity::Minor, LawSeverity::Major, LawSeverity::Critical] as $severity) {
            $this->actingAs($user)
                ->post('/constitution/laws', [
                    'name' => "{$severity->value} Law",
                    'severity' => $severity->value,
                    'custom_penalty' => -999,
                ])
                ->assertSessionHasNoErrors();
        }

        $this->assertSame([-10, -50, -100], array_map(
            fn (LawSeverity $severity): int => $severity->basePenalty(),
            LawSeverity::cases(),
        ));
        $this->assertCount(3, $user->laws);
        $this->assertFalse(Schema::hasColumn('laws', 'custom_penalty'));
    }

    public function test_name_and_severity_edit_apply_to_future_violations_only(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user);
        $first = $this->recordViolation($user, $law, '2026-08-05', '2026-08-10');

        app(UpdateLaw::class)->execute($law, 'Renamed Law', LawSeverity::Critical);
        $second = $this->recordViolation($user, $law->refresh(), '2026-08-10', '2026-08-10');

        $this->assertSame('Renamed Law', $law->refresh()->name);
        $this->assertSame(LawSeverity::Critical, $law->severity);
        $this->assertSame(LawSeverity::Major, $first->refresh()->severity_snapshot);
        $this->assertSame(-50, $first->base_penalty_snapshot);
        $this->assertSame(-50, $first->penalty_sp);
        $this->assertSame(LawSeverity::Critical, $second->severity_snapshot);
        $this->assertSame(-100, $second->base_penalty_snapshot);
        $this->assertSame(2, $second->sequence_number);
        $this->assertSame(-200, $second->penalty_sp);
    }

    public function test_unused_law_can_be_deleted_but_any_history_requires_archive(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $unusedLaw = $this->createLaw($user, createdOn: '2026-08-01');
        app(DeleteUnusedLaw::class)->execute($unusedLaw);
        $this->assertDatabaseMissing('laws', ['id' => $unusedLaw->id]);

        $usedLaw = $this->createLaw($user, name: 'Used Law', createdOn: '2026-08-01');
        $this->recordViolation($user, $usedLaw, '2026-08-01');

        $this->expectException(ValidationException::class);
        app(DeleteUnusedLaw::class)->execute($usedLaw);
    }

    public function test_archive_is_permanent_read_only_and_blocks_new_violations(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user);
        $this->recordViolation($user, $law, '2026-08-05', '2026-08-10');
        app(ArchiveLaw::class)->execute($law);

        $this->assertNotNull($law->refresh()->archived_at);
        $this->assertSame(1, $law->violations()->count());

        foreach (
            [
                fn () => $this->recordViolation($user, $law, '2026-08-10', '2026-08-10'),
                fn () => app(UpdateLaw::class)->execute($law, 'Reactivate Attempt', LawSeverity::Minor),
                fn () => app(ArchiveLaw::class)->execute($law),
            ] as $invalidChange
        ) {
            try {
                $invalidChange();
                $this->fail('Archived Laws must remain permanently inactive and read-only.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        $this->actingAs($user)->post("/constitution/laws/{$law->id}/reactivate")->assertNotFound();
    }
}
