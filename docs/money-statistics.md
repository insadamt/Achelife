# Money statistics

Money Statistics is available at `/money/statistics`. It reports financial activity without affecting Seasons, SP, Rank, or Daily Progress. Season is a date-range view only.

## Scope and periods

Statistics support Season, Month, Year, and All time. Month is the default. Season, Month, and Year reuse the shared statistics period selector and compare with the entire preceding period. All time has no comparison.

Every view is scoped to exactly one currency. Currencies are never converted or summed. The user may optionally narrow the selected currency to one active or archived Account. Archived Accounts, Categories, and Subcategories remain part of history.

The Account creation date in the user's saved timezone is the effective date of its opening balance. An opening balance contributes only when that local date is inside the selected period. This makes the same opening amount appear in its containing Season, Month, Year, and All-time views without repeating it in later periods.

## Authoritative totals

Total income is recorded Income plus signed opening balances effective in the period. Spending is ordinary Expenses plus positive Transfer fees. Transfer principal is excluded from both totals. Net cash flow is total income minus spending. Savings rate is net cash flow divided by total income and is unavailable when total income is not positive.

Paid Subscription occurrences are already ordinary Expense transactions and therefore count once. Due, Upcoming, and Skipped occurrences have no statistical effect. Deleting or editing an authoritative transaction immediately changes statistics.

Account activity keeps Transfer principal visible as transferred in and transferred out. Account net movement is opening balance plus recorded Income minus Expenses and fees, plus transferred in, minus transferred out.

## Deltas

Every applicable period metric shows its absolute and percentage change from the preceding period. Savings rate and Category share use percentage-point changes. A zero baseline displays `Previously 0` when the current result is nonzero and `No change` when both are zero. All time has no delta.

Delta tone follows meaning: more income, net cash flow, savings, or no-spend days is favorable; more spending, fees, or Subscription spending is unfavorable. Transaction-count movement is neutral. Net-cash-flow percentage change divides by the absolute previous value so movement across zero retains its direction.

Category and Subcategory rows show amount, share of their total, amount delta, percentage delta, and share delta where applicable. Opening balances are an explicit Income source. Positive Transfer fees are projected as `Financial → Bank Fees`, matching History reporting, without creating another transaction or balance effect.

## Charts and drill-through

The activity chart switches between Income and Spending using the same single-line presentation as Task statistics. Income combines recorded Income and opening balances; point details expose that split. Net cash flow remains available in the summary metrics instead of adding another competing chart series. Season and Month use daily buckets, Year uses monthly buckets, and All time switches from monthly to yearly buckets after 36 months. Missing buckets are zero-filled and future dates are omitted. A comparison toggle overlays the selected metric from the preceding period where one exists.

Category and Subcategory links open Transaction History with the selected dates, currency, Account, and categorization filters. History supports the same currency boundary so a drill-through cannot mix currencies.

## Supporting metrics

The page includes Account activity, average daily spending, no-spend days, Subscription spending, Transfer fees, transaction count, and the highest-spending day. Average daily spending divides total spending by every elapsed calendar day in the selected range. For All time, the range begins on the first scoped opening balance or transaction date. A no-spend day has neither an Expense nor a positive Transfer fee. Its delta compares the share of elapsed days rather than raw counts, so a partial current period remains meaningful against a full previous period.

No additional statistics snapshots or cached balances are stored. Results are derived from Accounts and authoritative transaction rows.
