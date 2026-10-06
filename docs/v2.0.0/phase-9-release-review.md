# Phase 9 — Full-app review, documentation, and internal RC

**Status:** In progress; public RC published, full manual review pending. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Audit the complete app and prepare an internal release candidate. Read the [UI review matrix](../ui-design-and-motion.md#review-matrix-for-every-new-or-redesigned-screen), [layout adoption rule](../ui-layout-and-hierarchy.md#adoption-rule-for-agents), [portability](../v1.0.0/phase-15-account-data-portability.md), and [pre-release precedent](../v1.0.0/pre-release-roadmap.md). Do not promote stable in this phase without accepted RC results.

## Implementation tasks

- [ ] Audit every route from Phase 0 against the final Light/Dark × Normal/Frosted glass/Normal glass matrix and log failures by screen and state.
- [ ] Resolve shared token/component/layout failures centrally; close or explicitly document every phase finding and exception.
- [ ] Review built-in wallpaper contrast, custom-image guidance, blur fallback, reduced transparency/motion, 320px reflow, large text, keyboard/focus, charts, and fixed controls.
- [ ] Update the [user guide](../user-guide.md), finalized design decisions, and release notes in the repository's Added/Changed/Fixed format, with only applicable sections.
- [ ] Verify upgrade and archive compatibility, backup/restore, and default appearance in a safe development instance; record exact evidence and any required focused regression results.
- [ ] Prepare and test an internal pre-release/RC. Keep it private until accepted; record candidate identifier, installation path, and rollback/recovery notes.

## Manual review checklist

- [ ] User completes a cross-module desktop and mobile journey in all six theme/style combinations.
- [ ] User checks old-account upgrade, old archive restore, new archive round-trip, and backup/restore in a safe instance.
- [ ] User reviews release notes and all remaining known limitations against what actually shipped.
- [ ] User accepts the RC before any separate stable-promotion decision.

## Exit and handoff

Exit when the RC, documentation, compatibility evidence, and user review are accepted. Stable promotion remains subject to the repository release rules.

**Handoff record:** Date: 2026-10-06 · Last completed task: published public `v2.0.0-rc.1` from `301da1e912b7166da6767b8fad8582dab40b2423` · Files/report: [release report](../releases/2.0.0-rc.1.md) · RC identifier: `v2.0.0-rc.1` · Compatibility results: 465 PHP tests and CI isolated Docker acceptance passed; four image scans passed · User feedback: explicitly requested public publication, overriding the internal-only distribution plan for this RC · Open issues: prior phase/manual gates and full visual matrix remain pending; no stable promotion · Next task: run the report manual checklist against the published candidate, then reconcile remaining phase findings.
