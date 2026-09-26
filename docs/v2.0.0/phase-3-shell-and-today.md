# Phase 3 — App shell, global navigation, and Today

**Status:** Ready for manual review. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Apply the shared structure to the persistent shell and the daily landing view. Keep [Today behavior](../user-guide.md#today) and the [global shell foundation](../v0.1.0/phase-0.5-global-ui-foundation.md#application-shell) intact. Use the [navigation hierarchy](../ui-layout-and-hierarchy.md#navigation-and-tab-hierarchy).

## Implementation tasks

- [x] Update desktop sidebar, mobile header/bottom navigation, More drawer, and active-location cue using shared tokens and controls.
- [x] Align shell padding and default page rail; remove duplicate page padding where it causes edge drift.
- [x] Update Today header, progress summary, Tasks/Habits local views, cards, and empty/loading/error states with the shared hierarchy.
- [x] Integrate progress panel and Dynamic Island with the same raised material and safe-area/focus rules.
- [x] Preserve Task/Habit actions, Diary access, SP feedback, Focus timer persistence, and navigation behavior.
- [x] Record any shell or Today layout exception and its reason.

## Layout decisions and exceptions

- The shell retains its 92rem outer ceiling so wide Task and Calendar workspaces remain possible. Today uses the standard 80rem `PageRail`; shell padding owns its left and right edges in every appearance, including wallpaper.
- Today keeps its compact two-column Tasks/Habits panel on desktop and accessible in-page tabs on mobile. This preserves the daily workflow while the header and progress headings follow the shared type scale.
- Today's data arrives with the Inertia page; its empty state is shown inside each section. It has no separate page loading view. Focus errors remain in the global shell alert. Task and Habit mutation behavior is unchanged.
- The mobile bottom bar and progress panel account for the device safe area. The progress panel remains modal while open, and Diary navigation closes it. The Focus island stays below the mobile header.

## Manual review checklist

- [ ] User switches all global destinations on desktop and mobile and confirms location is always clear.
- [ ] User completes a Today Task and Habit check-in, opens progress/Diary, and checks the resulting feedback.
- [ ] User runs Focus through navigation and reload, and verifies bottom navigation, island, and panel do not cover content or focus.
- [ ] User reviews empty and populated Today in the common appearance/viewport matrix.

## Exit and handoff

Exit when the shell and Today are accepted and later pages can inherit their alignment. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: 2026-09-26 · Last completed task: Phase 3 shell and Today implementation · Files: `resources/js/layouts/AppLayout.tsx`, `resources/js/pages/Home.tsx`, `resources/js/features/today/TodayOverview.tsx`, `TodayTaskRow.tsx`, `TodayHabitSection.tsx`, `resources/js/features/progress/ProgressNotch.tsx`, `resources/js/features/focus/DynamicIsland.tsx`, `resources/css/today.css`, roadmap and this task file · Decisions: maintain unfiltered wallpaper and League Spartan; use semantic raised material and the 80rem Today rail; leave existing Task/Habit/Focus data flows intact · Checks actually performed: source review and `git diff --check`; no build or automated tests at user request · User feedback: user authorized Phase 3 after Phase 2 · Open issues: full desktop/mobile, appearance, keyboard, empty/populated, Focus persistence and safe-area manual review pending; earlier phase manual checks remain open · Next task: address manual findings, obtain Phase 3 acceptance, then begin Phase 4 Tasks and Focus.
