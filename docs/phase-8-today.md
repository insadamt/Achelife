# Phase 8 Today

## Scope

Phase 8 replaces the temporary home-page showcase with Today, Achelife's daily operational screen. Today aggregates Seasons, Tasks, Habits, Diary, Season Objectives, Constitution, and Money. It does not own any module mutation, add Statistics, or introduce ranks.

## Aggregation architecture

`TodayViewDataFactory` is the dedicated authenticated read layer. It synchronizes recurring Tasks and Habit occurrences through the application-local current date, then queries only the compact current-day and utility data needed by Today. Existing module view-data factories serialize Tasks, Seasons, Laws, Money Accounts, and Money Categories so their established presentation rules remain consistent.

Today reuses the existing Task completion, Habit occurrence, Objective toggle, Violation recording, and Money transaction endpoints. Each action redirects back to Today, where Inertia refreshes the aggregate from authoritative backend state and current Season SP.

## Daily Progress

Daily Progress includes only Tasks scheduled today, required Habit occurrences today, and today's Diary. Completed Tasks count as resolved. Required Habits count as resolved when Completed or Skipped; Pending and Missed do not. The Diary counts as one resolved obligation only when the persisted entry satisfies the existing completion engine. Overdue and upcoming Tasks, Flexible Habit extras, Objectives, Constitution, and Money never enter the numerator or denominator.

## Tasks and Habits

Today shows a compact bounded Overdue list, all visible Tasks scheduled today, and a five-item Upcoming preview only when no incomplete Today Task remains and its Today preference is enabled. Overdue Tasks do not block Upcoming.

Required Habits remain prominent and expose Boolean completion, Numeric value entry, and an explicit Skip action. Flexible extras use the same valid occurrence actions but stay in a collapsed secondary section and never affect Daily Progress. Turning off the Flexible preference prevents that section from being returned to Today.

## Diary and Objectives

The Diary panel deep-links to the real current date and displays its backend-derived completion state, streak, and earned SP. It does not embed or approximate the editor's validity rules.

Current-Season Objectives expose completion toggles only. Definition setup, renaming, and removal remain on Seasons. Objective rewards update shared Season SP through the existing Objective action and do not affect Daily Progress.

## Quick actions

The Constitution utility lists only active Laws, lets the user select one, then reuses the existing violation dialog with today's date, sequence, multiplier, and penalty preview. The Money utility shows currency-separated balances and opens the existing transaction drawer with Income, Expense, or Transfer preselected. Transaction actions are withheld when there are no active Accounts, and Transfer is disabled when no matching-currency Account pair exists.

## Today settings

`today_settings` stores two user-owned Boolean preferences, both defaulting to enabled:

- show Flexible Habits;
- show upcoming Tasks after Today Tasks are clear.

The compact header dialog persists both values through the authenticated Today settings route. Preferences affect Today presentation only.

## Interface

The page uses a dominant progress hero followed by the daily flow on the primary desktop column and Season Objectives plus utilities on the secondary column. Mobile collapses to a single vertical mission flow. Completed obligations remain visible with reduced emphasis, optional Habits remain collapsed, and all direct state controls have accessible labels and keyboard behavior.

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

The Today tests cover aggregation, exact Daily Progress math, Skipped and Flexible Habit semantics, overdue exclusion, Upcoming reveal rules, settings defaults and isolation, Objective and Constitution SP behavior, Money transaction integration and currency-separated balances, cross-user isolation, and Season Day 30-to-Day 1 transition.
