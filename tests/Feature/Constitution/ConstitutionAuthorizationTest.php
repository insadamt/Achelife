<?php

namespace Tests\Feature\Constitution;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\LawSeverity;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesConstitution;
use Tests\TestCase;

class ConstitutionAuthorizationTest extends TestCase
{
    use CreatesConstitution, RefreshDatabase;

    public function test_user_sees_only_their_laws_and_current_season_summary(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $owner = $this->constitutionUserCreatedOn('2026-08-01');
        $viewer = $this->constitutionUserCreatedOn('2026-08-01');
        $ownerLaw = $this->createLaw($owner, name: 'Private Law');
        $viewerLaw = $this->createLaw($viewer, LawSeverity::Minor, 'Visible Law');
        $this->recordViolation($owner, $ownerLaw, '2026-08-18');
        $this->recordViolation($viewer, $viewerLaw, '2026-08-18');
        app(SynchronizeUserSeasons::class)->execute($viewer)->update(['introduced_at' => now()]);

        $this->actingAs($viewer)
            ->get('/constitution')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('constitution/Index')
                ->has('laws', 1)
                ->where('laws.0.name', 'Visible Law')
                ->where('laws.0.nextMultiplier', 2)
                ->where('laws.0.nextPenalty', -20)
                ->where('summary.violationCount', 1)
                ->where('summary.spLost', 10)
                ->where('currentSeason.seasonPoints', -10));
    }

    public function test_cross_user_law_and_violation_mutations_are_forbidden(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $owner = $this->constitutionUserCreatedOn('2026-08-01');
        $intruder = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($owner);
        $violation = $this->recordViolation($owner, $law, '2026-08-18');
        $payload = ['name' => 'Hijacked', 'severity' => 'critical'];

        $this->actingAs($intruder)->put("/constitution/laws/{$law->id}", $payload)->assertForbidden();
        $this->actingAs($intruder)->post("/constitution/laws/{$law->id}/archive")->assertForbidden();
        $this->actingAs($intruder)->delete("/constitution/laws/{$law->id}")->assertForbidden();
        $this->actingAs($intruder)->post("/constitution/laws/{$law->id}/violations", ['date' => '2026-08-18'])->assertForbidden();
        $this->actingAs($intruder)->put("/constitution/violations/{$violation->id}", ['date' => '2026-08-17'])->assertForbidden();
        $this->actingAs($intruder)->delete("/constitution/violations/{$violation->id}")->assertForbidden();

        $this->assertSame('Test Law', $law->refresh()->name);
        $this->assertNull($law->archived_at);
        $this->assertSame('2026-08-18', $violation->refresh()->violation_date->toDateString());
    }

    public function test_archived_page_is_owner_scoped_and_read_only(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $owner = $this->constitutionUserCreatedOn('2026-08-01');
        $viewer = $this->constitutionUserCreatedOn('2026-08-01');
        $ownerLaw = $this->createLaw($owner, name: 'Private Archive');
        $viewerLaw = $this->createLaw($viewer, name: 'Visible Archive');
        $ownerLaw->update(['archived_at' => now()]);
        $viewerLaw->update(['archived_at' => now()]);
        app(SynchronizeUserSeasons::class)->execute($viewer)->update(['introduced_at' => now()]);

        $this->actingAs($viewer)
            ->get('/constitution/archived')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('constitution/Archived')
                ->has('laws', 1)
                ->where('laws.0.name', 'Visible Archive'));
    }
}
