# Phase 6 Money

## Scope

Phase 6 adds a global, non-gamified financial tracker with Accounts, Income, Expenses, Transfers, Categories, Subcategories, transaction history, grouped balances, and reversible archives. Money never reads or mutates Season SP, contributes to rank, or applies Season locking. Objectives, Today, budgets, recurring or scheduled transactions, exchange rates, and Money Statistics remain deferred.

## Amount and balance architecture

All monetary values use integer minor units with two decimal places. `100` represents `1.00` in an Account's three-letter currency. This avoids floating-point storage and arithmetic on both SQLite and PostgreSQL. Phase 6 does not model currencies with nonstandard minor-unit scales.

Account balance is derived from its signed initial balance and the authoritative Money transaction rows:

- Income adds its positive `amount_minor` to `account_id`.
- Expense subtracts its positive `amount_minor` from `account_id`.
- Transfer subtracts from `account_id` and adds to `destination_account_id`.

There is no cached balance column, so edits cannot accumulate duplicate adjustments or drift from history. The balance service replays relevant effects and groups active Account totals by currency. Different currencies are never summed together.

## Transaction integrity

A Transfer is one `money_transactions` row, not two user-visible records. Its source, destination, amount, date, and note are created or replaced in one database transaction while related Account rows are locked. Editing the row replaces the previous source-of-truth effect, and deleting it removes both derived sides at once.

Income, Expense, and Transfer mutations validate positive amounts, ownership, active selections, Category type, Subcategory parentage, matching Transfer currencies, distinct Transfer Accounts, and dates no later than today. Historical rows remain editable and deletable without any Season lookup or SP mutation. An archived entity may remain unchanged on an existing historical row, but cannot be newly selected.

## Accounts and categorization

Accounts are user-owned, single-currency records with an initial balance, automatically assigned card theme, decorative four-digit wallet identifier, timestamps, and reversible archive timestamp. Currency and initial balance become immutable after the first transaction involving the Account. Unused Accounts may be deleted; used Accounts retain history and must be archived.

Income and Expense Categories are user-owned and type-specific. Subcategories belong to exactly one user-owned parent Category. Both levels support rename, archive, reactivation, and deletion only while unused. Archiving a parent also makes every child unavailable for new activity without destroying child state.

Every user receives one built-in Expense Category identified by the stable `charity` key. It is created during registration and lazily repaired for pre-Phase-6 users on Money access. Charity cannot be renamed, archived, or deleted, but accepts ordinary user-created Subcategories. It has no scoring behavior.

## Interface and history

`/money` uses a digital-wallet presentation with currency-grouped total balances, responsive physical-card-style Account objects, quick actions, and recent activity. Mobile Account cards scroll horizontally without shrinking. Each Account opens `/money/accounts/{account}` with its large card, contextual balance, preselected actions, lifecycle controls, and context-aware transfer direction.

Transactions use a compact responsive drawer. Generic creation first asks for Income, Expense, or Transfer and then shows only relevant fields. Existing records open in a details drawer before editing or confirmed deletion.

`/money/history` provides operational pagination and portable filters for type, Account, Category, date range, plus escaped `LIKE` search across notes and Category/Subcategory names. `/money/categories` manages the two-level hierarchy and archives. `/money/accounts/archived` preserves balances and supports Account reactivation.

## Future Statistics readiness

Transaction type, positive amount, real transaction date, Account relationships, optional Category/Subcategory relationships, notes, and stable timestamps remain available for future income, expense, charity, transfer, cash-flow, Account-trend, and arbitrary date-range calculations. No Statistics queries, summaries, or charts are implemented in Phase 6.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```
