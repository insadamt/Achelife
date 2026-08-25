# Phase 1 Seasons

## Scope

Phase 1 introduces Achelife's first domain module: automatic 30-calendar-day Seasons. Tasks, Habits, Diary, Objectives, Constitution, Money, rank thresholds, rewards, and standalone statistics remain deferred.

## Calendar model

- Calendar dates use the authenticated user's saved IANA timezone. UTC remains the timestamp storage timezone.
- A permanent user-owned calendar start date anchors Season 1, so later timezone changes never rewrite the Season timeline.
- Season 1 starts on the account creation date and ends 29 days later.
- Every following Season starts the day after the previous Season ends.
- The start date is Day 1, so Day 30 remains in the same Season and Day 31 begins the next.
- Current and completed states are derived from dates. They are not mutable database flags.
- A unique Season number, start date, and end date per user protect the timeline from duplicate records.

## Synchronization

`SynchronizeUserSeasons` owns calendar calculation and persistence. It locks the user row in a transaction, derives the current Season number from the account creation date, creates any missing records in sequence, and returns the Season containing the supplied calendar date.

Authenticated application entry synchronizes the timeline, so advancing Seasons does not depend on a timer or scheduled job. Existing accounts with no Season records are initialized from their original `created_at` date. Repeated synchronization is idempotent.

Only elapsed and current Seasons are persisted. The next two locked Seasons on the Seasons page are response-only view data and never become database rows.

## Registration and introductions

Registration creates the user and Season 1 in the same database transaction. Authentication occurs only after that transaction succeeds, and the user is sent to the Season introduction.

Each persisted Season has a nullable `introduced_at` timestamp. A newly current Season remains unacknowledged until its short full-screen introduction completes or the user selects the immediate continue action. If several Seasons passed during an absence, missing historical Seasons are acknowledged during synchronization and only the actual current Season is introduced.

## Season progression foundation

Each Season stores its own `season_points`, defaulting to zero, and a nullable `rank`. This preserves the boundary needed to credit future actions to the Season in which they were performed. Rank thresholds, promotion logic, reward sources, and a progression ledger are intentionally not part of Phase 1.

## Interface

`/seasons` uses a compact horizontal collection of geometric Season tokens. Historical and current tokens are selectable by pointer, touch, or keyboard and use completion, crown, and lock icons instead of miniature information cards. Selected and current states remain visually distinct while a direct return-to-current action keeps historical browsing oriented. Future tokens communicate their locked state without exposing Rank or progress.

The selected real Season updates a unified command center rather than separate overview screens. Rank, SP, calendar position, Objective completion, and Objective setup status stay visible together. A compact 30-tick Season pulse uses taller milestone ticks and a distinct current-day marker. Motion, including programmatic token centering, uses the global reduced-motion behavior from Phase 0.5.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```

The Season tests cover registration dates, Day 1/30/31 boundaries, numbering, long-absence backfill, idempotency, existing-account initialization, view-only future placeholders, introduction acknowledgement, skipped Seasons, and cross-user authorization.
