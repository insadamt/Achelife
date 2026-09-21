# Achelife v1.3.0 Tasks 2.0 roadmap

## Goal

Achelife v1.3.0 turns Tasks from a mostly flat list into an organized personal productivity workspace. The release adds Folders, Projects, Inbox Tasks, file-explorer navigation, accessible movement and ordering, notes, Focus Time, a persistent global timer, and expanded Task statistics.

The release remains Task-focused. Focus Time is informational and never awards SP or affects Rank.

## Locked product decisions

- The hierarchy is `Folder → Project → Task → Subtasks and Focus Sessions`.
- Folders contain Projects only and cannot be nested.
- Projects may belong to a Folder or appear at the root.
- Tasks may belong to a Project or remain unassigned in the virtual Inbox.
- Changing the Project or notes of a recurring occurrence updates that occurrence and future occurrences. Past occurrences remain unchanged.
- Task ordering is occurrence-specific and is not copied through the recurring series.
- Deleting a Folder moves its Projects to the root.
- Deleting a Project moves its Tasks to Inbox and clears the Project from affected recurring templates.
- Focus statistics follow a Task's current Project. Moving the Task moves its historical Focus totals to the new Project.
- Deleting a Task deletes all Focus Sessions and intervals belonging to it.
- A user may keep one open Focus Session per Task, with any number paused and only one running counter across all Tasks.
- Switching Tasks pauses the running session and starts or resumes the selected Task at the same server timestamp. Completing a Task finishes its open Focus Session.
- A running timer measures server time even while the browser is closed. Reloading reconstructs it from persisted timestamps.
- Focus duration is split precisely across user-local day, month, and Season boundaries.
- Manual and edited Focus Sessions cannot overlap another Focus interval owned by the user.
- Account portability is extended in the same phases that introduce persistent data, not deferred until final hardening.
- Existing Task completion, recurrence, rescheduling, SP, Season attribution, Today integration, and statistics remain backward compatible.

## Explicit non-goals

- Groups, nested Folders, Tags, Teams, assignees, comments, custom statuses, or Task dependencies
- Estimated Task duration or estimation statistics
- Kanban or Gantt views
- Pomodoro behavior
- SP rules based on Focus Time
- Unrelated Money, Habit, Diary, Season, or Constitution work
- Future Dynamic Island events such as SP or Rank animations

## Phase dependency map

1. [Phase 0 — Baseline and regression protection](phase-0-baseline.md)
2. [Phase 1 — Organization domain and portability](phase-1-organization-domain.md)
3. [Phase 2 — Explorer movement APIs](phase-2-explorer-backend.md)
4. [Phase 3 — Tasks workspace UI](phase-3-workspace-ui.md)
5. [Phase 4 — Notes, details, search, and filters](phase-4-task-management.md)
6. [Phase 5 — Focus Timer domain and portability](phase-5-focus-domain.md)
7. [Phase 6 — Global timer and Dynamic Island](phase-6-dynamic-island.md)
8. [Phase 7 — Focus history and manual management](phase-7-focus-history.md)
9. [Phase 8 — Expanded Task statistics](phase-8-statistics.md)
10. [Phase 9 — Upgrade, release, and final hardening](phase-9-hardening.md)
11. [Phase 10 — Focus Task switching after RC.1](phase-10-focus-task-switching.md)

## Implementation protocol

- Implement exactly one numbered phase at a time.
- Read this roadmap, the selected phase, and every linked current document before changing code.
- Do not begin a later phase to work around an unfinished earlier phase.
- Keep controllers thin and place domain behavior in Actions or Services.
- Use Requests for validation, DTOs for structured input, and focused view-data factories for frontend payloads.
- Keep frontend responsibilities in focused components and keep files below 500 lines.
- Add migrations; never rewrite an existing migration.
- Preserve old database and archive inputs through migrations, adapters, and safe defaults.
- Run focused tests during implementation and all checks required by the selected phase before completing it.
- At the end of each phase, report changes, compatibility effects, exact validation results, known limitations, and a focused commit-message suggestion.
- Stop after the phase report and wait for explicit instruction before beginning the next phase.

## Standard validation

Run as applicable after every phase:

```bash
composer test
npm run types:check
npm run lint
npm run build
```

Use the nearest available development port from 8000 through 8009 for UI verification. Do not modify an installed Docker instance unless explicitly requested.

Because v1.3.0 changes persistent data, the finished release must pass the internal RC process before any stable promotion.
