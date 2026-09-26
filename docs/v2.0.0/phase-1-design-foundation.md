# Phase 1 — Tokens, typography, and materials

**Status:** Ready for manual review. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Create the shared visual foundation before converting pages. Use [theme palettes](../ui-design-and-motion.md#theme-palettes), [surface and depth](../ui-design-and-motion.md#surface-and-depth-system), and [text and data](../ui-design-and-motion.md#text-icons-and-data). Read Phase 0's accepted palette decisions.

## Implementation tasks

- [x] Inventory existing `app.css`, `appearance.css`, `today.css`, theme provider, fonts, and semantic utility usage; record the exact files to change.
- [x] Define default Light cool-porcelain and Dark palette tokens by semantic role. Keep Dark glass character and current persisted style meanings.
- [x] Set League Spartan for display headings and Inter for body, forms, navigation, and dense data; make font loading safe before content renders.
- [x] Define page, surface, raised, and inset material recipes with layered radii, glass highlights/darker edges, shadows, and unfiltered wallpaper.
- [x] Define reusable recipes for Normal solid, Frosted glass, and future Normal glass; do not expose the new saved setting until Phase 7 handles compatibility.
- [x] Add usable no-blur fallback and reduced-transparency treatment; avoid relying on alpha or blur alone for readability.
- [x] Record the default token values and any deliberate deviation from the design guides.

## Implemented token record

- Normal Light: page `#e9eef3`, surface `#f9fbfd`, raised/overlay `#ffffff`, inset `#e2eaf1`, text `#25313d`/`#435567`/`#526577`. Normal Dark retains page `#121315`, surface `#060708`, raised `#18191c`, with new inset `#101216` and overlay `#1b1e22`.
- Both themes retain the exact default lime accent `#d7e66b`. Added semantic link and information colors, inset and overlay roles, and panel/card/control radii. Theme preference and persisted appearance data are unchanged.
- Frosted glass keeps the current `glass` class and city garden background. Dark and Light get nested inset fills, distinct bright/dark edges, and shadow. The wallpaper has no page-wide white or black tint, following user feedback. Light uses cool blue-gray fills. `normal` remains solid; the unexposed `app-normal-glass` recipe uses stronger opacity and no blur. The no-blur fallback raises opacity; reduced transparency uses solid fills and disables blur.
- `today.css` now reads the shared material tokens instead of carrying separate hard-coded Light/Dark glass fills. Inter is bundled in `resources/fonts` with its Open Font License and loads through `@font-face`; League Spartan remains bundled through the existing package for headings. The font has `font-display: swap` so content remains readable while it loads.
- Design-guide deviation pending review: current page-specific geometry and navigation heights remain for Phase 2 and later page phases. The glass recipes use stronger opacity than the previous style to protect text readability; confirm the visual character manually.

## Manual review checklist

- [ ] User reviews representative shell, nested card, input, and overlay in Light and Dark against the built-in wallpaper.
- [ ] User checks Normal and Frosted glass still correspond to their existing saved values.
- [ ] User checks blur-disabled and reduced-transparency rendering where available, plus readable text and visible material edges.

## Exit and handoff

Exit when shared token/material recipes are implemented and the user accepts representative rendering. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: 2026-09-26 · Last completed task: shared semantic, font, and material layer · Files: `resources/css/app.css`, `appearance.css`, `today.css`, `resources/fonts/InterVariable.ttf`, `resources/fonts/OFL.txt`, `resources/js/components/ui/Dialog.tsx`, `FormControls.tsx`, this task file, roadmap, Phase 0 handoff · Decisions: preserve `normal`/`glass` behavior; keep `app-normal-glass` unexposed until Phase 7 · Checks actually performed: source review and static diff inspection only; no build or test run at the user's request · User feedback: the page-wide white/black wallpaper tint looked bad; removed it · Open issues: review the unfiltered wallpaper and rendered contrast, blur-disabled, reduced-transparency, mobile and Light/Dark review remain for the user; Phase 0 manual route pass remains user-owned · Next task: collect Phase 1 visual findings, fix shared tokens at source, then mark accepted before Phase 2.
