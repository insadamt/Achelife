<?php

namespace Tests\Feature\Portability;

use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountPortabilityWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_single_user_export_download_uses_the_achelife_archive_suffix(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $user = User::factory()->create(['calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $user->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0, 'introduced_at' => now()]);

        $this->actingAs($user)->get('/settings/portability/export')
            ->assertOk()
            ->assertDownload('achelife-account-2026-08-15-120000.achelife.zip')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_fresh_onboarding_validates_previews_and_restores_before_normal_setup(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $source = User::factory()->create(['name' => 'Returning Person', 'calendar_started_on' => '2026-08-01', 'timezone' => 'UTC']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);
        $target = User::factory()->create([
            'email' => 'returning-login@example.com',
            'onboarding_step' => 'path',
            'onboarding_completed_at' => null,
        ]);
        $archivePath = app(AccountArchiveExporter::class)->export($source);

        try {
            $archive = UploadedFile::fake()->createWithContent('account.achelife.zip', file_get_contents($archivePath));
            $this->actingAs($target)->post('/onboarding/restore/preview', ['archive' => $archive])
                ->assertRedirect()
                ->assertSessionHas('portability.pending.fresh.preview');
            $this->get('/onboarding')->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('onboarding/Index')
                ->where('step', 'path')
                ->where('restorePreview.latestSeason.number', 1)
                ->where('restorePreview.timezone', 'UTC'));

            $this->post('/onboarding/restore')->assertRedirect('/restore/welcome');
            $this->get('/restore/welcome')->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('portability/Welcome')
                ->where('summary.seasonNumber', 1)
                ->where('summary.activeSeasonContinues', true));

            $target->refresh();
            $this->assertSame('Returning Person', $target->name);
            $this->assertSame('returning-login@example.com', $target->email);
            $this->assertNotNull($target->onboarding_completed_at);
            $this->assertSame(1, $target->seasons()->count());
        } finally {
            @unlink($archivePath);
        }
    }

    public function test_settings_preview_requires_literal_restore_confirmation(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $source = User::factory()->create(['name' => 'Source', 'calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);
        $target = User::factory()->create(['name' => 'Keep Until Confirmed', 'password' => 'correct-password', 'calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $target->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0, 'introduced_at' => now()]);
        $archivePath = app(AccountArchiveExporter::class)->export($source);

        try {
            $archive = UploadedFile::fake()->createWithContent('account.achelife.zip', file_get_contents($archivePath));
            $this->actingAs($target)->post('/settings/portability/preview', ['archive' => $archive])->assertRedirect();
            $this->get('/settings/general')->assertInertia(fn (Assert $page) => $page
                ->where('restorePreview.latestSeason.number', 1));

            $this->post('/settings/portability/restore', [
                'confirmation' => 'restore',
            ])->assertSessionHasErrors(['confirmation']);
            $this->assertSame('Keep Until Confirmed', $target->refresh()->name);

            $this->post('/settings/portability/restore', [
                'confirmation' => 'RESTORE',
            ])->assertRedirect('/restore/welcome');
            $this->assertSame('Source', $target->refresh()->name);
        } finally {
            @unlink($archivePath);
        }
    }

    public function test_account_requests_are_locked_out_while_restore_owns_the_user_lock(): void
    {
        $user = User::factory()->create(['calendar_started_on' => '2026-08-01']);
        Season::query()->create(['user_id' => $user->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0, 'introduced_at' => now()]);
        $lock = Cache::lock("achelife-account-write:{$user->id}", 300);
        $this->assertTrue($lock->get());

        try {
            $this->actingAs($user)->post('/tasks', [
                'title' => 'Must wait',
                'scheduled_date' => '2026-08-01',
            ])->assertStatus(423);
            $this->assertDatabaseCount('tasks', 0);
        } finally {
            $lock->release();
        }
    }
}
