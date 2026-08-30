# Phase 13 Money subscriptions

## Domain model

Subscriptions are global, user-owned recurring Expense definitions. A definition stores its name, positive integer minor-unit amount, Account, Expense Category, optional parent-scoped Subcategory, optional note, start and optional end dates, recurrence, payment mode, lifecycle status, and original calendar anchor. Weekly, monthly, every-three-months, and yearly schedules are supported.

Monthly and quarterly dates are calculated from the original start month and `anchor_day`, never from the prior occurrence. A schedule beginning on the 31st therefore uses the final day of a shorter month and returns to the 31st when possible. Yearly February 29 schedules similarly use February 28 in non-leap years and return to February 29 in leap years.

Definitions are Active, Paused, or Ended. Pausing retains already-due history, removes future placeholders, and stops materialization and automation. Resuming starts eligibility on the user's current local date, so the paused interval does not become catch-up debt. Ending removes only future unresolved placeholders and preserves every due, paid, and skipped occurrence. A definition is deletable when it has no resolved or already-due history; its harmless future Upcoming placeholder does not make it used.

New selections must be active and user-owned. An existing archived Account, Category, or Subcategory remains readable and may stay unchanged on its definition or occurrence. Definition edits are forward-only: past and current snapshots are retained, future Due placeholders are replaced from the edited definition, and changing the start date does not rewrite history.

## Occurrences and payment

`money_subscription_occurrences` stores one row per Subscription and due date, enforced by a unique database constraint. Each row snapshots the due date, amount, Account, Category, optional Subcategory, note, and payment mode. Occurrences are Due, Paid, or Skipped. Paid and skipped rows are never regenerated or rewritten by later definition edits; changing a definition from manual to automatic therefore affects future payments rather than reinterpreting old manual dues.

A paid occurrence links to one ordinary Expense in `money_transactions`. The occurrence has at most one transaction and the transaction ID is globally unique among occurrences, so neither a repeated page request nor concurrent synchronization can create a second authoritative payment. The existing Expense validator and `SaveMoneyTransaction` path remain authoritative; Subscription payment adds no hidden balance row and has no Transfer behavior.

Manual Pay begins with the occurrence snapshot and allows a one-payment amount or selection override. The explicit “Apply these values to future payments” control updates the definition and existing future Due snapshots only. Skip requires a confirmation and records a durable Skipped state without an Expense.

Deleting a linked Expense clears the link and returns its occurrence to Due in the same transaction before the Expense is removed. It also records `automatic_retry_blocked_at`, preventing an automatic Subscription from silently recreating a payment the user deliberately deleted. The user may then Pay or Skip that Due occurrence explicitly.

## Synchronization

`SynchronizeMoneySubscriptions` is the single idempotent synchronization boundary. It uses the user's timezone through `UserCalendar`, locks one definition at a time, materializes elapsed due dates plus one Upcoming occurrence, and records every elapsed automatic Expense in chronological order. Automatic means bookkeeping inside Achelife; it never executes an external bank or merchant payment.

The scheduler invokes `SynchronizeAllMoneySubscriptions` daily with overlap prevention. The same synchronization runs for every single-user `/money` request and before Today is assembled. Page access therefore repairs missed scheduler runs, while the daily job handles unattended instances. The definition lock, occurrence unique constraint, Due-state lock, and unique transaction link protect scheduler/page races and repeated requests.

Phase 16 gives the scheduler its production runtime: a dedicated container using the same exact digest-pinned app image and persistent volumes. It waits for application health and starts with migrations disabled, leaving forward migrations to the app container. Docker restart policy follows the manager's enabled/disabled state.

Phase 14 onboarding creates no Subscription definitions, but its optional Account and category-pack setup uses the existing Money actions that later Subscription setup consumes. Synchronization remains active on Money access and throughout intermissions. Subscription activity remains excluded from closeout, SP, Rank, and Daily Progress.

Synchronization does not resolve or inspect a Season. It continues during manual, held, and restore-created intermissions and never reads or changes SP, Rank, Daily Progress, or Season progression.

## Interface

`/money/subscriptions` provides Active, Due, Paused, and Ended views. The composer shows a readable recurrence sentence, next payment, automatic-bookkeeping explanation, and the count and total of historical catch-up payments before creation. Subscription cards expose lifecycle controls, future schedule editing, occurrence history, and linked Expense IDs. Due occurrence details provide prefilled Pay values, one-payment overrides, the explicit future-value action, and confirmed Skip.

Money Overview includes compact Due and Upcoming lists. Today includes only due manual payments, including during intermission. Those payments are a separate financial section and never enter Daily Progress or Today SP.

## Database migration and portability boundary

`2026_08_26_100000_create_money_subscriptions.php` adds the definition and occurrence tables without modifying existing financial rows. It adds a composite unique key to `money_transactions(user_id, id)` so occurrence links can enforce same-user ownership at the database boundary. `2026_08_26_110000_add_subscription_occurrence_processing_fields.php` then adds the snapshotted payment mode and automatic retry block, backfilling existing occurrences from their parent definitions. `2026_08_26_120000_repair_money_transaction_subscription_key.php` repairs early SQLite Phase 13 schemas that created the composite occurrence foreign key before its matching parent unique index existed. The migrations are safe for fresh databases, Phase 12 upgrades, and both early Phase 13 schema variants.

The schema contains durable definition lifecycle dates, occurrence snapshots, transaction links, and the automatic retry block needed to determine pending automatic work. Phase 15 now exports and restores every field, validates occurrence schedule dates and paid links, and previews automatic catch-up counts and minor-unit values through the imported Season's original Day 30. Paid, skipped, Due, linked, and retry-blocked history remains authoritative. Later ordinary Money access resumes the normal intermission-active Subscription behavior.

Restore maps definitions before occurrences and transactions before paid links. Existing occurrence snapshots are never regenerated; only missing elapsed dates are materialized through the bounded restore target. Complete-graph, skipped/paid history, automatic catch-up, Transfer-fee, repeated-restore, and rollback coverage prove the portability boundary.

## Verification

Coverage includes monthly anchors, quarter boundaries, leap years, weekly recurrence, local-date boundaries, historical automatic catch-up, repeated synchronization, unique constraints, manual Pay and Skip, one-payment and future-value overrides, deletion rollback, exact balances, pause/resume/end/delete behavior, selection ownership and archive rules, access fallback, Money views, Today isolation, intermission behavior, and fresh/upgrade migrations.

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
git diff --check
```
