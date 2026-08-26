# Phase 11 Season lifecycle, rollover, and intermissions

## Implemented foundation

Phase 11 replaces arithmetic-only Season lookup with a persisted cycle. `ResolveUserSeasonCycle` is the central read-and-synchronize action and returns a `SeasonCycleResult` containing either an active Season or an open intermission plus the latest completed Season. `SynchronizeUserSeasons` remains as the compatibility boundary for operations that require an active Season and produces a validation error during intermission.

Users own a long-term `automatic` or `manual` rollover preference and an independent one-time `hold_next_season` flag. Intermissions record the completed Season, reason, first intermission date, and the exclusive date on which the intermission ended. Reasons are manual rollover, one-time hold, and restore. Restore-created intermissions are modeled now; archive import will create them when Phase 15 adds the restore path.

Every Season remains exactly 30 user-local calendar days. Season numbers come from the latest persisted Season, gaps are allowed, overlaps are rejected by the lifecycle resolver, and `calendar_started_on` remains immutable. An ended Season receives its final Rank and `finalized_at` snapshot before rollover or intermission.

## Rollover behavior

Automatic users retain continuous 30-day backfill after an absence. Manual users and automatic users with a one-time hold enter an explicit intermission after Day 30. Enabling automatic rollover during an intermission starts the next Season on the current user-local date instead of backdating it.

`StartNextSeason` locks the user, returns an already-active Season for a repeated request, closes the open intermission using an exclusive `ended_before` boundary, creates exactly one next numbered Season for today through Day 30, and clears only the one-time hold. It never changes the long-term preference.

## Intermission behavior

Today becomes an intermission dashboard with the last closeout, reason, elapsed rest days, exact proposed dates, and a confirmed start action. Seasons shows held state as “Waiting for you,” while expected future dates appear only for uninterrupted automatic rollover.

Money, Settings, Task planning, and historical module pages remain reachable. Task completion has no projection and is rejected until a Season starts. Recurring Task synchronization removes open-intermission occurrences and resumes from the first eligible recurrence date on or after the new Season start without gap backfill.

Habit synchronization stops during intermission and skips calendar gaps on resume, leaving no occurrence to increment or reset a streak. Historical Habit cells are read-only. Diary gap dates are unavailable rather than Missed, existing entries remain readable, and autosave requires an active Season. Constitution Laws remain readable while new violations continue to use the active-Season guard.

## Database migration

`2026_08_25_000000_add_season_cycle_lifecycle.php` adds user rollover settings, `seasons.finalized_at`, and `season_intermissions`. The defaults preserve upgraded accounts as automatic continuous timelines. Fresh and upgraded databases use the same lifecycle resolver after migration.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
git diff --check
```

Phase 11 coverage includes manual rollover, automatic backfill compatibility, one-time holds, preference restoration, starts after long gaps, repeated start idempotency, final Rank snapshots, blocked Task rewards, recurrence resumption without gap occurrences, intermission routing, and historical/non-seasonal page availability.

## Deferred integration

The Phase 15 archive importer must use the existing `restore` intermission reason and open a one-time hold after synchronizing only through the imported Season's original end date. Restore-specific preview and synchronization tests remain intentionally open until that import boundary exists.
