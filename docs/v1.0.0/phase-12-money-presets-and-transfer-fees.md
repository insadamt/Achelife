# Phase 12 Money presets and Transfer fees

## Preset architecture

The optional Money preset pack is version 1. Every preset Category and Subcategory has a stable, locale-independent `preset_key`; visible names are user-editable and are not used for reconciliation. `users.money_preset_pack_version` records the latest pack version applied for that user.

`InstallMoneyPresetPack` locks the user and installs the entire pack in one transaction. It is idempotent: an existing key is left exactly as the user renamed or archived it, while a deleted or otherwise missing key is recreated with its default name. Category deletion cascades its unused preset children, and the next repair recreates both levels. Used records retain the existing archive-only lifecycle.

Money Categories provides the full pack preview, missing-record counts, installation/repair action, and search across Category and Subcategory names. Subcategory choices in transaction composition and history filters are always scoped to the selected parent Category. Phase 14 first-run onboarding calls the same installer when the user selects the optional Money pack; passwordless instance setup never silently installs it, and repeated onboarding cannot duplicate keyed presets.

## Version 1 taxonomy

Expense presets:

- Housing: Rent, Mortgage, Home Maintenance, Furniture, Household Supplies
- Food: Groceries, Restaurants, Fast Food, Café, Delivery
- Transport: Fuel, Public Transport, Taxi / Ride Sharing, Parking, Tolls, Vehicle Maintenance
- Shopping: Clothing, Electronics, Personal Items, Online Shopping, Other Shopping
- Bills & Utilities: Electricity, Water, Internet, Mobile, Gas
- Health: Doctor, Pharmacy, Dental, Vision, Medical Tests
- Entertainment: Games, Movies, Events, Hobbies, Music
- Education: Courses, Books, Tuition, Software, Certifications
- Personal Care: Barber / Hairdresser, Cosmetics, Hygiene, Spa
- Family: Parents, Children, Family Support, Household Contribution
- Gifts & Donations: Gifts, Charity, Donations
- Travel: Flights, Hotels, Local Transport, Food, Activities
- Financial: Bank Fees, Interest, Taxes, Insurance
- Other: Miscellaneous, Uncategorized

Income presets:

- Work: Salary, Bonus, Overtime
- Freelance: Freelance Work, Contract Work
- Business: Sales, Services, Other Business Income
- Investments: Dividends, Interest, Capital Gains
- Gifts: Family, Friends, Other
- Other Income: Prize, Sale of Belongings, Miscellaneous

## Charity upgrade compatibility

The Phase 12 migration replaces every legacy protected top-level Charity Category with the `Gifts & Donations` preset parent and its `Charity` child. A legacy Charity transaction without a child is assigned to that Charity preset. User-created legacy children are reparented to Gifts & Donations and keep their transaction links. The migration does not change amounts, fees, dates, notes, Accounts, timestamps, or Money balance effects.

After migration, Charity is an ordinary preset. It can be renamed, archived, or deleted under the same rules as every other preset and has no scoring behavior. The legacy lazy repair action and `builtin_key` column are removed.

## Transfer fee semantics

One Transfer row remains authoritative. `amount_minor` is the exact destination credit and `fee_minor` is the source-currency fee:

```text
source debit       = amount_minor + fee_minor
destination credit = amount_minor
```

`fee_minor` defaults to zero, cannot be negative, and must be zero for Income and Expense rows. A fee does not have a separate currency because it always uses the source Account currency. Cross-currency Transfers remain unavailable.

Creation and editing lock the authoritative row and every prior and replacement Account involved before validation and persistence. Existing archived source or destination Accounts may remain on a historical Transfer; archived Accounts cannot be newly selected. Deletion locks the row and Accounts before removing it. Because balances are derived, principal and fee are reversed together without a compensating row.

The composer shows destination receipt, fee, source debit, and destination credit before save. Details and history serialize and display the exact values. For reporting and history categorization, a positive Transfer fee is projected as `Financial → Bank Fees`. The projection never populates the Transfer's Category fields, creates a hidden Expense, or applies an additional balance effect.

## Database migration

`2026_08_26_000000_add_money_presets_and_transfer_fees.php`:

- adds `users.money_preset_pack_version` with a zero default;
- adds unique per-user `preset_key` columns to both categorization levels;
- adds `money_transactions.fee_minor` with a zero default;
- migrates the complete legacy Charity relationship graph;
- removes the obsolete Category `builtin_key` after conversion.

Fresh migration tests exercise the final schema and defaults. Upgrade coverage invokes the migration's Charity conversion against representative legacy rows with empty history, uncategorized history, and custom Subcategories, then verifies relationship preservation and exact historical amounts and dates.

## Portability integration

Phase 14 connects its optional Money onboarding selection to `InstallMoneyPresetPack`. Phase 15 exports stable Category/Subcategory preset keys, exact Transfer `fee_minor`, principal, source, destination, dates, and notes. Restore uses old-to-new relationship maps and reconciles any present keyed preset by `preset_key`, never by the editable display name. Complete-graph and repeated-restore tests verify that fees remain exact and keyed presets do not duplicate.
