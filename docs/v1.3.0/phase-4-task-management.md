# Phase 4 — Notes, details, search, and filters

## Goal

Complete the core Task-management experience before adding Focus Time.

## Task details and notes

- Add plain-text notes to appropriate create and edit flows.
- Keep notes out of compact Task rows.
- Extend the existing drawer with title, Project, schedule, importance, recurrence, subtasks, notes, and rescheduling history.
- Keep completed Task immutability rules unless an explicitly approved existing behavior says otherwise.
- Apply recurring Project and notes edits to the selected occurrence and future occurrences only.

## Search contract

- Search title and notes case-insensitively.
- Search is global across Tasks rather than limited to the currently selected Project.
- Results include Task state, schedule, and Project or Inbox context.
- Search text is stored in URL query parameters and survives refresh and navigation.
- Search does not trigger recurring materialization beyond the existing synchronization boundary.
- Define deterministic ordering and pagination for large result sets.

## Filters

Support Project, completion/status, and important filters without building a general query language. Filters combine with search and use URL query parameters. Smart date views remain the authority for Today, Upcoming, and Overdue date semantics.

Keep the search and filter query contract backward compatible, but do not expose a filter toolbar in the simplified Project workflow. Project navigation is organized around Today, Overdue, Upcoming, and Completed.

## Verification

- [x] Create and edit notes
- [x] Recurring notes and Project changes apply forward only
- [x] Search title and notes
- [x] Distinguish similarly named Tasks by context
- [x] Combine search with each filter
- [x] Query parameters survive reload and preserve unrelated parameters
- [x] Empty, long, Unicode, and special-character searches
- [x] Authorization and cross-user isolation
- [x] Pagination does not omit or duplicate results
- [x] Existing recurrence, completion, SP, and statistics behavior remains unchanged

Completed on 2026-09-13. See [the Phase 4 completion report](phase-4-completion-2026-09-13.md).

## Exit criteria

Organization, details, search, and filtering are complete and tested before the Focus domain is introduced.
