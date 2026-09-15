# Phase 2 — Explorer movement APIs

## Goal

Provide transactional, ownership-safe operations for the file-explorer interface. The frontend must never be trusted to update arbitrary parent IDs or positions directly.

## Required operations

Folder:

- Create, rename, delete, and reorder at the root

Project:

- Create, rename, delete, move into a Folder, move to root, and reorder among siblings

Task:

- Move into a Project, move to Inbox, and reorder within its Project or Inbox

Valid parent transitions are `Project → Folder or Root` and `Task → Project or Inbox`. Folder nesting, Tasks inside Folders, and Projects inside Projects are invalid.

## Ordering contract

- Folder positions and root-Project positions are separate ordered lists in v1.3.0.
- Projects inside each Folder have their own sibling positions.
- Tasks inside each Project and Inbox have their own sibling positions.
- Positions are deterministic, bounded, and normalized after create, move, reorder, and parent deletion.
- Multi-row movements execute inside a transaction and lock the affected sibling sets.
- Manual Task position controls Project and Inbox views only. Smart date views and search use their documented date/relevance ordering.
- Reject duplicate, missing, foreign, and cross-user IDs without partially applying a reorder.

## Explorer payload

Create a focused view-data factory that returns only navigation data:

```text
folders
  projects
rootProjects
inboxCount
```

Include stable identifiers, names, positions, counts, and only the state required for navigation. Do not embed complete Task collections in every explorer node.

## Verification

- [x] Every valid parent transition
- [x] Every invalid hierarchy transition
- [x] Same-parent and cross-parent reorder
- [x] Move Project to root and Task to Inbox
- [x] Position normalization after creation, movement, and deletion
- [x] Duplicate and malformed reorder payloads
- [x] Missing, unauthorized, and cross-user IDs
- [x] Concurrent or repeated movement requests fail safely
- [x] Explorer counts after Task completion, movement, and deletion
- [x] Existing Task behavior remains unchanged

The implementation and validation evidence are recorded in the [Phase 2 completion report](phase-2-completion-2026-09-13.md).

## Exit criteria

The backend can support the complete explorer without trusting client state, and every movement leaves deterministic sibling ordering.
