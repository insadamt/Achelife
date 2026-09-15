# Phase 3 — Tasks workspace UI

## Goal

Turn `/tasks` into a file-explorer-style workspace with a clear separation between organization and execution.

## Workspace structure

Tasks use the full workspace width without a secondary sidebar. The root and Folder screens are dedicated to managing Folders, Projects, and Inbox without showing Task creation or filtering controls.

The main workspace exposes the hierarchy as a visual file browser. `/tasks` opens one Files grid containing large Folder cards, root Project cards, and Inbox. Opening a Folder shows its Project cards. Opening a Project or Inbox shows a project-scoped composer followed by Today, Overdue, Upcoming, and Completed tabs and the selected Task list.

Mobile keeps the same hierarchy and lets the four Task tabs scroll within their own bar. A breadcrumb provides a reliable path back to the manager.

## Interaction requirements

- Keep the inline fast composer inside Project and Inbox Task screens, bound to the open location.
- Provide in-context creation for Folders and Projects from the visual file browser.
- Show a clear `Files → Folder → Project` breadcrumb while drilling into the hierarchy.
- Keep Task rows compact: completion, title, useful Project context, schedule, importance, tracked Focus summary when available later, and Start Focus when added later.
- Keep the Folder and Project hierarchy in the main visual browser instead of duplicating it in a sidebar tree.
- Allow Project cards to be dragged onto Folder cards, with an unambiguous active drop target and a root drop target when browsing inside a Folder.
- Keep the complete Project card under the pointer at its original grab offset, while its source slot remains visibly reserved.
- Preserve the existing organization commands and manually ordered Project and Inbox Task lists.
- Provide an accessible Move action for Projects and Tasks; dragging is never the only option.
- Preserve Today, Upcoming, Overdue, and Completed semantics inside each Project and Inbox.
- Use chronological ordering for smart date views. Manual positions apply only to Project and Inbox views.

## Component boundaries

Use focused components equivalent to:

- `TaskWorkspace`
- `TaskViewNavigation`
- `TaskFileBrowser`
- `TaskList`
- `TaskRow`
- `TaskComposer`
- `TaskDetailsDrawer`

Names may follow repository conventions. No component or page may grow beyond 500 lines.

## Verification

- [x] Create a Task quickly with and without a Project
- [x] Navigate every smart view, Folder, Project, and Inbox
- [x] Drag Projects into Folders and back to the Files root
- [x] Perform equivalent movement without drag-and-drop
- [x] Keyboard focus order and visible focus states
- [x] Screen-reader labels and announcements for movement outcomes
- [x] Desktop, narrow desktop, and mobile layouts
- [x] Light and dark themes
- [x] Empty states, long names, many Projects, and many Tasks
- [x] Existing completion, undo, pagination, recurrence, and details behavior

Completed on 2026-09-13. See [the Phase 3 completion report](phase-3-completion-2026-09-13.md).

## Exit criteria

Folders, Projects, and Tasks can be organized visually on desktop and mobile, and ordinary Task creation has not become slower or modal-dependent.
