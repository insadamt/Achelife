# Phase 2 — Shared controls and page structure

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Make shared primitives express the documented hierarchy before page-by-page adoption. Follow [controls and states](../ui-design-and-motion.md#controls-and-states), [motion](../ui-design-and-motion.md#motion-language), and the [page frame](../ui-layout-and-hierarchy.md#one-page-frame).

## Implementation tasks

- [ ] Update shared Button, Surface, inputs, Dialog, Drawer, status/progress, and chart presentation to use semantic tokens and the selected material family.
- [ ] Give controls documented default, hover, focus, selected, disabled, loading, success, and error states where applicable; preserve focus management and announcements.
- [ ] Create or refine shared page rail/header, module navigation, local-view tabs, and filter roles. Keep route links distinct from in-page tabs.
- [ ] Apply 80rem standard and justified 92rem wide rails, shared heading scale, spacing rhythm, and control heights in the primitives.
- [ ] Implement reduced-motion behavior in CSS and JavaScript movement, including scroll; keep state understandable with motion disabled.
- [ ] Document component usage and exceptions for page phases; keep component files below 500 lines.

## Manual review checklist

- [ ] User checks keyboard order, focus visibility/return, labels, field errors, and dialog/drawer dismissal.
- [ ] User checks selected/disabled/loading states, touch targets, 320px width, 200% text, and mobile safe areas.
- [ ] User checks shared components in both themes and each currently available surface style, including reduced motion.

## Exit and handoff

Exit when page phases can adopt the shared roles without inventing one-off controls. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: inspect shared UI components.
