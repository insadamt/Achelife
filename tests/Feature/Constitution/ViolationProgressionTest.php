<?php

namespace Tests\Feature\Constitution;

use App\Actions\Constitution\CorrectViolationDate;
use App\Actions\Constitution\DeleteViolation;
use App\Actions\Constitution\UpdateLaw;
use App\Enums\LawSeverity;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use LogicException;
use Tests\Concerns\CreatesConstitution;
use Tests\TestCase;

class ViolationProgressionTest extends TestCase
{
    use CreatesConstitution, RefreshDatabase;

    public function test_recording_a_violation_flashes_the_data_required_for_undo_feedback(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user, LawSeverity::Major, 'No late nights');
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');

        $this->actingAs($user)
            ->from('/constitution')
            ->post("/constitution/laws/{$law->id}/violations", ['date' => '2026-08-18'])
            ->assertRedirect('/constitution')
            ->assertSessionHas('constitutionViolation.id')
            ->assertSessionHas('constitutionViolation.lawName', 'No late nights')
            ->assertSessionHas('constitutionViolation.sequence', 1)
            ->assertSessionHas('constitutionViolation.penalty', -50);
    }

    public function test_multiplier_continues_and_each_law_has_an_independent_counter(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $majorLaw = $this->createLaw($user, createdOn: '2026-08-01');
        $minorLaw = $this->createLaw($user, LawSeverity::Minor, 'Minor Law', '2026-08-01');

        for ($day = 1; $day <= 6; $day++) {
            $this->recordViolation($user, $majorLaw, "2026-08-0{$day}", '2026-08-06');
        }
        $minorFirst = $this->recordViolation($user, $minorLaw, '2026-08-06', '2026-08-06');

        $this->assertSame([1, 2, 3, 4, 5, 6], $majorLaw->violations()->orderBy('violation_date')->pluck('sequence_number')->all());
        $this->assertSame([-50, -100, -150, -200, -250, -300], $majorLaw->violations()->orderBy('violation_date')->pluck('penalty_sp')->all());
        $this->assertSame(1, $minorFirst->sequence_number);
        $this->assertSame(-10, $minorFirst->penalty_sp);
    }

    public function test_severity_penalty_amounts_are_exact_for_first_three_violations(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $expectations = [
            LawSeverity::Minor->value => [-10, -20, -30],
            LawSeverity::Major->value => [-50, -100, -150],
            LawSeverity::Critical->value => [-100, -200, -300],
        ];

        foreach (LawSeverity::cases() as $severity) {
            $law = $this->createLaw($user, $severity, "{$severity->value} Law", '2026-08-01');

            foreach ([1, 2, 3] as $day) {
                $this->recordViolation($user, $law, "2026-08-0{$day}", '2026-08-03');
            }

            $this->assertSame($expectations[$severity->value], $law->violations()->orderBy('violation_date')->pluck('penalty_sp')->all());
        }
    }

    public function test_backdating_recalculates_later_penalties_and_only_applies_constitution_delta(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user);
        $season = $user->seasons()->firstOrCreate(
            ['season_number' => 1],
            ['start_date' => '2026-08-01', 'end_date' => '2026-08-30'],
        );
        $season->update(['season_points' => 1000]);

        foreach (['2026-08-05', '2026-08-10', '2026-08-15'] as $date) {
            $this->recordViolation($user, $law, $date, '2026-08-15');
        }
        $this->assertSame(700, $season->refresh()->season_points);

        $this->recordViolation($user, $law, '2026-08-07', '2026-08-15');

        $this->assertSame(
            [
                '2026-08-05' => [1, -50],
                '2026-08-07' => [2, -100],
                '2026-08-10' => [3, -150],
                '2026-08-15' => [4, -200],
            ],
            $law->violations()->orderBy('violation_date')->get()->mapWithKeys(
                fn ($violation): array => [$violation->violation_date->toDateString() => [$violation->sequence_number, $violation->penalty_sp]],
            )->all(),
        );
        $this->assertSame(500, $season->refresh()->season_points);
    }

    public function test_date_correction_reorders_snapshot_penalties_and_delete_collapses_sequence(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user);
        $first = $this->recordViolation($user, $law, '2026-08-05', '2026-08-15');
        app(UpdateLaw::class)->execute($law, $law->name, LawSeverity::Critical);
        $second = $this->recordViolation($user, $law->refresh(), '2026-08-10', '2026-08-15');
        $third = $this->recordViolation($user, $law, '2026-08-15', '2026-08-15');
        $season = $first->season;
        $this->assertSame(-550, $season->refresh()->season_points);

        app(CorrectViolationDate::class)->execute(
            $user,
            $third,
            CarbonImmutable::parse('2026-08-02'),
            CarbonImmutable::parse('2026-08-15'),
        );

        $this->assertSame([1, -100], [$third->refresh()->sequence_number, $third->penalty_sp]);
        $this->assertSame([2, -100], [$first->refresh()->sequence_number, $first->penalty_sp]);
        $this->assertSame([3, -300], [$second->refresh()->sequence_number, $second->penalty_sp]);
        $this->assertSame(-500, $season->refresh()->season_points);

        app(DeleteViolation::class)->execute($user, $first, CarbonImmutable::parse('2026-08-15'));
        $this->assertSame([1, 2], $law->violations()->orderBy('violation_date')->pluck('sequence_number')->all());
        $this->assertSame([-100, -200], $law->violations()->orderBy('violation_date')->pluck('penalty_sp')->all());
        $this->assertSame(-300, $season->refresh()->season_points);
    }

    public function test_same_day_order_is_stable_by_creation_then_id(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user);
        CarbonImmutable::setTestNow('2026-08-10 12:00:00');
        $first = $this->recordViolation($user, $law, '2026-08-10', '2026-08-10');
        $second = $this->recordViolation($user, $law, '2026-08-10', '2026-08-10');

        $this->assertLessThan($second->id, $first->id);
        $this->assertSame(1, $first->refresh()->sequence_number);
        $this->assertSame(2, $second->refresh()->sequence_number);

        app(CorrectViolationDate::class)->execute($user, $first, CarbonImmutable::parse('2026-08-10'), CarbonImmutable::parse('2026-08-10'));
        $this->assertSame(1, $first->refresh()->sequence_number);
        $this->assertSame(2, $second->refresh()->sequence_number);
    }

    public function test_multiplier_resets_in_new_season_while_law_continues_globally(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-01-01');
        $law = $this->createLaw($user, createdOn: '2026-01-01');
        $seasonOneViolation = $this->recordViolation($user, $law, '2026-01-30', '2026-01-30');
        $seasonTwoViolation = $this->recordViolation($user, $law, '2026-01-31', '2026-01-31');

        $this->assertSame(1, $seasonOneViolation->sequence_number);
        $this->assertSame(1, $seasonTwoViolation->sequence_number);
        $this->assertSame(1, $seasonOneViolation->season->season_number);
        $this->assertSame(2, $seasonTwoViolation->season->season_number);
        $this->assertSame($law->id, $seasonTwoViolation->law_id);
    }

    public function test_completed_season_violations_are_locked_and_dates_are_bounded(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-01-01');
        $law = $this->createLaw($user, createdOn: '2026-01-01');
        $oldViolation = $this->recordViolation($user, $law, '2026-01-30', '2026-01-30');

        foreach (
            [
                fn () => app(CorrectViolationDate::class)->execute($user, $oldViolation, CarbonImmutable::parse('2026-01-31'), CarbonImmutable::parse('2026-01-31')),
                fn () => app(DeleteViolation::class)->execute($user, $oldViolation, CarbonImmutable::parse('2026-01-31')),
                fn () => $this->recordViolation($user, $law, '2026-01-30', '2026-01-31'),
                fn () => $this->recordViolation($user, $law, '2026-02-01', '2026-01-31'),
            ] as $invalidChange
        ) {
            try {
                $invalidChange();
                $this->fail('Completed, prior-Season, and future violation changes must be rejected.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_violation_cannot_predate_law_creation_within_current_season(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user, createdOn: '2026-08-10');

        $this->expectException(ValidationException::class);
        $this->recordViolation($user, $law, '2026-08-09', '2026-08-18');
    }

    public function test_critical_violation_can_reduce_season_sp_below_zero(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user, LawSeverity::Critical);
        $season = $user->seasons()->firstOrCreate(
            ['season_number' => 1],
            ['start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 30],
        );
        $season->update(['season_points' => 30]);

        $violation = $this->recordViolation($user, $law, '2026-08-01');

        $this->assertSame($season->id, $violation->season_id);
        $this->assertSame(-70, $season->refresh()->season_points);
    }

    public function test_violation_model_rejects_inconsistent_snapshots_and_penalties(): void
    {
        $user = $this->constitutionUserCreatedOn('2026-08-01');
        $law = $this->createLaw($user, LawSeverity::Minor);
        $season = $user->seasons()->create([
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
        ]);

        $this->expectException(LogicException::class);
        $law->violations()->create([
            'user_id' => $user->id,
            'season_id' => $season->id,
            'violation_date' => '2026-08-01',
            'severity_snapshot' => LawSeverity::Minor,
            'base_penalty_snapshot' => -50,
            'sequence_number' => 0,
            'penalty_sp' => 0,
        ]);
    }
}
