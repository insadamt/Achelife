# Phase 2 — Shared controls and page structure

**Status:** Accepted to proceed; detailed manual checks remain open. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Make shared primitives express the documented hierarchy before page-by-page adoption. Follow [controls and states](../ui-design-and-motion.md#controls-and-states), [motion](../ui-design-and-motion.md#motion-language), and the [page frame](../ui-layout-and-hierarchy.md#one-page-frame).

## Implementation tasks

- [x] Update shared Button, Surface, inputs, Dialog, Drawer, status/progress, and chart presentation to use semantic tokens and the selected material family.
- [x] Give controls documented default, hover, focus, selected, disabled, loading, success, and error states where applicable; preserve focus management and announcements.
- [x] Create or refine shared page rail/header, module navigation, local-view tabs, and filter roles. Keep route links distinct from in-page tabs.
- [x] Apply the shared 80rem rail, heading scale, spacing rhythm, and control heights in the primitives.
- [x] Implement reduced-motion behavior in CSS and JavaScript movement, including scroll; keep state understandable with motion disabled.
- [x] Document component usage and exceptions for page phases; keep component files below 500 lines.

## Component usage and page-phase handoff

- `PageRail` and the outer App shell use the same 80rem width for each workspace page, including Tasks and Calendar.
- `PageHeader` owns the standard 32/40px `h1`, eyebrow, description, and optional action. `ModuleNavigation` uses route links with `aria-current="page"`; Tasks and Money now share it. `LocalViewTabs` uses in-page buttons with tab/panel IDs and Arrow/Home/End keyboard movement; Today now uses it. `FilterGroup` groups controls without pretending filters are tabs.
- `Button` supports an accessible loading state, `Surface` has an inset depth, fields/selects can announce success as well as errors, and dialogs cap their height while drawers respect the bottom safe area. Status labels and chart axes use readable semantic text tokens. Progress tracks use the inset material.
- Global CSS already removes nonessential animation for reduced motion. Subtask insertion now avoids smooth scrolling under that preference. The Focus island and Season switcher already contain JavaScript reduced-motion checks.
- Page-specific title adoption remains in Phases 3–8. All workspace pages use the standard rail. Current user feedback forbids a page-wide tint on wallpaper in every later page phase.

## Manual review checklist

- [ ] User checks keyboard order, focus visibility/return, labels, field errors, and dialog/drawer dismissal.
- [ ] User checks selected/disabled/loading states, touch targets, 320px width, 200% text, and mobile safe areas.
- [ ] User checks shared components in both themes and each currently available surface style, including reduced motion.

## Exit and handoff

Exit when page phases can adopt the shared roles without inventing one-off controls. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: 2026-09-26 · Last completed task: shared controls and page roles · Files: `resources/js/components/ui/PageStructure.tsx`, `Button.tsx`, `Surface.tsx`, `FormControls.tsx`, `Dialog.tsx`, `Metric.tsx`, `StatusChip.tsx`, `ProgressBar.tsx`, `CircularProgress.tsx`, `index.ts`, Money and Tasks shared navigation, Today tabs/Home panels, SubtaskEditor, TaskCompletionLineChart, `resources/css/app.css`, `appearance.css`, this task file, Phase 1 and roadmap · Decisions: adopt shared roles gradually by page phase; keep route links and in-page tabs distinct; retain unfiltered wallpaper · Checks actually performed: source review and static diff check only; no build or automated tests at user request · User feedback: user authorized advancement to Phase 3; detailed Phase 2 review remains open · Open issues: Phase 2 keyboard, mobile, focus, appearance and state review pending; Phase 0/1 detailed manual checks remain user-owned · Next task: collect manual findings alongside Phase 3 review and fix shared components as needed.
