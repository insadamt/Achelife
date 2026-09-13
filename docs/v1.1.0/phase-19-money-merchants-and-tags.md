# Phase 19 Money merchants and tags

## Scope

Money transactions can record one optional Merchant and up to ten optional Tags. Merchants answer where money came from or went. Tags add reusable dimensions that can cross Categories and Subcategories.

Merchants and Tags are user-owned and reusable. Names are matched case-insensitively after surrounding and repeated whitespace are normalized, so entering `Steam` and `steam` does not create duplicate records. The first spelling entered remains the display name. New Tags receive a deterministic color from the built-in palette.

Income and Expense transactions support Merchants and Tags. Transfers do not because they represent movement between the user's own Accounts. Debt principal movements and generated Subscription payments retain their existing protected workflows and do not acquire metadata implicitly.

## Interface and history

The transaction drawer offers a searchable visual Merchant picker that follows the same interaction pattern as Category selection, plus inline Tag creation. Existing Tags can be selected again, and selected Tags appear as removable colored chips. Transaction details and activity rows show the saved Merchant and Tags.

The **Money → Organization** workspace groups Categories, Merchants, and Tags into three focused views. Categories retain their presets and Subcategory controls. Merchants provide search, creation, rename, archive, reactivation, and safe deletion. Tags provide the same lifecycle controls plus editable colors. Used Merchants and Tags retain their transaction relationships and can only be archived; unused values may be permanently deleted. Archived values remain available to History filters and existing transaction details, but are not suggested or accepted for new activity until reactivated. Previous Category and Merchant page URLs redirect into the matching Organization view.

Money History can filter by one Merchant or one Tag. Text search covers Merchant and Tag names in addition to notes, Categories, Subcategories, and People attached to Debt movements.

## Persistence and compatibility

`money_merchants` and `money_tags` store reusable user-owned values. Both include a nullable archive timestamp. `money_transactions.merchant_id` stores the optional Merchant relationship, while `money_transaction_tags` stores the many-to-many Tag relationship. Composite same-user foreign keys prevent cross-account assignments.

The migration only adds nullable relationships and new tables. Existing transaction rows retain their exact balances, Categories, dates, notes, fees, and protected financial links. No old record requires backfilling.

Portable account archive format 3 includes Merchants, Tags, transaction Merchant references, and transaction-Tag links. Formats 1 and 2 remain accepted through explicit compatibility paths and restore with no Merchant or Tag data, matching what those formats could represent.

## Verification

Coverage includes the Organization workspace and legacy redirects, case-insensitive reuse, Merchant and Tag lifecycle authorization, archived-selection rules, editable and automatic Tag colors, edit synchronization, Transfer rejection, History filters and search, format 3 round trips, and legacy archive restore.
