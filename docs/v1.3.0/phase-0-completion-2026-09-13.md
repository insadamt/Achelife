# Phase 0 completion report — 2026-09-13

## Outcome

The pre-v1.3.0 baseline is green. Phase 0 changed no application behavior or schema. The current Task, Today, statistics, and portability boundaries below are the regression contract for Phase 1.

## Task lifecycle baseline

- One-time creation validates a `TaskData` DTO, stores the Task directly for the user, then creates ordered Subtask snapshots.
- Editing is limited to incomplete Tasks. A schedule change appends a `task_reschedules` row before updating the Task, and Subtasks are synchronized in their submitted order.
- Completion locks the Task, requires every Subtask to be complete, calculates the reward from the actual user-local completion date, increments the receiving Season, and stores the exact timing, importance, SP, and Season attribution on the Task in one transaction.
- Undo is allowed only while the attributed Season is current. It subtracts the stored reward from that exact Season and clears the completion attribution. Historical-Season completions remain locked.
- Deleting an incomplete one-time Task removes it. Completed Tasks cannot be deleted.

## Recurring baseline

- `task_series` is the forward template. It owns title, importance, recurrence type, weekdays, Subtask template, start and stop boundaries, and the materialization watermark.
- `tasks` contains occurrence snapshots: title, scheduled and occurrence dates, importance, recurrence fields, completion fields, exact reward, and receiving Season. Subtasks are separate ordered occurrence snapshots.
- Synchronization retains overdue occurrences but stops once a series has one incomplete occurrence scheduled for today or later. It is idempotent while that pending occurrence exists.
- Editing an incomplete recurring occurrence updates the occurrence and the series template from that occurrence anchor. Later incomplete materializations are deleted and regenerated; earlier and completed occurrences remain unchanged.
- Deleting one recurring occurrence records an exclusion before removing it. Stopping a series sets the exclusive `ends_before` boundary and deletes only incomplete occurrences at or after the selected anchor.
- During an intermission, recurring occurrences on or after the intermission start are removed. Materialization resumes from the next eligible date when a Season starts.

## SP and presentation baseline

- `TaskRewardCalculator` remains the sole Task reward authority. Rewards are calculated from importance and the actual user-local completion date relative to the scheduled date.
- `/tasks` synchronizes recurring occurrences first, then exposes separate Today, Upcoming, Overdue, and Completed collections. It shows only the earliest current-or-future incomplete occurrence per series; Overdue and Completed use bounded pagination.
- Today performs the same recurring synchronization. It includes today's Tasks and up to five overdue Tasks, and Task completion contributes to Daily Progress only through today's Task collection.
- `TaskViewDataFactory` is the common Task payload boundary for `/tasks` and Today. It exposes stored completion attribution for completed Tasks and live projected rewards only while an active Season exists.
- The Task frontend is split across the page components and focused composer, row, drawer, editor, checklist, recurrence, pagination, tab, presentation, and statistics components under `resources/js/features/tasks`.

## Statistics baseline

- Task statistics use completed Task occurrence rows, stored rewards, stored importance, and stored timing. Subtasks are not counted independently.
- Season, Month, and Year resolve a selected period plus the entire previous period. All time has no comparison. Future completions are excluded.
- Season and Month trends are daily; Year and ordinary All time trends are monthly; All time switches to yearly buckets beyond 36 months. Missing buckets are zero-filled and future dates are omitted.
- Statistics queries are independent of Task-list pagination and use the user's saved timezone for completion dates.

## Portability baseline

- New exports use archive format 3. Formats 1 and 2 remain explicitly supported; format 1 Habit rows without `icon` receive the in-memory `check` default.
- Portable Task dependency order is `task_series`, exclusions, `tasks`, Subtasks, then reschedules. Current Task fields and every stored completion/SP field are exported exactly.
- Validation checks declared files, allowed columns, counts, ownership, relationships, checksums, timeline semantics, and Season SP totals before import.
- Restore deletes the existing scoped graph in reverse dependency order, imports in forward order, assigns destination-local IDs, and remaps every foreign key. Recurring Task catch-up is bounded by the imported latest Season's original Day 30 and does not fabricate intermission occurrences.

## Repository and migration baseline

- Branch: `master`.
- Before Phase 0 documentation was recorded, the worktree already contained the modified `docs/README.md` and the untracked `docs/v1.3.0/` roadmap. Those planning changes were preserved.
- `php artisan migrate:status --no-ansi` reported every migration through `2026_09_12_000002_add_archived_at_to_money_tags` as Ran, with no pending migration.
- Phase 0 added no migration and made no product-code change.

## Validation

Run on 2026-09-13:

- `composer test` — passed: Pint passed; PHPUnit passed 366 tests with 2,584 assertions.
- `npm run types:check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; Vite 8.2.1 transformed 2,494 modules and completed the production build in 725 ms.

No pre-existing regression or environmental failure was found. UI verification was not required because Phase 0 changes no interface or application behavior.

## Phase 1 boundary

Phase 1 may now add the organization domain and archive format extension. It must preserve the lifecycle, recurrence, SP, Today, statistics, and old-archive behavior recorded above.
