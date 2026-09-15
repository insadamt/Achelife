# Phase 1 — Organization domain and portability

## Goal

Add Folder, Project, Task organization, notes, and explicit ordering without redesigning the Tasks interface. Extend account portability at the same time so exports never omit the new user data.

## Persistence

Add user-owned `TaskFolder` and `TaskProject` models.

Minimum Folder fields:

- `id`, `user_id`, `name`, `position`, and timestamps

Minimum Project fields:

- `id`, `user_id`, nullable `task_folder_id`, `name`, `position`, and timestamps

Extend Tasks with:

- nullable `task_project_id`; null means Inbox
- nullable plain-text `notes`
- `position`

Extend `TaskSeries` with the Project and notes template data needed to materialize future occurrences. Old rows must receive safe defaults and remain valid.

Add ownership-safe foreign keys and indexes for user, parent, and position queries. Choose deletion rules that preserve the locked behaviors rather than relying accidentally on database cascades.

## Recurring behavior

- Editing Project or notes on an occurrence updates that occurrence and the series template from that occurrence forward.
- Regenerated, uncompleted future occurrences receive the updated Project and notes.
- Past occurrences retain their stored Project and notes.
- Task position is occurrence-specific and is not a series template field.
- Deleting a Project clears it from Tasks and recurring templates so future occurrences enter Inbox.

Use the existing forward-update boundary and do not collapse the distinction between series templates and occurrences.

## Lifecycle behavior

- Deleting a Folder moves its Projects to the root and normalizes their positions.
- Deleting a Project moves its Tasks to Inbox, clears affected recurring templates, and normalizes positions.
- Deleting either parent must never delete Tasks.
- All mutations validate ownership; cross-user parent IDs are rejected.

## Account portability

- Advance to the next archive format version.
- Export and restore Folders before Projects, and Projects before Task series and Tasks.
- Include Task and series Project references, notes, and ordering.
- Register an explicit adapter for every previously supported archive format.
- Restore old archives with no Folders or Projects, null notes, default positions, and every Task in Inbox.
- Validate relationships, ownership, allowed columns, counts, and deterministic remapping.
- Preserve all existing completion/SP fields exactly.

## Verification

- [x] Folder and Project CRUD
- [x] Root Project and Project inside Folder
- [x] Standalone Inbox Task and Project Task
- [x] Moving a Task to Inbox at the domain layer
- [x] Folder deletion preserves and reroots Projects
- [x] Project deletion preserves Tasks and updates recurring templates
- [x] Ownership and cross-user rejection
- [x] Recurring Project and notes forward inheritance
- [x] Past recurring occurrences remain unchanged
- [x] Existing database migration defaults
- [x] New-format export/restore round trip
- [x] Every older archive format restores through its explicit adapter
- [x] Existing Task, Today, completion, SP, and statistics tests remain green

The implementation and validation evidence are recorded in the [Phase 1 completion report](phase-1-completion-2026-09-13.md).

## Exit criteria

The organization domain and portable format are complete, old data upgrades automatically, and existing Task interfaces still work without requiring the Phase 3 redesign.
