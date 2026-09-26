# Phase 1 — Tokens, typography, and materials

**Status:** Accepted with open visual-review items. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Create the shared visual foundation before converting pages. Use [theme palettes](../ui-design-and-motion.md#theme-palettes), [surface and depth](../ui-design-and-motion.md#surface-and-depth-system), and [text and data](../ui-design-and-motion.md#text-icons-and-data). Read Phase 0's accepted palette decisions.

## Implementation tasks

- [x] Inventory existing `app.css`, `appearance.css`, `today.css`, theme provider, fonts, and semantic utility usage; record the exact files to change.
- [x] Define default Light cool-porcelain and Dark palette tokens by semantic role. Keep Dark glass character and current persisted style meanings.
- [x] Keep bundled League Spartan for headings, body, forms, navigation, and dense data; restore the original interface typography after user review.
- [x] Define page, surface, raised, and inset material recipes with layered radii and unfiltered wallpaper; Frosted glass was later flattened after user review.
- [x] Define reusable recipes for Normal solid, Frosted glass, and future Normal glass; do not expose the new saved setting until Phase 7 handles compatibility.
- [x] Add usable no-blur fallback and reduced-transparency treatment; avoid relying on alpha or blur alone for readability.
- [x] Record the default token values and any deliberate deviation from the design guides.

## Implemented token record

- Normal Light: page `#e9eef3`, surface `#f9fbfd`, raised/overlay `#ffffff`, inset `#e2eaf1`, text `#25313d`/`#435567`/`#526577`. Normal Dark retains page `#121315`, surface `#060708`, raised `#18191c`, with new inset `#101216` and overlay `#1b1e22`.
- Both themes retain the exact default lime accent `#d7e66b`. Added semantic link and information colors, inset and overlay roles, and panel/card/control radii. Theme preference and persisted appearance data are unchanged.
- Frosted glass keeps the current `glass` class and city garden background. Following user review, Light uses a cool translucent tint and Dark uses a deeper translucent tint; parent and nested components retain blur and transparency without panel outlines, reflected edges, or depth shadows. Subtle divider lines remain inside panels. Headings and standalone menus sit on separate glass panels, with wallpaper visible between sections. `normal` remains solid; the unexposed `app-normal-glass` recipe uses stronger opacity and no blur. The no-blur fallback raises opacity; reduced transparency uses solid fills and disables blur.
- `today.css` now reads the shared material tokens instead of carrying separate hard-coded Light/Dark glass fills. The Inter experiment was rejected in user review; the original bundled League Spartan font is restored throughout the interface.
- Design-guide deviation pending review: current page-specific geometry and navigation heights remain for Phase 2 and later page phases. The clearer glass may make text harder to read over some wallpaper regions; confirm the visual character and readability manually.

## Manual review checklist

- [ ] User reviews representative shell, nested card, input, and overlay in Light and Dark against the built-in wallpaper.
- [ ] User checks Normal and Frosted glass still correspond to their existing saved values.
- [ ] User checks blur-disabled and reduced-transparency rendering where available, plus readable text and clear control states.

## Exit and handoff

Exit when shared token/material recipes are implemented and the user accepts representative rendering. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: 2026-09-26 · Last completed task: shared semantic and material layer with original typography restored · Files: `resources/css/app.css`, `appearance.css`, `today.css`, `resources/js/components/ui/Dialog.tsx`, `FormControls.tsx`, this task file, roadmap, Phase 0 handoff · Decisions: preserve `normal`/`glass` behavior; keep `app-normal-glass` unexposed until Phase 7; keep League Spartan across the interface · Checks actually performed: source review and static diff inspection only; no build or test run at the user's request · User feedback: page-wide wallpaper tint rejected and removed; Inter later rejected and original League Spartan restored · Open issues: the detailed contrast, blur-disabled, reduced-transparency, mobile and Light/Dark matrix remains user-owned before the final audit; Phase 0 manual route pass also remains open · Next task: continue Phase 2 review with the restored typography.
