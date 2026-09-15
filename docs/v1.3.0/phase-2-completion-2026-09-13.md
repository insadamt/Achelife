# Phase 2 completion report — 2026-09-13

## Outcome

Phase 2 adds the transactional movement and ordering backend required by the future Tasks explorer. It does not implement the Phase 3 workspace interface and does not change the database or archive format introduced in Phase 1.

## Added

- Added a Folder reorder command for the complete root Folder sibling list.
- Added Project reorder and bounded movement commands for root and Folder sibling lists.
- Added Task reorder and bounded movement commands for Inbox and Project sibling lists.
- Added focused movement DTOs, validation requests, controllers, Actions, and a shared sibling-order service.
- Added a navigation-only explorer payload with ordered Folders, nested Projects, root Projects, Project counts, open-Task counts, and Inbox count.
- Added explorer movement and payload coverage for valid, invalid, repeated, stale, missing, malformed, and cross-user requests.

## Ordering and safety

- Every reorder submits the complete sibling ID set. Duplicate, missing, extra, foreign, and cross-container IDs are rejected before any position changes are committed.
- Every move submits a typed destination and a bounded insertion position. Projects can target only a Folder or root; Tasks can target only a Project or Inbox.
- Movement Actions revalidate ownership after request validation and lock the destination parent, moved record, and affected sibling rows inside a transaction.
- Source and destination lists are normalized to contiguous zero-based positions after every move. Repeating an already-applied reorder or move is idempotent.
- Ordinary Project and Task update endpoints no longer accept parent changes. Parent relationships can change only through the dedicated movement commands.
- Folder positions and root-Project positions remain separate. Every Folder, Project container, and Task container maintains its own sibling order.

## Recurring Tasks

- Moving an incomplete recurring occurrence updates the selected occurrence and its series Project template.
- Earlier occurrences retain their stored Project. Later incomplete materializations are regenerated under the new Project with occurrence-specific positions.
- Completed Tasks retain the existing read-only rule and cannot be moved.
- Smart Today, Upcoming, Overdue, Completed, and search ordering remains independent from manual Project and Inbox positions.

## Explorer payload

- `/tasks` now includes `explorer.folders`, `explorer.rootProjects`, and `explorer.inboxCount`.
- Folder and Project nodes expose stable IDs, names, positions, and open-Task counts. Folder nodes also expose Project counts.
- Counts exclude completed Tasks and update after completion, movement, and deletion.
- Complete Task collections are not duplicated inside explorer nodes.

## Compatibility

- Phase 2 adds no migration and does not advance archive format 4.
- Existing creation, editing, completion, undo, recurrence, SP, Season attribution, Today aggregation, statistics, and portability behavior remains unchanged.
- Phase 1 Folder and Project rename endpoints remain compatible; their parent is now intentionally preserved until a movement command is used.
- No installed Docker instance was modified.

## Verification

- `composer test` — passed: Pint passed; PHPUnit passed 385 tests with 2,727 assertions.
- `npm run types:check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; Vite 8.2.1 transformed 2,494 modules and completed the production build in 743 ms.
- `php artisan route:list --path=task --except-vendor --no-ansi` — passed; all 20 Task, Folder, Project, order, and movement routes are registered without collisions.
- Phase 2 production files remain below 500 lines; the largest Phase 2 test file is 326 lines.
- `git diff --check` — passed.

## Known limitations

- Phase 2 exposes backend commands only. Drag-and-drop, accessible Move controls, explorer navigation, responsive layouts, and movement announcements remain assigned to Phase 3.
- The explorer counts open Tasks for navigation. Completed records remain available through the existing Completed smart view.
