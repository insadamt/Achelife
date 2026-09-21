# Phase 10 — Focus Task switching after RC.1

## Goal

Let one person move quickly between several Tasks while exactly one Focus counter runs. A Task keeps its own open Focus Session until the user finishes it or completes the Task.

## Behavior

- Starting Focus on another Task switches in one server transaction: close the current running interval, pause its session, and start or resume the selected Task at the same UTC timestamp.
- Switching to the already running Task does nothing. Pausing all Tasks leaves every counter still. Resuming any paused Task also pauses the currently running Task.
- Keep one open session per Task and one running session per user with database uniqueness boundaries. Reloading or reopening the app restores the full open set.
- Finishing Focus on any running or paused Task completes that session and updates its history and statistics. Completing a Task finishes its own open Focus Session and leaves other Tasks alone.
- Completed Focus Time remains the only source for statistics; paused sessions are excluded until finished. Focus never awards SP.

## Interface

- The compact Dynamic Island shows the running Task and counter, or an all-paused state when no counter runs.
- The expanded island offers Pause and Finish focus for the running Task, Resume and Finish focus for each paused Task, and a search for another open Task.
- Task row and Task details controls start, resume, or switch Focus with one action. Switching keeps the user on the current page.
- The mobile header keeps access to the switcher while Tasks are paused. Controls remain labeled for keyboard and screen-reader use.

## Compatibility and release

- Add a migration that preserves RC.1 Focus Sessions and replaces the one-active-session uniqueness boundary with one open session per Task and one running session per user. Rollback requires finishing all but one open session per user first.
- New account exports use archive format 6, which permits several paused sessions. Formats 1–5 remain readable. Format 5 keeps its original one-active-session validation rule and exact row shape.
- Running sessions are still snapshotted as paused in exports, without counting transfer downtime.
- The RC.1 start endpoint and active-session response remain available. The new switch endpoint and open-session collection extend the API.
- This change affects saved data and upgrades, so it requires a new internal release candidate and upgrade and restore acceptance before stable v1.3.0.
