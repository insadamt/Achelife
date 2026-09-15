# Phase 6 — Global timer and Dynamic Island

## Goal

Make the active Focus Timer visible and controllable throughout Achelife through a persistent Dynamic Island application element.

## Shared state

- Extend the existing global Inertia sharing path with the active Focus Session.
- Share Task identity/title, state, accumulated seconds, open-interval start timestamp, and the server timestamp used to build the response.
- Reconstruct elapsed time after full reload from authoritative persisted timestamps.
- Reconcile stale state after navigation, another-tab actions, validation errors, and control responses.
- Do not poll or send requests every second. The displayed clock ticks locally.

## Dynamic Island states

Persistent state:

- Running timer
- Paused timer

Temporary event:

- Focus session saved, including its final duration

The compact state shows a timer icon, Task title, elapsed time, and running or paused status. A newly started timer remains compact; explicit interaction exposes Pause or Resume and Stop. After Stop, show feedback such as `Focus saved · 43m`, then return to inactive state.

Build a small event/state abstraction that can accept future event types, but implement no SP, Rank, or unrelated animations in v1.3.0.

## Task controls

- Add Start Focus to Task rows and Task details.
- Once active, global controls live in the Dynamic Island.
- Starting another Task displays the currently active Task and requires the user to stop it; never silently switch or create a parallel timer.
- Prevent duplicate submissions while a control request is in flight.

## Responsive and accessible behavior

- Keep controls usable with keyboard and assistive technology.
- Announce state changes and saved feedback without reading every clock tick.
- Do not rely on animation, color, or hover alone.
- Respect reduced-motion preferences.
- Avoid collisions with existing mobile navigation, fixed Add controls, drawers, dialogs, and safe-area insets.

## Verification

- [x] Start on Tasks and navigate through every main module
- [x] Reload while running and paused
- [x] Return after closing the tab and observe real elapsed time
- [x] Pause, resume, and stop globally
- [x] Saved feedback then inactive state
- [x] Second-Task start conflict
- [x] Stale state from another tab recovers on the next server response
- [x] Keyboard and screen-reader behavior
- [x] Reduced motion, mobile safe areas, light mode, and dark mode
- [x] Long Task titles and long-running durations

## Exit criteria

A timer can be started from a Task, remains accurate across the application and browser reloads, and is globally controllable without parallel timers or per-second network traffic.

Completed on 2026-09-14. See [Phase 6 completion](phase-6-completion-2026-09-14.md).
