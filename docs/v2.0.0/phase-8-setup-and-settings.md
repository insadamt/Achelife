# Phase 8 — Settings, setup, onboarding, and restore

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Complete the remaining account and first-run flows using the shared design. Read [first setup](../user-guide.md#first-setup), [Settings](../user-guide.md#settings), [portable exports](../user-guide.md#portable-account-exports), [first-run foundation](../v0.1.0/phase-0.5-global-ui-foundation.md#first-run-setup), and [portability](../v1.0.0/phase-15-account-data-portability.md).

## Implementation tasks

- [ ] Redesign General Settings navigation and profile, calendar/timezone, Season preference, and portability panels, reusing Phase 7 Appearance controls.
- [ ] Redesign empty-instance setup, onboarding steps, resume state, and navigation-free layouts with the same typography and primitives.
- [ ] Redesign restore upload, validation errors, preview, destructive confirmation, and Welcome Back without changing data safety behavior.
- [ ] Cover pending, empty, error, success, and interrupted states and ensure feedback stays near the action that caused it.
- [ ] Preserve timezone, rollover, account export, restore preview/replacement, and installation behavior.
- [ ] Record any appearance fallback needed before an account exists.

## Manual review checklist

- [ ] User walks through fresh setup and interrupted/resumed onboarding in a safe development instance.
- [ ] User previews an archive restore, inspects validation feedback, and checks the destructive confirmation wording.
- [ ] User changes profile/timezone/rollover settings and downloads an export; confirms appearance works before and after setup.
- [ ] User checks keyboard/focus, mobile layout, long text, and all available appearance combinations.

## Exit and handoff

Exit when account and first-run journeys are accepted without changed data behavior. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: inventory remaining Settings and first-run states.
