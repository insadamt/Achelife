# Phase 7 — Appearance Settings and compatibility

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Expose the palette and Normal glass designs built in earlier phases, with backward-compatible persistence. Recheck Phase 0's accepted storage design. Read [appearance decisions](../ui-design-and-motion.md#supported-appearance), [theme palettes](../ui-design-and-motion.md#theme-palettes), [compatibility notes](../ui-design-and-motion.md#implementation-boundaries-and-known-follow-up), [current Settings behavior](../user-guide.md#settings), and [portability](../v1.0.0/phase-15-account-data-portability.md).

## Implementation tasks

- [ ] Add account-level Light/Dark palette storage with safe defaults for old accounts and exact chosen base colors; keep System/Light/Dark preference device-local.
- [ ] Derive readable foreground, ink, focus, hover, pressed, disabled, semantic feedback, and chart companions from edited base colors without changing the saved choice.
- [ ] Add Settings editors grouped by semantic role, live previews, contrast feedback/warnings, individual resets, one-time cross-palette accent copy, and Reset all appearance.
- [ ] Add `normal_glass` or another explicit new stored value; retain existing `normal` and `glass` meanings. Apply built-in/custom wallpaper behavior per the design guide.
- [ ] Explain custom-image readability limits beside its control and offer Normal as the most readable option.
- [ ] Update exports, import validation, preview, and versioned adapter/default path so old archives remain readable and new palette/style data round-trips.
- [ ] Add focused regression cases using previous account/archive payload shapes and the new export shape; record exact compatibility results.

## Manual review checklist

- [ ] User edits Light and Dark separately, checks System switching, copies accent once, then edits the source without changing the copied destination.
- [ ] User resets one role and all Appearance; checks default theme, Frosted glass, built-in wallpaper, and custom-image removal.
- [ ] User switches all three styles, uploads/removes an image, reloads, and checks cross-device account settings where available.
- [ ] User safely restores an old archive and round-trips a new one; confirms existing saved `normal`/`glass` choices retain their meanings.

## Exit and handoff

Exit only when appearance editing, persistence, old-data compatibility, and user review pass. The common [appearance matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase) now includes Normal glass on every screen.

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Compatibility cases/results: — · User feedback: — · Open issues: — · Next task: inspect Phase 0 storage decision and current appearance data.
