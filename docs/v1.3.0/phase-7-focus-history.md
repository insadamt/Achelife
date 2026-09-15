# Phase 7 — Focus history and manual management

## Goal

Make the Task details drawer the authoritative place to inspect and correct Focus Time.

## Focus details

Show:

- Total completed Focus Time for the Task
- Completed Focus Session history in user-local time
- Start Focus when this Task does not own the active timer; active controls remain in the global Dynamic Island

History displays local date, visible start/end range, and actual focused duration. A timer session containing pauses may have a wider wall-clock range than its focused duration. Add, edit, and delete actions open in the Task drawer's native editor pane beside the history on larger screens, or replace the summary pane on smaller screens; Focus history does not layer another modal over the Task drawer.

## Manual sessions

- Add a completed Focus Session with a start and end timestamp.
- Represent a manual session with one closed interval in the same domain tables.
- Require an end after start and a positive duration.
- Store absolute timestamps after interpreting input in the user's configured timezone.
- Reject nonexistent or ambiguous local times safely around timezone transitions.
- Apply a documented reasonable maximum duration to catch accidental dates.

## Editing and deletion

- Edit only completed sessions.
- Editing start/end replaces the completed session's intervals with one corrected closed interval and recalculates its accumulated duration.
- Do not expose historical editing for running or paused sessions.
- Delete completed sessions with confirmation.
- Statistics derive from persisted intervals and therefore update after create, edit, or delete without stored aggregate repair.

## Overlap integrity

- Focus intervals for one user are half-open ranges: `[started_at, ended_at)`.
- Adjacent intervals are valid; intersecting intervals are rejected.
- Validate manual creation and edits against all other completed intervals and the current active interval through server time.
- Perform validation transactionally so simultaneous manual submissions cannot introduce overlap.

## Verification

- [x] Manual creation, editing, deletion, and confirmation
- [x] Timer-created history with pause gaps
- [x] Correct local display and UTC persistence
- [x] Midnight and timezone-transition input
- [x] Invalid, zero, reversed, excessive, ambiguous, and overlapping ranges
- [x] Adjacent ranges accepted
- [x] Unauthorized sessions rejected
- [x] Active-session editing rejected
- [x] Simultaneous overlap attempts fail safely
- [x] Task total and later statistics update after every mutation

## Exit criteria

Users can inspect and correct completed Focus Time without corrupting active timers, creating overlaps, or maintaining a separate manual-time system.

Completed on 2026-09-14. See [Phase 7 completion](phase-7-completion-2026-09-14.md).
