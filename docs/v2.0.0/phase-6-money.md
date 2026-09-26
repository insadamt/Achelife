# Phase 6 — Money

**Status:** Not started. [Roadmap](../v2.0.0_design_plan.md) · [UI guide](../ui-design-and-motion.md) · [Layout guide](../ui-layout-and-hierarchy.md)

## Plan

Bring Money into the same page rail and navigation hierarchy while retaining financial density and exact values. Read [Money workflows](../user-guide.md#money), [statistics](../money-statistics.md), [debts](../money-debts.md), and [Merchants and Tags](../v1.1.0/phase-19-money-merchants-and-tags.md).

## Implementation tasks

- [ ] Apply shared page header/module navigation/local views to overview, Accounts, History, Debts, Subscriptions, Organization, and Statistics.
- [ ] Redesign Account and activity cards, History search/filter controls, and fixed Add menu with safe mobile placement.
- [ ] Redesign entry forms, category/merchant/tag pickers, transfer/debt/subscription drawers, validation, and confirmations.
- [ ] Redesign Organization editors and archived/used-value states while preserving edit and delete constraints.
- [ ] Bring Money charts, donut detail, metric cards, legends, and tables onto readable surfaces with exact text values and non-color distinctions.
- [ ] Preserve currency handling, historical records, transfer fees, debt principal rules, subscription behavior, and zero SP effect.

## Manual review checklist

- [ ] User inspects every Money route and changes Account/currency/period filters.
- [ ] User records an expense, transfer, debt repayment, and subscription action and reviews resulting History.
- [ ] User manages Category, Merchant, and Tag values and checks archive/delete constraints.
- [ ] User checks chart labels, large amounts/long names, destructive dialogs, and fixed Add placement on mobile.

## Exit and handoff

Exit when Money routes and actions are accepted without domain-rule changes. Follow the [common review matrix](../v2.0.0_design_plan.md#common-manual-review-for-each-visual-phase).

**Handoff record:** Date: — · Last completed task: — · Files/commit: — · Decisions: — · Checks actually performed: — · User feedback: — · Open issues: — · Next task: map Money route hierarchy.
