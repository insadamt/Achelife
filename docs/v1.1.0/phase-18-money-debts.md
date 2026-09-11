# Phase 18 Money debts

Phase 18 adds Person-linked payable and receivable agreements, required Account movements, partial repayment history, due dates, forgiveness, derived settlement state, Debt-aware Transaction History, and Account activity reporting. The detailed current contract is documented in [Money debts](../money-debts.md).

The database migration adds only new Debt and settlement tables plus the composite Person ownership key required for same-user foreign keys. Existing Accounts, Transactions, People, and balances are not rewritten. Principal Account movements reuse authoritative Money transactions and are protected by Debt links, while ordinary Income and Spending statistics remain unchanged.

Portable account archives advance to format version 2. Version 1 remains accepted through an explicit frozen table-list adapter, and version 2 validates and remaps every Person, Account, Transaction, Debt, and settlement relationship.

Coverage verifies both debt directions, required Account selection, partial repayments, Account changes, currency and date boundaries, overpayment rejection, forgiveness, reversal, transaction protection, ownership, page data, statistics isolation, format-2 round trips, and format-1 restoration.
