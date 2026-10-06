# People linked to income and expenses

Ordinary Income and Expense transactions support one optional Person, reusing the same user-owned contacts as Diary and Debts. Merchant and Person are independent: a gift bought from Amazon for Sara can retain both relationships. A Person link never creates a Debt, changes Account balances, or affects SP.

## Recording and reviewing

The transaction drawer offers No Person, existing People, and inline creation of a named Person. The Person field opens a searchable visual card modal, matching the Merchant and Category pickers. Search matches names and nicknames. Choose No Person to clear the link, or Add a new Person to enter a name; the contact is created only when the transaction is saved. New People are created atomically with the transaction; failed transaction validation leaves no new contact. Existing contacts are selected by ID, so two People sharing a name remain independent.

Overview, Account activity, History rows, and transaction details show the Person. Select their name in transaction details to open their filtered Money History. History supports a Person filter on desktop and in the mobile filter drawer, and text search matches linked names and nicknames.

Selecting a Person shows ordinary Income and Expense totals for all matching History records, including records beyond the current page. Each currency has its own totals, without conversion or combining currencies. Account, type, search, dates, Category, Merchant, and Tag filters also narrow the totals. Debt principal is excluded.

## Lifecycle and boundaries

Archived People stay readable and filterable. They cannot be newly selected, but an existing transaction can retain its archived Person while other fields are edited. People referenced by transactions cannot be deleted; archive them instead through the existing Diary People panel. That panel also recognizes Debt and transaction history when choosing Archive rather than Delete.

Transfers cannot link People. Debt and Subscription payments keep their protected editing workflows and do not receive links automatically. Multiple People, split expenses, and inferred repayment obligations are outside this feature.

## Compatibility

The migration adds nullable `money_transactions.person_id` and a composite same-user foreign key to People. Existing financial rows retain their amounts, fees, Account links, and dates. Old create payloads still work; an update omitting Person fields preserves the existing link. Explicit null clears it.

Archive format 12 includes Person references and remaps them to destination contact IDs on restore. Formats 1–11 retain their frozen transaction shapes and explicitly import with a null Person link. No older archive is rewritten. The upgrade and archive regression tests cover existing transactions and every supported previous format.

## Manual test checklist

- [ ] Add an Expense with an existing Person and Merchant; check both in activity and details.
- [ ] Add Income with a Person, then create another Person inline; confirm they are reusable in Diary and Debts.
- [ ] Change or clear a transaction's Person; verify amounts and Account balances remain correct.
- [ ] Cancel inline creation or trigger invalid amount/date validation; confirm no contact was saved.
- [ ] Filter History by Person, name, nickname, date, Account, and currency; verify totals across pagination.
- [ ] Record two currencies for one Person; verify separate totals and no conversion.
- [ ] Archive a used Person; verify old activity remains readable, their existing link remains editable, and new selection is unavailable.
- [ ] Switch to Transfer; verify Person fields disappear and no Person link is submitted.
- [ ] Export and restore format 12 in a disposable instance; verify contacts and relationships. Restore a format 11 archive and confirm transactions have no Person link.
- [ ] Review keyboard controls, long names, narrow/mobile layouts, Light/Dark themes, and available surface styles.

No stable release is published as part of this change. Verify upgrades and restore in an internal release candidate before promotion.

## Implementation verification — 2026-10-06

- Full PHP suite: 465 tests passed, 3,542 assertions. After the final update-payload readability change, all seven transaction-Person tests passed again, including inline creation during edits.
- Archive coverage includes format 12 round trips with contact ID remapping and archived People, plus transactions restored from every format 1–11. Upgrade coverage preserves an existing transaction while adding the nullable link.
- PHP formatting and Git whitespace checks passed. ESLint passed for all changed TypeScript files. Production build passed.
- Global TypeScript checking remains blocked by nine existing errors in Today animation cleanup and layout/transition nullability. Global ESLint remains blocked by two existing ref-during-render errors in `components/ui/chartRearrangement.ts`. These files were not modified by this feature.
- HTTP verification passed on `http://127.0.0.1:8002` for Money overview, Account detail, Person-filtered History, and nickname search. Ports 8000 and 8001 were occupied. The preview uses a disposable SQLite database under `/tmp`; installed Docker instances and the normal development database were not migrated or modified.
- Browser visual verification was unavailable because the in-app browser could not be connected. The manual checklist above remains pending.
- The existing intermission portability edits and their regression tests were preserved. Stale archive test fixtures were updated to omit tables and columns unsupported by their declared legacy format; the future-format test now derives its version from the current exporter.

Library decision: reviewed [React Aria ComboBox](https://react-aria.adobe.com/ComboBox), which supplies accessible picker behavior but would require a new dependency and styling/integration. The user chose to reuse Achelife's existing controls. The Person picker uses the shared Dialog, Field, and Button components and the same visual card layout as Merchants and Categories.

Suggested commit messages:

- `feat(money): link people to income and expenses`
- `feat(portability): preserve money person links in archive format 12`

## Picker refinement — 2026-10-06

Person selection now uses the same searchable visual card modal as Merchant and Category selection. It shows names, nicknames, selected checks, No Person, and inline creation. Cancel leaves the transaction selection unchanged. Retained archived People stay readable; other archived People are unavailable for new selection.

Category search now returns directly selectable Subcategories with parent names. Searching a parent name also shows its available children and a parent-only result. Selecting a Subcategory sets both IDs and closes the modal. Clearing search returns to the normal browse flow. Archived Subcategories are excluded except the transaction's existing selection.

Validation: changed-file ESLint, production build, and whitespace checks passed. Global TypeScript checking still reports the same nine unrelated errors described above. Browser visual verification remains pending. No new library, migration, or archive format change was needed.

Manual test checklist:

- [ ] Open Person selection and search by name or nickname; choose a card and verify the check when reopened.
- [ ] Choose No Person, add a new Person, and cancel a draft name; verify the resulting transaction field.
- [ ] Search a Subcategory name and select it directly; verify both Category and Subcategory in the transaction.
- [ ] Search a parent Category name and choose a child or the parent-only result.
- [ ] Clear search and verify normal parent-to-child browsing, empty results, and archived selection rules.
- [ ] Check keyboard/Escape/focus return, narrow screens, long names, Light/Dark, and surface styles.

Suggested commit: `feat(money): use visual person picker and direct subcategory search`
