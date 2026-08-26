# Phase 8 Today

## Scope

Phase 8 replaces the temporary home-page showcase with Today, Achelife's daily operational screen. Today presents Seasons, Tasks, Habits, Diary, and Season Objectives. It does not own any module mutation or add Statistics.

## Aggregation architecture

`TodayViewDataFactory` is the dedicated authenticated read layer. It synchronizes recurring Tasks and Habit occurrences through the authenticated user's local current date, then queries only the compact current-day data needed by Today. Existing module view-data factories serialize Tasks and Seasons so their established presentation rules remain consistent.

`ProgressPanelViewDataFactory` supplies the authenticated application shell independently of Today, so the same current Season, Today SP, Diary, and Objective summary remains available on every application page. `SeasonPointsAttributedOnDate` is the shared authority for the date-attributed SP total.

Today reuses the existing Task completion, Habit occurrence, and Objective toggle endpoints. Each action redirects back to Today, where Inertia refreshes the aggregate from authoritative backend state and current Season SP.

## Daily Progress

Daily Progress includes only Tasks scheduled today, required Habit occurrences today, and today's Diary. Completed Tasks count as resolved. Required Habits count as resolved when Completed or Skipped; Pending and Missed do not. The Diary counts as one resolved obligation only when the persisted entry satisfies the existing completion engine. Overdue and upcoming Tasks, Flexible Habit extras, Objectives, Constitution, and Money never enter the numerator or denominator.

## Tasks and Habits

Today shows a bounded Overdue list followed by Tasks scheduled for the current date. They can be completed or reversed from the focused checklist, and Tasks with subtasks expand inline so existing checklist items can be toggled without leaving Today. Creation, Task editing, subtask definition changes, upcoming planning, and history remain on Tasks. Completed Tasks move into a collapsed group.

Required Habits use compact progress cards and expose Boolean completion, Numeric value entry, and a guarded Skip action. Flexible extras use the same valid occurrence actions but stay in a collapsed secondary section and never affect Daily Progress. Turning off the Flexible preference prevents that section from being returned to Today.

## Diary and Objectives

The Diary panel deep-links to the real current date and displays its backend-derived completion state, streak, and earned SP. It does not embed or approximate the editor's validity rules.

Current-Season Objectives expose completion toggles only. Definition setup, renaming, and removal remain on Seasons. Objective rewards update shared Season SP through the existing Objective action and do not affect Daily Progress.

## Today SP

Today SP sums Task completions, Habit occurrences, Diary rewards, Objective completions, and Constitution penalties attributed to the current calendar date and current Season. Money remains excluded. The value is informational, never mutates progression independently, and is exposed through the global progress notch on every authenticated application page.

## Today settings

`today_settings` retains its original user-owned Boolean columns for backward compatibility. The redesigned Today interface exposes one active preference, enabled by default:

- show Flexible Habits;

The header settings control opens a compact dialog that persists this value through the authenticated Today settings route. The preference affects Today presentation only.

## Interface

Desktop presents Tasks and Habits inside two distinct side-by-side containers. Mobile uses a two-state switcher to preserve working space. Tasks use a restrained checklist; Habits use compact progress cards with checkbox controls. Settings remain in the page header. The global application-shell notch is a tall, narrow arrow attached to the viewport edge; it opens a custom attached panel containing only Today SP, Season total and Rank brief, Diary status, and Objectives. Today uses Lucide icons for consistent action and status symbols. All direct state controls have accessible labels and keyboard behavior.

## v1 intermission extension

Phase 11 replaces the ordinary Today aggregate with an intermission dashboard when no Season is active. The dashboard shows the last closeout, pause reason, elapsed rest days, and the exact dates of the next manually started Season.

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

The Today tests cover aggregation, exact Daily Progress math, Skipped and Flexible Habit semantics, bounded Overdue presentation, settings defaults and isolation, globally shared date-attributed SP, Objective and Constitution SP behavior, Money isolation, cross-user isolation, and Season Day 30-to-Day 1 transition.
