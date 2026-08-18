# Phase 3 Habits

## Scope

Phase 3 adds global Boolean and Numeric Habit definitions, effective-dated rules, Season-owned daily occurrences, automatic missed resolution, streak rewards, active-Season editing, permanent Season locking, Flexible extras, lifecycle actions, and the Habits calendar interface. Diary, Objectives, Constitution, Money, Today integration, and Habit statistics remain deferred.

## Data model

- `habits` stores user ownership, current name, immutable type, globally displayed unit, effective start date, synchronization watermark, current streak, and archive/delete lifecycle timestamps. Delete uses soft deletion so occurrence and reward history remains intact.
- `habit_definition_versions` stores difficulty, schedule, selected weekdays, Flexible mode, and Numeric target from an inclusive effective date. Creation starts a version today. Edits create or update tomorrow's version, so today's materialized occurrence and all prior snapshots remain unchanged.
- `habit_occurrences` stores one row per Habit/date, its Season, required or Flexible-extra context, state, Numeric value, target/difficulty/schedule snapshots, automatic base reward, streak after the outcome, multiplier, exact earned SP, and audit timestamps. Unit is intentionally read from the Habit so a unit rename changes historical display without copying stale labels.
- `habit_settings` stores the authenticated user's small `calendar_dates` or `season_days` display preference.

## Synchronization and materialization

`SynchronizeHabitOccurrences` runs whenever Habits are accessed and before occurrence or lifecycle mutations. It first synchronizes the user's Season timeline, then advances each active Habit's watermark through today.

Only required dates are materialized. Past required dates become Missed and today's required date becomes Pending. Existing Pending rows before today are finalized as Missed, including preserved partial Numeric values. Non-scheduled days and ignored Flexible dates create no rows. Future dates are calculated for calendar rendering and are never materialized. The unique Habit/date database constraint makes synchronization idempotent.

This access-driven strategy does not require cron for correctness. A user returning after an absence receives all required elapsed outcomes before the page or mutation is processed.

## State, streak, and reward engine

`RecalculateHabitProgression` is the central chronological replay engine. Completed increments the streak, Skipped preserves it, Missed resets it, and Pending or an unresolved optional Numeric extra has no effect. Non-scheduled dates have no row and therefore no effect. Flexible completions participate like any other completion but never replace a required missed date.

Difficulty snapshots supply 2, 4, or 8 base SP. Completed streaks 1–9 use ×1, 10–19 use ×1.5, and 20+ use ×2. Each occurrence persists its exact multiplier and reward.

Replay starts from the final stored occurrence before the current Season, which is the immutable streak baseline. It recalculates only the current Season, compares the old and new Habit reward totals, and applies that exact delta to `season_points` in the same transaction. Task rewards and other contributions are never replaced or independently derived.

## Editing and locking

Any eligible occurrence in the current Season can be changed or backfilled through today. Replaying the Season updates downstream streak and reward snapshots. Occurrences outside the current Season are rejected permanently, including Completed, Skipped, Missed, and Numeric values.

Boolean clicks complete or undo an occurrence. Undo returns a required occurrence to Pending today or Missed in the past; an optional Flexible occurrence is removed. Numeric values remain stored below target, becoming Pending today or Missed in the past for required dates, while optional below-target values remain unresolved without a miss. Skip is restricted to required dates and is available through hold, context click, and a visible secondary action with confirmation.

## Lifecycle

Archive and Delete permanently end future activity and remove today's occurrence. Any exact reward on today's occurrence is reversed before current-Season replay. Earlier dates remain untouched. Archived Habits appear in a read-only archive and cannot reactivate. Deleted Habits are soft-deleted, omitted from active and archived views, and retain internal history and SP attribution.

## Interface

The Habits page lists every active Habit rather than acting as a Today checklist. Compact cards show definition context, base reward, current streak, the current Monday–Sunday strip, and an expandable current-Season calendar. Cells outside the Season are placeholders; dates before creation and future/unavailable dates are borderless ghosts; eligible Flexible extras are bordered ghosts. Completed, Skipped, Missed, and Pending use controlled semantic colors, with darker semantic borders on past resolved dates.

The page has no week navigation. Calendar Dates mode displays calendar day numbers with month context at boundaries, while Season Days displays 1–30 without changing occurrence dates. Creation and editing use one responsive full-height sheet. Numeric interaction uses a focused value dialog with explicit save and clear/reset actions.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```
