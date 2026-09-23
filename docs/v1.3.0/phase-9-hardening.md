# Phase 9 — Upgrade, release, and final hardening

## Goal

Verify v1.3.0 as a safe real-world upgrade, complete its documentation, and prepare an internal release candidate. This phase does not introduce a new feature area.

## Compatibility and upgrade verification

- Test a database from the previous stable release and every supported upgrade path.
- Confirm old Tasks enter Inbox, notes default to null, and positions initialize deterministically.
- Confirm recurring Tasks continue materializing with unchanged schedules and SP behavior.
- Confirm completion history, reward snapshots, Season totals, and Today integration are unchanged.
- Confirm new organization and Focus tables initialize safely.
- Verify migration rollback behavior where supported and document recovery expectations.

## Archive verification

- Test archive format 9 round trips with Folder, Project, and Money Category colors; archived Folders and Projects; recurring templates; Task assignments; notes; ordering; completed sessions; multiple paused sessions; and intervals.
- Test every older archive format through its frozen explicit adapter.
- Confirm old archives restore all Tasks to Inbox with no notes or Focus Sessions.
- Confirm checksums, table counts, relationship validation, preview, remapping, and restore catch-up remain intact.
- Test corrupted, cross-user, overlapping, structurally invalid, and future-format inputs.

## Product acceptance

Organization:

- [ ] Folder and Project CRUD, root placement, movement, deletion preservation, and ordering
- [ ] Inbox and Project Tasks
- [ ] Drag-and-drop and explicit accessible movement

Tasks:

- [ ] Fast composer, notes, details, recurring forward edits, search, and filters
- [ ] Existing completion, undo, recurrence, rescheduling, Today, SP, and statistics

Focus:

- [ ] Start, pause, resume, stop, manual, edit, and delete
- [ ] One active timer under concurrency
- [ ] Switch between running and paused Tasks with only one running counter, including across tabs and reloads
- [ ] Navigation, reload, closed-tab continuation, and saved feedback
- [ ] Precise interval allocation and zero SP influence

Statistics:

- [ ] Existing metrics plus every new Focus metric, chart, heatmap, Project aggregation, Inbox aggregation, and most-focused ranking

## Interface hardening

Verify desktop, narrow desktop, mobile, light and dark modes, keyboard navigation, screen readers, reduced motion, empty states, long names, large collections, collapsed Folders, drag indicators, dialogs, drawers, and fixed-control collisions.

Use an available development port from 8000 through 8009. Do not rebuild or modify an installed Docker instance without explicit permission.

## Documentation

- Update [User guide](../user-guide.md).
- Update [Task statistics](../task-statistics.md).
- Update [Account data portability](../v1.0.0/phase-15-account-data-portability.md).
- Add the v1.3.0 implementation record and internal RC release notes.
- Document only shipped Dynamic Island behavior.

Use this release-note structure and include only applicable sections:

```markdown
Achelife v1.3.0 improves Tasks with organization, Focus Time, and expanded statistics.

## Added

- Added ...

## Changed

- Improved ...

## Fixed

- Fixed ...
```

## Full validation

```bash
composer test
npm run types:check
npm run lint
npm run build
sh tests/Installer/run.sh
```

When Docker is available, also run:

```bash
sh scripts/release/verify-source.sh
```

## Release gate

Because v1.3.0 changes migrations, persistent data, upgrades, and account archives, create and fully test an internal RC first. Do not publish the internal test version publicly and do not promote stable until every verification gate passes.

## Exit criteria

Every acceptance item, upgrade path, archive adapter, interface state, document, and release gate passes with recorded evidence. Report the exact validation results and suggest the release-preparation commit message before stopping.
