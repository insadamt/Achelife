# Phase 11 Season lifecycle, rollover, and intermissions

## Implemented foundation

Phase 11 replaces arithmetic-only Season lookup with a persisted cycle. `ResolveUserSeasonCycle` is the central read-and-synchronize action and returns a `SeasonCycleResult` containing either an active Season or an open intermission plus the latest completed Season. `SynchronizeUserSeasons` remains as the compatibility boundary for operations that require an active Season and produces a validation error during intermission.

Users own a long-term `automatic` or `manual` rollover preference and an independent one-time `hold_next_season` flag. Intermissions record the completed Season, reason, first intermission date, and the exclusive date on which the intermission ended. Reasons are manual rollover, one-time hold, and restore. Phase 15 now creates the restore reason after importing the latest Season without changing its original boundaries.

Every Season remains exactly 30 user-local calendar days. Season numbers come from the latest persisted Season, gaps are allowed, overlaps are rejected by the lifecycle resolver, and `calendar_started_on` remains immutable. An ended Season receives its final Rank and `finalized_at` snapshot before rollover or intermission.

Phase 14 adds the presentation half of that boundary. Automatic rollover gates the next introduction on the immediately preceding recap, while manual and held rollover render the recap throughout the open intermission. Optional reflection and `recap_seen_at` are the only stored recap state; all outcome and SP groups remain derived.

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

Phase 11 coverage includes manual rollover, automatic backfill compatibility, one-time holds, preference restoration, starts after long gaps, repeated start idempotency, final Rank snapshots, recurrence resumption without gap occurrences, intermission routing, and historical/non-seasonal page availability. Explicit cross-module boundary tests reject Task completion, Habit occurrence mutation, Diary autosave, Constitution violations, and Objective completion during intermission while preserving Task planning, Money transactions, Law definitions, and Settings changes.

## Portability integration

The Phase 15 importer validates the complete Season/intermission timeline, synchronizes scheduled behavior only through the imported latest Season's original end date, and creates or reconciles one open `restore` intermission after that Season. If Day 30 is still ahead, the Season continues and the intermission is reserved for its next day. If Day 30 passed, Rank and finalization are completed without creating intermediate Seasons. Starting the held Season closes the intermission, clears the one-time hold, and restores the already-imported long-term automatic/manual preference.

Month- and year-long restore tests prove that no empty Seasons are fabricated. Fresh and replacement workflows both route through Welcome Back and the imported closeout before the held next Season starts.
