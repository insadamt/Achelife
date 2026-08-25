# Phase 7 Season Objectives

## Scope

Phase 7 adds Boolean Objectives inside each Season. Objectives are not a global module, have no standalone page or navigation destination, and never carry into another Season. Today, rank thresholds, Objective statistics, descriptions, targets, partial progress, subtasks, deadlines, recurrence, and arbitrary rewards remain deferred.

## Data model and history

`objectives` stores authenticated user and Season ownership, title, stable creation order, completion timestamp, exact earned-SP snapshot, normal timestamps, and a soft-deletion timestamp. The composite foreign key requires every Objective to share its user with its Season. Soft deletion preserves setup-window removal history without exposing deleted Objectives in the current or completed Season view.

Completion state is derived only from `completed_at`: a null timestamp and reward are Incomplete; a non-null timestamp and exact reward are Completed. Model invariants require the timestamp and reward to exist together and constrain stored rewards to the centralized 100, 150, or 300 SP distribution.

## Season lifecycle and authorization

`SeasonLifecycle` is the shared authority for active-state and Season-day calculation. Objective definitions can be created, renamed, or deleted only on Season Days 1–7. Completion can be toggled throughout Days 1–30. Every definition and completion mutation is rejected after its window closes, and completed Seasons are permanently read-only.

Every route is nested under its Season and uses scoped model binding. Policies and request authorization reject cross-user view, create, rename, delete, and completion operations. The backend serializes mutations by locking the owning Season and enforces the maximum of three active Objectives independently of frontend controls.

## Rewards and exact-delta rebalancing

`ObjectiveRewardCalculator` is the sole distribution authority:

| Active Objectives | Reward each | Possible total |
| ---: | ---: | ---: |
| 0 | 0 SP | 0 SP |
| 1 | 300 SP | 300 SP |
| 2 | 150 SP | 300 SP |
| 3 | 100 SP | 300 SP |

Creation and deletion during setup may change the count. Each mutation captures the prior sum of active Objective reward snapshots, updates every completed Objective to the newly applicable exact reward, and applies only `new Objective contribution - previous Objective contribution` to locked `season_points` in the same transaction. Deleting a completed Objective excludes its former reward before remaining completed Objectives are rebalanced.

Completion stores the current exact reward and timestamp; reversal clears both. The same exact-delta mechanism supports positive or negative Season totals and never recalculates or overwrites Task, Habit, Diary, or Constitution contributions. Money remains entirely separate from SP.

## Season interface

Objectives remain visible directly below the selected Season command center and are never hidden behind a tab. The compact mission board uses icon-led status chips for slots, current per-Objective reward, earned Objective SP, and setup locking. Numbered mission cards provide Boolean completion controls plus compact create, rename, and confirmed-delete dialogs. The create dialog previews the resulting per-Objective reward before submission.

After Day 7, definition controls disappear while completion remains interactive. Completed Seasons show the same Objectives as a read-only historical summary with completion count and exact earned SP. The current Season timeline carries only a small Objective completion summary; the full experience remains in Season details.

Existing historical Seasons have zero Objectives unless records were explicitly created. An existing current Season already beyond Day 7 cannot add them retroactively. Synchronizing a new Season creates no Objective records and never copies prior ones.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```

Objective tests cover Day 1/7/8 definition boundaries, the three-item backend maximum, reward distribution, completion and reversal throughout the active Season, completed-Season locking, every count rebalance direction, deletion of incomplete and completed Objectives, shared-SP isolation across all existing progression modules, negative balances, no carry-over, existing-Season behavior, view scoping, and cross-user mutation authorization.
