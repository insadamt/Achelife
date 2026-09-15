# Phase 0 — Baseline and regression protection

## Goal

Establish a clean, recorded pre-v1.3.0 baseline before changing the Task domain. This phase changes no product behavior.

## Required reading

- `AGENTS.md` and `CONTRIBUTING.md`
- [User guide](../user-guide.md)
- [Task statistics](../task-statistics.md)
- [Account data portability](../v1.0.0/phase-15-account-data-portability.md)
- Current Task, Today, statistics, and portability implementation and tests

## Inspection checklist

- [x] Trace one-time Task creation, editing, completion, undo, rescheduling, and deletion.
- [x] Trace recurring series creation, materialization, forward editing, exclusions, and stopping.
- [x] Record the distinction between `TaskSeries` template fields and Task occurrence snapshots.
- [x] Trace Task SP calculation and Season attribution.
- [x] Trace Tasks shown in Today and on `/tasks`.
- [x] Inspect `TaskViewDataFactory` and all Task frontend components.
- [x] Inspect current statistics period and comparison behavior.
- [x] Record the current archive format, portable table order, adapters, semantic validation, and restore catch-up behavior.
- [x] Confirm the working tree and migration state before implementation.

The completed inspection and exact validation results are recorded in the [Phase 0 completion report](phase-0-completion-2026-09-13.md).

## Baseline validation

Run and record exact results:

```bash
composer test
npm run types:check
npm run lint
npm run build
```

If a baseline check fails, document whether it is environmental or an existing regression. Do not hide an existing failure by mixing its fix into Phase 1 without explicit approval.

## Exit criteria

- The current behavior and compatibility boundaries are understood.
- Baseline results are recorded.
- No product or schema behavior changed.
- Any pre-existing failure is reported.
- A Phase 0 completion report and commit suggestion, if files changed, are provided.
