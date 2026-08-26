# Phase 6 Money

## Scope

Money is a global, non-gamified financial tracker with Accounts, Income, Expenses, Transfers, Categories, Subcategories, transaction history, grouped balances, and reversible archives. Money remains available during Season intermissions, never reads or mutates Season SP, and does not contribute to Rank or Daily Progress. Objectives, budgets, exchange rates, and external bank execution remain outside Money.

Phase 12 adds an optional versioned preset pack and Transfer fees. Subscriptions remain deferred to Phase 13, and portable account archives remain deferred to Phase 15.

## Amount and balance architecture

All monetary values use integer minor units with two decimal places. `100` represents `1.00` in an Account's three-letter currency. This avoids floating-point storage and arithmetic on both SQLite and PostgreSQL. Money does not model currencies with nonstandard minor-unit scales.

Account balance is derived from its signed initial balance and authoritative `money_transactions` rows:

- Income adds its positive `amount_minor` to `account_id`.
- Expense subtracts its positive `amount_minor` from `account_id`.
- Transfer subtracts `amount_minor + fee_minor` from `account_id`.
- Transfer adds exactly `amount_minor` to `destination_account_id`.

For Transfers, `amount_minor` always means the amount received by the destination Account. `fee_minor` defaults to zero, cannot be negative, uses the source Account currency, and is valid only on Transfers. Transfers require distinct Accounts with matching currencies; currency conversion is not available.

There is no cached balance column, so edits and deletion reverse principal and fees from the same source of truth without accumulated adjustments or duplicate effects. Different currencies are never summed together.

## Transaction integrity

A Transfer is one `money_transactions` row, never a hidden Expense. Its source, destination, destination credit, fee, date, and note are created or replaced in one database transaction while every old and new Account involved is locked. Editing replaces the authoritative row only after validation succeeds. Deleting locks the Transfer and both Accounts, then removes the row so both derived balance effects disappear atomically.

Income, Expense, and Transfer mutations validate positive amounts, ownership, active selections, Category type, Subcategory parentage, matching Transfer currencies, distinct Transfer Accounts, non-negative fees, and dates no later than the user's local today. Historical rows remain editable and deletable without a Season lookup or SP mutation. An archived entity may remain unchanged on an existing historical row, but cannot be newly selected.

## Accounts and categorization

Accounts are user-owned, single-currency records with an initial balance, automatically assigned card theme, decorative four-digit wallet identifier, timestamps, and reversible archive timestamp. Currency and initial balance become immutable after the first transaction involving the Account. Unused Accounts may be deleted; used Accounts retain history and must be archived.

Income and Expense Categories are user-owned and type-specific. Subcategories belong to exactly one user-owned parent Category. Both levels support rename, archive, reactivation, and deletion only while unused. Archiving a parent also makes every child unavailable for new activity without destroying child state.

Preset Categories and Subcategories are ordinary user-owned records with stable, locale-independent `preset_key` values. Names may be changed and records may be archived or deleted under normal lifecycle rules without changing their keys. The versioned installer runs in one transaction, never overwrites renamed or archived records, and repairs only missing keyed records. The user's installed pack version records the last applied pack schema while the preview independently reports missing records.

The complete optional pack contains the documented Expense and Income taxonomies in [Phase 12](../v1.0.0/phase-12-money-presets-and-transfer-fees.md). It can be previewed and installed or repaired from Money Categories. Category search matches both parent and child names. Transaction and history Subcategory choices are scoped to the selected parent Category.

Charity is the ordinary `Gifts & Donations → Charity` Expense preset. It has no protection, scoring, SP, Rank, or other special behavior. The Phase 12 migration replaces the former protected top-level Charity Category, moves uncategorized Charity history to the new Charity Subcategory, reparents custom Charity children, and preserves all historical transaction amounts and dates.

## Interface, history, and reporting projection

`/money` presents independent balance panels for each currency, compact Account cards, direct Income, Expense, and Transfer actions, and date-grouped recent activity. Each Account opens a detailed page with one authoritative balance presentation, preselected actions, lifecycle controls, and context-aware transfer direction.

The transaction drawer previews the amount received, source-currency fee, total source debit, and destination credit before a Transfer is saved. Details and activity history show the exact fee and source-side Account history uses `amount_minor + fee_minor` while destination history uses `amount_minor`.

`/money/history` supports pagination, date-grouped results, visible applied-filter chips, and filters for type, Account, parent Category, parent-scoped Subcategory, and date range. Escaped text search covers notes and Category/Subcategory names. Positive Transfer fees are projected under `Financial → Bank Fees` for search and categorization filters without setting transaction Category foreign keys, creating another transaction, or applying another balance effect. This projection is the reporting contract for later Statistics work.

## Migration compatibility

`2026_08_26_000000_add_money_presets_and_transfer_fees.php` adds the user pack version, stable Category and Subcategory preset keys, and `money_transactions.fee_minor` with a database default of zero. Existing Transfers therefore keep their previous balance semantics after upgrade.

The same migration performs the legacy Charity graph conversion before removing `builtin_key`. Existing custom Charity Subcategories remain attached to their historical transactions under Gifts & Donations. New and upgraded databases finish with the same schema.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
git diff --check
```

Coverage includes complete and repeated preset installation, missing-record repair, stable keys, ordinary rename/archive/delete behavior, the exact taxonomy, Charity migration with and without history, zero and positive Transfer fees, source and destination balance effects, edits, deletion, authorization, archived Accounts, currency matching, details, history, search, and projected Financial/Bank Fees filters.
