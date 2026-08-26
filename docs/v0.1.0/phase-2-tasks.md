# Phase 2 Tasks

## Scope

Phase 2 adds global Tasks, dynamic Eisenhower rewards, recurrence, independent occurrence history, subtasks, rescheduling, and Season-safe completion locking. Habits, Diary, Objectives, Constitution, Money, Task statistics, rank thresholds, and other reward sources remain deferred.

## Data model

- `tasks` stores one-time Tasks and materialized recurring occurrences. Each row owns its title, current scheduled date, importance, completion timestamp, recurrence snapshot, exact earned SP, timing classification, importance-at-completion, and receiving Season.
- `task_series` stores the current forward recurrence template: daily or selected weekdays, start boundary, optional exclusive stop boundary, current title and importance, subtask template, and synchronization watermark.
- `subtasks` stores an ordered checklist snapshot for one Task occurrence. Subtasks never award SP.
- `task_reschedules` stores every scheduled-date change with its previous date, new date, and timestamp.
- `task_series_exclusions` prevents a deleted single occurrence from being rematerialized later.

Tasks remain attached directly to their user rather than to the Season in which they were created or scheduled.

## Recurring occurrence synchronization

`SynchronizeRecurringTaskOccurrences` uses a rolling model. A recurring series keeps at most one incomplete occurrence scheduled for today or the future. Repeated synchronization is idempotent while that occurrence remains pending.

When the pending occurrence is completed or becomes overdue, synchronization creates the next eligible occurrence. If several eligible dates elapsed while the application was not synchronized, each missed occurrence is retained as independent overdue history, but synchronization stops as soon as it reaches one current or upcoming occurrence. Completing a recurring occurrence advances its series immediately. The Tasks page also synchronizes on access so overdue occurrences advance without requiring completion.

Only the earliest incomplete current-or-future occurrence from each series is shown. This keeps databases created by the former future-window strategy usable without deleting existing user data: previously materialized future rows are revealed one at a time. One-time future Tasks remain visible without a date window.

Each occurrence receives snapshots of the series title, importance, recurrence pattern, and subtask template. Editing an incomplete recurring occurrence updates that occurrence and the series template forward from its recurrence anchor. Earlier occurrences remain unchanged. The next occurrence uses the updated template; completed occurrences remain untouched.

Deleting one recurring occurrence writes an exclusion. Deleting that occurrence and its future writes an exclusive `ends_before` boundary and removes only incomplete materialized occurrences from that point. Earlier history is preserved.

## Dynamic rewards and Season attribution

`TaskRewardCalculator` is the authoritative reward calculator:

| Important | Completion timing | Reward |
| --- | --- | ---: |
| Yes | Early / not urgent | 16 SP |
| Yes | Due date / urgent | 8 SP |
| Yes | Late | 4 SP |
| No | Early / not urgent | 2 SP |
| No | Due date / urgent | 4 SP |
| No | Late | 2 SP |

The composer and incomplete Task rows show a live projection, but completion recalculates the result from the actual completion date. `CompleteTask` synchronizes the Season containing that timestamp, adds the reward to it, and persists the exact reward and Season on the Task in one transaction.

The completion timestamp remains a UTC instant. Its completion date, timing classification, recurrence advancement, and receiving Season are derived from the user's saved timezone.

During the same active reward Season, `MarkTaskIncomplete` subtracts exactly the stored reward from that same Season and clears the completion attribution. A later completion recalculates from its new timestamp. Once another Season is current, the completion, Task, and historical SP are permanently locked.

## Interface

`/tasks` uses a sticky conversational composer rather than an add-button workflow. It begins as one input and expands on focus to expose icon-led date, Important, recurrence, and subtask controls. Title and Enter/Create are sufficient. Projected SP appears only after a non-empty title and updates immediately.

Four focused tabs organize the timeline into Today, Overdue, Upcoming, and Completed. Today owns only incomplete Tasks scheduled for the current date; every completed Task belongs to Completed so records never appear in two tabs. Overdue uses bounded pagination, while Completed appends bounded chunks with a Load more action. Upcoming shows every one-time future Task and only the next pending occurrence from each recurring series. Rows keep completion, title, date, importance, projected or earned SP, and conditional recurrence or checklist indicators visible. A Task with subtasks exposes an inline expandable checklist so its existing items can be completed without opening the details sheet.

Selecting a Task opens a read-first full-height responsive sheet. Incomplete title, schedule, and checklist sections each open a focused editor and save independently. Recurring edits keep their forward-only behavior. Removal lives behind a compact action menu and confirmation. Completed Tasks are read-only, show exact reward attribution, and allow reversal only while their reward Season remains active.

## v1 intermission extension

Phase 11 keeps Task creation and rescheduling available during intermission but blocks rewarded completion. Recurring series do not materialize gap occurrences and resume from the first eligible date on or after the next Season start.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```

Task tests cover quick creation, custom fields and subtasks, completion prerequisites, all six reward outcomes, Season attribution, exact reversal, recompletion, historical locking, global incomplete Tasks, reschedule history, both recurrence patterns, rolling one-pending recurrence, overdue and completion advancement, independent missed occurrences, subtask snapshots, forward-only template editing, both recurring deletion choices, and cross-user authorization.
