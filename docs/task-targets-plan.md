# Task Targets plan

## Product direction

A Target is a goal inside one Project. It groups the Tasks that contribute to that goal and reports the completion work and Focus Time invested in it.

The hierarchy becomes `Folder → Project → Target → Task`, while preserving two existing paths:

- A Project may still contain Tasks that are not assigned to a Target.
- Inbox Tasks remain unassigned and cannot belong to a Target.

Targets should organize work without changing Task rewards, Season Points, Rank, recurrence, scheduling, or completion rules.

## MVP contract

Each Target has:

- a user and Project owner
- a name and optional plain-text description
- a manual position within its Project
- an open or completed state, represented by a nullable completion timestamp
- created and updated timestamps

Each Task and recurring Task template receives a nullable Target relationship. A Target selection is valid only when it belongs to the Task's selected Project and user.

The first release should not add estimates, percentages entered by the user, nested Targets, cross-Project Targets, Target dependencies, Target SP, or Target-specific custom statuses.

## Lifecycle rules

- Creating a Task from a Target preselects both its Project and Target.
- Moving a Task within the same Project preserves its Target unless the user selects another Target or Unassigned.
- Moving a Task to another Project or Inbox clears its Target. A later enhancement may offer a destination Target in the move dialog.
- Changing the Target of a recurring occurrence updates that occurrence and future occurrences, matching current Project-edit behavior. Past occurrences remain unchanged.
- Deleting a Target moves its Tasks to the Project's Unassigned section and clears it from affected recurring templates. It never deletes Tasks or Focus Sessions.
- Deleting a Project continues to move Tasks to Inbox and must delete its now-empty Targets only after Task and recurring-template Target references are cleared.
- Completing a Target records `completed_at` but does not automatically complete its Tasks. Reopening clears `completed_at`.
- Open Tasks may remain under a completed Target; the interface should warn about them and require explicit confirmation before completion.

## Project experience

The Project screen should expose:

- a compact Target switcher with All Tasks, Unassigned, and each Target
- a New Target action
- Target cards showing open Task count, completed Task count, completion rate, and Focus Time
- the existing Today, Overdue, Upcoming, and Completed Task views scoped to the selected Target
- a Target details action for rename, description, completion, reopening, reordering, and deletion
- an explicit Back control that returns to the containing Folder or Files root

The composer inherits the open Project and selected Target. Edit and Move dialogs expose a Target field only after a Project is selected. Search results show both Project and Target context.

## Statistics definitions

Target analytics should use the existing completed Focus intervals as the authoritative duration source:

- **Focus Time:** duration from completed Focus intervals belonging to Tasks currently assigned to the Target, split at user-local period boundaries
- **Focus Sessions:** distinct completed sessions contributing duration in the selected period
- **Average Session:** attributed Focus Time divided by contributing sessions
- **Tasks completed:** Tasks assigned to the Target whose completion timestamp falls in the selected period
- **Current progress:** completed assigned Tasks divided by all currently assigned Tasks; unavailable when the Target has no Tasks
- **Most-focused Tasks:** assigned Tasks ordered by attributed Focus Time

Running and paused sessions remain excluded until completed. Moving a Task between Targets moves its Focus history to its current Target, matching existing Project attribution. Renaming a Target changes its historical label. No Target-name or Target-id snapshot is added to Focus Sessions.

The Statistics page should add a Target breakdown below the Project breakdown and allow a Project filter to narrow the Target list. Target statistics must cover all matching data independently of Task-list pagination.

## Persistence and backward compatibility

Use additive migrations only:

1. Create `task_targets` with user ownership, `task_project_id`, name, description, position, nullable `completed_at`, and timestamps.
2. Add nullable `task_target_id` columns to `tasks` and `task_series`.
3. Add indexes for Project ordering, Target-scoped Task queries, and statistics joins.

Existing rows default to a null Target, so old databases retain their exact behavior. Foreign-key deletion behavior must not silently delete Tasks. Domain actions should clear relationships transactionally before deleting a Target or Project.

Account archives require a new format version. Export Targets before recurring templates and Tasks, then include nullable Target references on both. Older archive versions restore every Task as unassigned. Validation must reject cross-user and cross-Project Target references. Regression fixtures must cover the previous archive format and the new round trip.

## Implementation phases

### Phase 1 — Domain and portability

- Add migrations, model relationships, authorization, Requests, DTOs, and create/update/reorder/complete/reopen/delete actions.
- Extend Project deletion and recurring Task propagation rules.
- Version export, restore adapters, semantic validation, and archive tests in the same phase.

### Phase 2 — Assignment and navigation

- Add Target selection to Task create, edit, and movement flows.
- Add Target-scoped workspace resolution and view-data payloads.
- Preserve URL parameters and safe fallbacks for missing, deleted, or unauthorized Targets.

### Phase 3 — Project UI

- Add the Target switcher, cards, creation and management dialogs, empty states, and mobile layout.
- Add drag ordering with an equivalent accessible Move action.
- Add Project and Target breadcrumbs and Back controls.

### Phase 4 — Statistics and hardening

- Add Target Focus and completion metrics using the existing period resolver and timezone allocation rules.
- Verify empty periods, moves, renames, deletions, recurring Tasks, and completed Targets.
- Run migration, upgrade, archive, authorization, accessibility, responsive, light/dark, and full regression checks.

Because this feature changes persistent data and account archives, it must ship first as an internal release candidate and be promoted only after upgrade, restore, and rollback verification passes.

## Acceptance checklist

- [ ] Create, edit, reorder, complete, reopen, and delete a Target
- [ ] Assign ordinary and recurring Tasks to a Target
- [ ] Keep existing Project Tasks valid as Unassigned
- [ ] Reject cross-user and cross-Project assignments
- [ ] Clear Target safely when moving a Task or deleting its Target or Project
- [ ] Preserve past recurring occurrences during forward-only changes
- [ ] Report exact completed Focus Time by Target and selected period
- [ ] Exclude active Focus Time and avoid changes to SP or Rank
- [ ] Restore previous archive versions and round-trip the new format
- [ ] Upgrade a previous database without changing existing Task behavior
- [ ] Verify keyboard, screen-reader, mobile, desktop, light, and dark experiences
