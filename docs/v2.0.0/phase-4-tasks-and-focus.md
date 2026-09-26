# Phase 4 — Tasks and Focus

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Redesign Tasks without changing its domain contract. Read [Tasks behavior](../user-guide.md#tasks), the [Tasks 2.0 roadmap](../v1.3.0/README.md), [Task statistics](../task-statistics.md), and [Task Targets](../task-targets-plan.md). The workspace and calendar use the shared 80rem page rail.

## Implementation tasks

- [ ] Apply shared header, module navigation, local views, and page rail to Tasks workspace, Files, Inbox, Projects, Calendar, and Statistics.
- [ ] Redesign Folder/Project cards, Task composer/list/rows, filters, search, breadcrumbs, empty states, and drag/accessible move cues.
- [ ] Redesign Task details/editor, recurrence/subtasks, Focus start/history/editor, and timer states without changing saved behavior.
- [ ] Bring completion and Focus charts/heatmap/rankings onto legible chart surfaces with labels and exact-value access.
- [ ] Preserve occurrence-specific edits, completion/undo, schedule, SP, one running Focus counter, and historical metric attribution.
- [ ] Record the rail choice and any page-specific exceptions.

## Manual review checklist

- [ ] User creates, edits, moves by drag and keyboard action, completes, undoes, reschedules, searches, and filters Tasks.
- [ ] User checks Calendar views and Task details at desktop/mobile widths with long names and many items.
- [ ] User starts, pauses, switches, resumes, finishes, and edits Focus; verifies timer continuity after navigation/reload.
- [ ] User reads Statistics charts without relying on color and confirms exact values remain available.

## Exit and handoff

Exit when all Tasks and Focus routes are accepted with existing workflows preserved. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: map Tasks route hierarchy.
