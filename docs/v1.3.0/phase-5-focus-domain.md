# Phase 5 — Focus Timer domain and portability

## Goal

Build a server-authoritative Focus Session state machine that survives navigation, reloads, closed tabs, concurrency, and local-time boundaries. Add its portable representation in the same phase.

Focus Time is informational. It must never affect Task rewards, Season SP, Rank, or Daily Progress.

## Persistence

Add a user-owned `TaskFocusSession` belonging to one Task occurrence. Store enough state for running, paused, completed, timer-created, manually created, edited, and deleted sessions. A suitable representation includes:

- `id`, `user_id`, `task_id`
- `started_at`, nullable `ended_at`
- `accumulated_seconds`
- `state`: running, paused, or completed
- `source`: timer or manual
- a nullable active marker used to enforce one active session per user
- timestamps

Add `TaskFocusInterval` rows belonging to a session:

- `id`, `task_focus_session_id`, `started_at`, nullable `ended_at`, and timestamps

Every running segment has its own interval. These intervals are authoritative for allocating duration across local calendar boundaries. Store absolute timestamps consistently in UTC and render them in the user's timezone.

Deleting a Task deletes all its Focus Sessions and intervals. Deleting a Project does not delete Focus data because its Tasks move to Inbox.

## State machine

```text
RUNNING --pause--> PAUSED --resume--> RUNNING --stop--> COMPLETED
RUNNING --stop--> COMPLETED
MANUAL ----------> COMPLETED
```

- Start creates a running session and an open interval.
- Pause closes the open interval and adds its seconds to the accumulated total.
- Resume opens a new interval.
- Stop closes any open interval, stores `ended_at`, clears the active marker, and completes the session.
- Running elapsed time is accumulated seconds plus server time since the open interval started.
- Paused elapsed time is accumulated seconds.
- The frontend may tick locally but never persists once per second.

Repeated Pause, Resume, or Stop submissions must return the already-achieved state when safely identifiable rather than double-counting time. Invalid transitions to a different state are rejected.

## Single active timer and concurrency

- Running and paused both count as active.
- Enforce one active session per user with a database uniqueness boundary that works on every supported database.
- Lock the affected session and Task during transitions.
- Simultaneous starts in separate tabs may create only one active session.
- A rejected second start returns enough active-session data for the UI to identify the Task already being timed.
- Completing a Task finalizes its active Focus Session in the same transaction before applying normal Task completion.
- Deleting a Task with an active session removes that session and clears the user's active-timer boundary.

## Real elapsed time

A running timer continues while the tab or browser is closed. If it starts at 18:00 and the user returns at 20:00 without pausing or stopping, it displays two hours and continues. Server timestamps, not browser uptime, are authoritative.

## Account portability

- Add Focus Sessions and intervals to the current archive format after Tasks.
- Validate ownership, Task relationships, interval ordering, state consistency, and duration totals.
- Old archive versions restore with no Focus Sessions.
- Completed and paused sessions restore with their exact persisted durations.
- Snapshot an exported running session through the archive creation time without mutating the source. Restore that snapshot as paused so transfer downtime is not counted as Focus Time.
- Never restore more than one active session.

## Verification

- [x] Start, pause, resume, stop, and repeated pause/resume cycles
- [x] Elapsed duration based on server timestamps
- [x] Closed-tab and later-return behavior
- [x] Only one active timer under sequential and simultaneous starts
- [x] Duplicate transition submissions do not double-count
- [x] Ownership and invalid transitions
- [x] Timer on a recurring Task occurrence
- [x] Task completion finalizes the active session
- [x] Task deletion removes active and historical Focus data
- [x] Focus never changes SP or Rank
- [x] UTC storage and user-timezone rendering
- [x] New archive round trip and old archive restoration
- [x] Running export restores paused without transfer-time inflation

## Exit criteria

The Focus domain is complete through backend and portability tests before any global timer interface is built.

Completed on 2026-09-13. See [Phase 5 completion](phase-5-completion-2026-09-13.md).
