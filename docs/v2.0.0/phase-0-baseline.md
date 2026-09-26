# Phase 0 — Baseline and screen inventory

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Establish an accurate starting point and decide how the new appearance data can be added safely. This phase produces an inventory and decisions, not a UI redesign. Read the [user guide](../user-guide.md), [global UI foundation](../v0.1.0/phase-0.5-global-ui-foundation.md), and [account portability](../v1.0.0/phase-15-account-data-portability.md).

## Implementation tasks

- [ ] List every route and classify shell, page header, module navigation, local views, filters, primary content, overlays, and feedback states. Include setup, onboarding, restore, Season introduction/closeout, and intermission.
- [ ] Inventory shared UI primitives, CSS/theme tokens, fonts, wallpaper handling, current `normal`/`glass` storage, and export/import paths. Link the relevant files in the handoff record.
- [ ] Record existing widths, heading scales, navigation variants, and control heights against the [layout audit](../ui-layout-and-hierarchy.md#current-app-audit). Identify already redesigned pieces that should be kept.
- [ ] Write a phase baseline of current workflow behavior and known defects so a later visual change is not mistaken for an old problem.
- [ ] Document the proposed palette storage schema, defaults for old accounts, exact-color preservation, derived variants, new Normal glass value, and versioned archive strategy. Resolve open design choices before Phase 7 implements them.
- [ ] Record which screens will need a justified 92rem rail or hero exception.

## Manual review checklist

- [ ] User opens each route at desktop and mobile size and confirms the inventory is complete.
- [ ] User confirms the baseline accurately labels existing defects and current appearance behavior.
- [ ] User accepts the storage/compatibility decisions that later phases will follow.

## Exit and handoff

Exit when the route inventory, compatibility design, and baseline are documented and the user accepts them. Keep the phase **In progress** until then.

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: inventory routes.
