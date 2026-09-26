# Phase 1 — Tokens, typography, and materials

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Create the shared visual foundation before converting pages. Use [theme palettes](../ui-design-and-motion.md#theme-palettes), [surface and depth](../ui-design-and-motion.md#surface-and-depth-system), and [text and data](../ui-design-and-motion.md#text-icons-and-data). Read Phase 0's accepted palette decisions.

## Implementation tasks

- [ ] Inventory existing `app.css`, `appearance.css`, `today.css`, theme provider, fonts, and semantic utility usage; record the exact files to change.
- [ ] Define default Light cool-porcelain and Dark palette tokens by semantic role. Keep Dark glass character and current persisted style meanings.
- [ ] Set League Spartan for display headings and Inter for body, forms, navigation, and dense data; make font loading safe before content renders.
- [ ] Define page, surface, raised, and inset material recipes with layered radii, glass highlights/darker edges, shadows, and wallpaper scrims.
- [ ] Define reusable recipes for Normal solid, Frosted glass, and future Normal glass; do not expose the new saved setting until Phase 7 handles compatibility.
- [ ] Add usable no-blur fallback and reduced-transparency treatment; avoid relying on alpha or blur alone for readability.
- [ ] Record the default token values and any deliberate deviation from the design guides.

## Manual review checklist

- [ ] User reviews representative shell, nested card, input, and overlay in Light and Dark against the built-in wallpaper.
- [ ] User checks Normal and Frosted glass still correspond to their existing saved values.
- [ ] User checks blur-disabled and reduced-transparency rendering where available, plus readable text and visible material edges.

## Exit and handoff

Exit when shared token/material recipes are implemented and the user accepts representative rendering. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: inspect current tokens.
