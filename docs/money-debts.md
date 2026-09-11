# Money debts

Money Debts is available at `/money/debts`. It tracks individual agreements where the user owes a Person or a Person owes the user. Debt principal remains financial activity but is not ordinary income or spending.

## Agreements and People

Every Debt belongs to one existing Person or creates a new Person inline. A Person may have any number of independent Debts in either direction. Agreements are never automatically netted because their dates, due dates, currencies, and repayment histories may differ.

- `Payable` means the user borrowed money and owes the Person.
- `Receivable` means the user lent money and the Person owes the user.

An agreement stores a positive original amount in integer minor units, one three-letter currency, an opening date, an optional due date, and an optional note. The remaining balance is derived from repayment and forgiveness history. It is never cached.

An unsettled agreement becomes Overdue after its due date. A zero remaining balance is Settled. Status is derived rather than manually changed.

## Account movements

Every Debt opening and repayment must move money through a selected Account. This keeps the Debt ledger, Account balances, and reported Account movement reconcilable; off-ledger and track-only debts cannot be created.

| Event | Account effect | Outstanding effect |
| --- | ---: | ---: |
| User borrows | Add to the selected Account | Payable increases |
| User lends | Subtract from the selected Account | Receivable increases |
| User repays | Subtract from the selected Account | Payable decreases |
| Person repays | Add to the selected Account | Receivable decreases |

Each Account movement is one authoritative Income- or Expense-shaped `money_transactions` row linked to its Debt opening or repayment. The link identifies it as principal, so it is presented as a Debt movement and cannot be edited or deleted through the ordinary Transaction workflow. Deleting the Debt or repayment through Debts removes the link and transaction atomically, reversing both Account and outstanding effects.

The Account selected for repayment may differ from the opening Account, but it must use the Debt currency. Archived Accounts remain readable in history and cannot receive new activity. Cross-currency repayments and conversion are unsupported.

## Repayment and forgiveness

Repayments are append-only settlement records with their own positive amount, date, optional note, required Account movement, and protected transaction link. A repayment cannot precede the Debt opening date, occur in the future, or exceed the remaining balance.

Forgive balance records the complete remaining amount as Forgiveness without moving Account money because no cash changes hands. Removing a repayment or Forgiveness record reopens the Debt by that exact amount. A Debt can be deleted only before it has settlement history; deletion also reverses its opening Account movement.

## History and statistics

Transaction History includes tracked Debt movements, supports a Debt type filter, and searches linked Person names. Ordinary Income and Expense filters exclude Debt principal.

Borrowing, lending, principal repayment, and principal receipt do not change recorded Income, Spending, net cash flow, savings rate, spending breakdowns, or no-spend days. Account activity exposes Debt money in and Debt money out, and Account net movement includes both so it continues to reconcile with the authoritative Account balance. Interest and fees are outside this version and may later be recorded as ordinary Income or Expenses.

Debts remain global, work during Season intermissions, and never affect SP, Rank, or Daily Progress. The Debts page keeps currency positions and overdue attention visible before its filtered agreement list. Each agreement is one compact ledger row prioritizing Person, direction, remaining amount, due state, and repayment progress. Selecting the row opens a detail drawer containing repayment, forgiveness, settlement history, and deletion controls. A fixed Add control opens the Debt composer.

## Portability and compatibility

Archive format version 2 adds `money_debts` and `money_debt_settlements` after People, Accounts, and Transactions in dependency order. It preserves opening and repayment transaction links exactly and validates direction, currency, amounts, dates, settlement totals, Account currency, and exclusive protected links before import.

Format version 1 remains explicitly supported. Its frozen table list restores with no Debt records, and its pre-icon Habit adapter still supplies the original `check` default when required. New exports use format version 2.

The version-2 archive reader continues to accept early internal Debt records whose movement link is absent. They remain readable for backward compatibility, are labeled as legacy records, and do not make the no-Account option available for new activity.
