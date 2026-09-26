# Phase 3 — App shell, global navigation, and Today

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Apply the shared structure to the persistent shell and the daily landing view. Keep [Today behavior](../user-guide.md#today) and the [global shell foundation](../v0.1.0/phase-0.5-global-ui-foundation.md#application-shell) intact. Use the [navigation hierarchy](../ui-layout-and-hierarchy.md#navigation-and-tab-hierarchy).

## Implementation tasks

- [ ] Update desktop sidebar, mobile header/bottom navigation, More drawer, and active-location cue using shared tokens and controls.
- [ ] Align shell padding and default page rail; remove duplicate page padding where it causes edge drift.
- [ ] Update Today header, progress summary, Tasks/Habits local views, cards, and empty/loading/error states with the shared hierarchy.
- [ ] Integrate progress panel and Dynamic Island with the same raised material and safe-area/focus rules.
- [ ] Preserve Task/Habit actions, Diary access, SP feedback, Focus timer persistence, and navigation behavior.
- [ ] Record any shell or Today layout exception and its reason.

## Manual review checklist

- [ ] User switches all global destinations on desktop and mobile and confirms location is always clear.
- [ ] User completes a Today Task and Habit check-in, opens progress/Diary, and checks the resulting feedback.
- [ ] User runs Focus through navigation and reload, and verifies bottom navigation, island, and panel do not cover content or focus.
- [ ] User reviews empty and populated Today in the common appearance/viewport matrix.

## Exit and handoff

Exit when the shell and Today are accepted and later pages can inherit their alignment. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: inspect shell and Today components.
