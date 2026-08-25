# Achelife v1 pre-release roadmap

## Purpose

This roadmap defines the remaining product, portability, and self-hosting work required before Achelife v1.0.0. It extends the implemented Phase 0–10 foundation without changing the existing module reward rules unless a phase below explicitly says so.

The implementation order is dependency-driven. Season lifecycle and Money schema changes must be complete before backup format version 1 is frozen. Installation and update tooling follows portability because every update must be protected by a verified backup.

## Locked product decisions

- A Season always lasts exactly 30 user-local calendar days once it starts.
- An active Season is never paused, extended, shortened, or shifted by export/import.
- Automatic rollover starts the next Season on the day after the current Season ends.
- Manual rollover enters an intermission after Day 30 and waits for the user to start the next Season.
- An automatic user may request a one-time hold after the current Season without changing the long-term rollover preference.
- Import always applies a one-time hold after the latest imported Season. It never fabricates empty Seasons for time elapsed after that Season.
- Starting a held Season uses the current user-local date and creates an end date 29 days later.
- Intermission dates belong to no Season and never award or deduct SP.
- Seasonal Habit, Diary, Objective, and Constitution progression is inactive during intermission.
- Recurring Task schedules pause during intermission and resume from the next Season start without generating gap occurrences.
- Money remains global and fully operational during intermission.
- Subscription automation remains active during intermission because Money is not gamified.
- Portable account archives and full-instance recovery backups are different products with different restore paths.
- A restore replaces scoped data after preview and confirmation; it never attempts an automatic merge.
- Stable releases affecting installation, upgrades, migrations, backups, security, or networking must pass through a release candidate first.

## Phase dependency map

1. Phase 11 — Season lifecycle, rollover, and intermissions
2. Phase 12 — Money presets and Transfer fees
3. Phase 13 — Money subscriptions
4. Phase 14 — First-run onboarding and Season closeout
5. Phase 15 — Account data portability
6. Phase 16 — Self-hosted installer and Achelife Manager CLI
7. Phase 17 — v1 release hardening and RC promotion

## Implementation protocol

- Start each implementation chat by reading this roadmap and the Phase 0–10 documents affected by that phase.
- Implement one numbered phase at a time unless a checklist item explicitly depends on a small preparatory change from the next phase.
- Update or add the phase-specific documentation in the same change as the implementation.
- Check an item only after its code, tests, interface behavior, and documentation are complete.
- Preserve existing user data through explicit migrations and verify both fresh and upgraded databases.
- Do not begin Phase 15 archive-format stabilization until the Phase 11–14 schemas are final.
- Do not promote a stable release until every Phase 17 release gate passes against an RC.

---

## Phase 11 — Season lifecycle, rollover, and intermissions

### Goal

Replace the assumption that every date after registration belongs to a Season with an explicit lifecycle that supports continuous automatic Seasons, manual starts, one-time holds, and restore-created intermissions.

### Domain model

- [ ] Add a user-owned rollover preference: `automatic` or `manual`.
- [ ] Add a one-time `hold_next_season` state independent of the long-term preference.
- [ ] Represent an open or completed intermission explicitly, including its reason: manual rollover, one-time hold, or restore.
- [ ] Keep `calendar_started_on` as the immutable beginning of the user's Achelife history, not as an arithmetic source for every later Season.
- [ ] Derive each new Season number from the latest persisted Season.
- [ ] Prevent overlapping Seasons while allowing calendar gaps between them.
- [ ] Add a central Season-cycle result that returns either an active Season or an intermission.
- [ ] Add a transactional `StartNextSeason` action that creates exactly one Season for the current local date.
- [ ] Make concurrent or repeated start requests idempotent or reject the second request safely.
- [ ] Finalize Rank and closeout data when an active Season reaches its original Day 30.

### Automatic and manual behavior

- [ ] Preserve existing continuous backfill for automatic users who return after a long absence.
- [ ] Stop after the completed Season for manual users and create no later Seasons.
- [ ] Let automatic users select “Pause after this Season” as a one-time hold.
- [ ] Clear the one-time hold after the user starts the next Season.
- [ ] Restore the user's long-term automatic/manual preference after an import-created hold is resolved.
- [ ] When automatic mode is enabled during an intermission, start the next Season today rather than backdating it.
- [ ] Do not allow a new Season to start before the active Season ends.
- [ ] Do not support ending an active Season early in v1.

### Intermission behavior

- [ ] Show an intermission dashboard with the last closeout, pause reason, elapsed rest days, and “Start Season N” action.
- [ ] Keep Money, subscriptions, Settings, export/import, and historical browsing available.
- [ ] Allow Task planning and rescheduling without awarding SP.
- [ ] Block rewarded Task completion until a Season is active and explain why.
- [ ] Pause recurring Task materialization across intermission dates.
- [ ] Resume each Task series on the first eligible date on or after the new Season start.
- [ ] Do not materialize Habit occurrences for intermission dates.
- [ ] Preserve the last Habit streak across the intermission without incrementing it.
- [ ] Do not create Diary misses during intermission and use the previous Season's final eligible day as the next streak baseline.
- [ ] Keep new Diary writing, Objective mutation, and Violation recording unavailable until a Season starts.
- [ ] Keep Law and historical Diary views readable.

### Restore-specific lifecycle

- [ ] If the imported Season has not ended, continue it through its original Day 30.
- [ ] If the imported Season has ended, finalize it on its original end date.
- [ ] Synchronize scheduled behavior only from the backup date through that Season's original end date.
- [ ] Treat every later date as an import-created intermission.
- [ ] Create no empty intervening Seasons even when months or years elapsed.
- [ ] Hold the next Season until the user starts it manually.
- [ ] Example: S3 ends 2026-03-15; an import on 2026-05-17 holds the timeline until S4 starts on 2026-05-17 and ends on 2026-06-15.

### Interface and settings

- [ ] Add Automatic and Manual rollover controls to General Settings.
- [ ] Add a one-time hold control to the active Season command center.
- [ ] Show the next Season's expected date only when automatic rollover is active and no hold is scheduled.
- [ ] Show “Waiting for you” instead of invented dates for a held Season.
- [ ] Confirm the exact start and end dates before manually starting a Season.
- [ ] Make active, completed, future, and held states accessible without relying on color.

### Verification

- [ ] Test automatic Day 30-to-Day 1 rollover.
- [ ] Test manual Day 30-to-intermission transition.
- [ ] Test one-time hold and preference restoration.
- [ ] Test long automatic and manual absences.
- [ ] Test starting after a multi-month gap.
- [ ] Test user-local timezone boundaries.
- [ ] Test no overlaps, duplicate numbers, or double starts.
- [ ] Test every module's intermission restrictions.
- [ ] Test Habit and Diary streak preservation across a gap.
- [ ] Test recurring Task resumption without gap backfill.
- [ ] Update the Seasons, Tasks, Habits, Diary, Constitution, Today, Rank, and timezone documentation.

---

## Phase 12 — Money presets and Transfer fees

### Goal

Make Money useful immediately with an idempotent two-level category pack and model Transfer fees as part of the authoritative Transfer record.

### Preset architecture

- [ ] Add stable, locale-independent preset keys to Categories and Subcategories.
- [ ] Track the installed category-pack version per user.
- [ ] Install the complete pack in one transaction.
- [ ] Make repeated installation repair missing presets without creating duplicates.
- [ ] Keep preset names renameable and preset records archiveable or deletable under normal lifecycle rules.
- [ ] Provide category search and parent-scoped Subcategory selection.
- [ ] Add “Install missing presets” and a pack preview to Money settings.
- [ ] Install the pack during first-run Money onboarding when selected.

### Expense preset taxonomy

- [ ] Housing: Rent, Mortgage, Home Maintenance, Furniture, Household Supplies
- [ ] Food: Groceries, Restaurants, Fast Food, Café, Delivery
- [ ] Transport: Fuel, Public Transport, Taxi / Ride Sharing, Parking, Tolls, Vehicle Maintenance
- [ ] Shopping: Clothing, Electronics, Personal Items, Online Shopping, Other Shopping
- [ ] Bills & Utilities: Electricity, Water, Internet, Mobile, Gas
- [ ] Health: Doctor, Pharmacy, Dental, Vision, Medical Tests
- [ ] Entertainment: Games, Movies, Events, Hobbies, Music
- [ ] Education: Courses, Books, Tuition, Software, Certifications
- [ ] Personal Care: Barber / Hairdresser, Cosmetics, Hygiene, Spa
- [ ] Family: Parents, Children, Family Support, Household Contribution
- [ ] Gifts & Donations: Gifts, Charity, Donations
- [ ] Travel: Flights, Hotels, Local Transport, Food, Activities
- [ ] Financial: Bank Fees, Interest, Taxes, Insurance
- [ ] Other: Miscellaneous, Uncategorized

### Income preset taxonomy

- [ ] Work: Salary, Bonus, Overtime
- [ ] Freelance: Freelance Work, Contract Work
- [ ] Business: Sales, Services, Other Business Income
- [ ] Investments: Dividends, Interest, Capital Gains
- [ ] Gifts: Family, Friends, Other
- [ ] Other Income: Prize, Sale of Belongings, Miscellaneous

### Charity migration

- [ ] Replace the protected top-level Charity Category with Gifts & Donations → Charity.
- [ ] Move existing Charity transactions to the new parent and Subcategory without changing amounts or dates.
- [ ] Preserve and reconcile any user-created Subcategories previously attached to Charity.
- [ ] Remove the obsolete built-in repair rule after the migration is proven safe.
- [ ] Document that Charity is an ordinary preset and has no scoring behavior.

### Transfer fees

- [ ] Add `fee_minor`, defaulting to zero, to Money Transfers.
- [ ] Define `amount_minor` as the amount received by the destination Account.
- [ ] Subtract `amount_minor + fee_minor` from the source Account.
- [ ] Add only `amount_minor` to the destination Account.
- [ ] Require a non-negative fee and restrict it to Transfers.
- [ ] Use the source Account currency for the fee.
- [ ] Show Transfer amount, fee, source debit, and destination credit before saving.
- [ ] Keep one authoritative Transfer row; do not create a hidden Expense transaction.
- [ ] Present fees under Financial → Bank Fees in future reporting without duplicating balance effects.
- [ ] Make Transfer edit and deletion reverse principal and fee atomically.
- [ ] Include exact fees in transaction details, history, filters, and portable exports.

### Verification

- [ ] Test complete preset installation, repair, rename, archive, and deletion behavior.
- [ ] Test stable preset keys across export/import.
- [ ] Test Charity migration with and without existing history.
- [ ] Test zero and positive fees.
- [ ] Test source and destination balance effects.
- [ ] Test Transfer edits, deletion, authorization, archived Accounts, and matching currencies.
- [ ] Update the Money documentation.

---

## Phase 13 — Money subscriptions

### Goal

Add recurring expense definitions with automatic bookkeeping or deliberate manual payment while preserving independent historical occurrences.

### Subscription definitions

- [ ] Create user-owned Subscription definitions with name, positive amount, Account, Expense Category, optional Subcategory, note, start date, optional end date, and payment mode.
- [ ] Support weekly, monthly, every-three-months, and yearly recurrence.
- [ ] Preserve the original monthly anchor so a 31st-of-month Subscription does not drift after February.
- [ ] Support active, paused, ended, and deletable-unused lifecycle states.
- [ ] Restrict new selections to active Accounts and Categories while preserving historical snapshots.
- [ ] Make edits forward-only for future occurrences.

### Subscription occurrences

- [ ] Materialize one occurrence per Subscription and due date with a unique constraint.
- [ ] Snapshot amount, Account, Category, Subcategory, and due date on every occurrence.
- [ ] Support due, paid, and skipped states.
- [ ] Link a paid occurrence to exactly one ordinary Expense transaction.
- [ ] Prevent duplicate processing under concurrent scheduler or page requests.
- [ ] Return an occurrence to Due if its linked transaction is deleted.
- [ ] Allow a one-payment override without silently changing the future definition.
- [ ] Offer an explicit “apply to future payments” action.

### Automatic and manual payment

- [ ] Define automatic mode as automatic Expense recording, not external bank payment.
- [ ] Process due automatic occurrences with a daily scheduler.
- [ ] Run the same idempotent synchronization on Money access as a correctness fallback.
- [ ] Let automatic mode catch up every elapsed due date after downtime.
- [ ] Show manual occurrences as Due or Overdue until paid or skipped.
- [ ] Add a Pay action with prefilled amount, Account, Category, and Subcategory.
- [ ] Require confirmation before skipping a due occurrence.
- [ ] Preview the number and value of catch-up occurrences when a historical start date is selected.

### Interface

- [ ] Add Active, Due, Paused, and Ended views under `/money/subscriptions`.
- [ ] Add compact Due and Upcoming sections to the Money overview.
- [ ] Surface due manual payments in Today without adding them to Daily Progress or SP.
- [ ] Show a readable schedule sentence and next payment in the composer.
- [ ] Show paid occurrence history and its linked transaction.

### Cross-feature behavior

- [ ] Keep Subscription processing active during Season intermissions.
- [ ] Keep all Subscription activity isolated from SP and Rank.
- [ ] Include definitions, occurrences, and linked transactions in data portability.
- [ ] Include pending automatic catch-up counts and values in import preview.
- [ ] Preserve skipped and paid history across edits, archive, and restore.

### Verification

- [ ] Test recurrence boundaries, leap years, month ends, and user-local dates.
- [ ] Test scheduler/access idempotency and concurrent processing.
- [ ] Test automatic catch-up after downtime.
- [ ] Test manual Pay, Skip, edit, deletion, pause, and end behavior.
- [ ] Test Category, Subcategory, Account, and cross-user validation.
- [ ] Test exact balance effects and linked-transaction rollback.
- [ ] Update the Money and Today documentation.

---

## Phase 14 — First-run onboarding and Season closeout

### Goal

Give new and returning users a clear path into Achelife and complete the 30-day Season loop with an explainable closeout.

### First-run onboarding

- [ ] Offer “Start fresh” and “Restore backup” before creating domain data.
- [ ] For a fresh start, confirm profile and timezone before Season creation.
- [ ] Explain the 30-day Season, SP, Rank, and rollover preference.
- [ ] Let the user create up to three initial Objectives.
- [ ] Let the user create the first Habit and optional Task.
- [ ] Offer the Money category pack and first Account setup.
- [ ] Keep optional module steps skippable.
- [ ] Use existing domain actions rather than a separate onboarding data model.
- [ ] Persist completion state and allow onboarding to resume after interruption.
- [ ] After import, replace creation steps with a restore and catch-up summary.

### Account and instance basics

- [ ] Allow authenticated users to change name, email, and password.
- [ ] Support open, closed, or first-user-only registration policy.
- [ ] Default new self-hosted installations to closing registration after the first account.
- [ ] Require password confirmation for destructive account or restore actions.
- [ ] Provide an administrator CLI password-reset path that does not require email delivery.

### Season closeout

- [ ] Show final Rank, Season SP, and SP grouped by Tasks, Habits, Diary, Objectives, and Constitution.
- [ ] Show Objective completion, Task resolution, Habit adherence, Diary days, and Constitution impact.
- [ ] Compare with the previous completed Season when available.
- [ ] Store an optional reflection and `recap_seen_at` without duplicating derived statistics.
- [ ] In automatic mode, show closeout before the next Season introduction.
- [ ] In manual mode, keep closeout on the intermission dashboard until the user starts the next Season.
- [ ] After a restored absence, summarize the finalized imported Season and the intermission rather than showing fabricated empty Seasons.

### Verification

- [ ] Test fresh, interrupted, skipped, and restored onboarding.
- [ ] Test onboarding authorization and duplicate submission protection.
- [ ] Test closeout totals against authoritative source records.
- [ ] Test negative SP, Unranked, Legend, and Seasons with no activity.
- [ ] Test automatic, manual, held, and restored closeout sequences.
- [ ] Update the foundation, Seasons, Rank, and onboarding documentation.

---

## Phase 15 — Account data portability

### Goal

Create a safe, versioned, per-user archive that can migrate Achelife progress between servers while preserving relationships, historical dates, and the held-Season restore policy.

### Archive format

- [ ] Use an `.achelife.zip` archive with `manifest.json`, `checksums.json`, and dependency-ordered NDJSON table files.
- [ ] Separate backup format version from application version.
- [ ] Record creation time, saved timezone, calendar start, rollover preference, latest Season state, table counts, and SHA-256 checksums.
- [ ] Export every user-owned Season, Task, Habit, Diary, Person, Law, Objective, Money, Subscription, and settings record.
- [ ] Export Transfer fees, preset keys, Subscription occurrence snapshots, closeout reflection, and intermission state.
- [ ] Exclude passwords, password-reset tokens, remember tokens, sessions, and server secrets.
- [ ] Produce a transactionally consistent export while writes are occurring.
- [ ] Warn that the archive contains sensitive Diary and financial data.

### Validation and preview

- [ ] Reject unsafe ZIP paths, duplicate entries, undeclared files, malformed rows, invalid checksums, oversized archives, and excessive uncompressed sizes.
- [ ] Reject backups created materially in the future or with impossible Season timelines.
- [ ] Reject newer unsupported formats with an “update Achelife first” message.
- [ ] Support older formats only through explicit version adapters.
- [ ] Preview backup age, source version, timezone, latest Season, Rank, SP, and counts by module.
- [ ] Calculate the imported Season's remaining catch-up window through its original Day 30.
- [ ] Preview Habit misses, Diary streak effects, recurring Task occurrences, Subscription catch-up, and the resulting held Season number.
- [ ] Warn that changes made after the backup date are absent.

### Restore

- [ ] Support fresh-install import before normal onboarding.
- [ ] Support authenticated destructive replacement after creating a safety export.
- [ ] Preserve or create the target login while importing domain identity and timezone according to the chosen flow.
- [ ] Lock the user against concurrent writes during restore.
- [ ] Restore in dependency order with old-to-new ID maps.
- [ ] Reconcile preset Categories by stable keys without duplication.
- [ ] Validate Season boundaries, foreign keys, row counts, SP totals, and Subscription links before commit.
- [ ] Roll back the database completely on failure.
- [ ] Require current password and literal `RESTORE` confirmation for replacement.
- [ ] Run the bounded Season catch-up, finalize the imported Season when required, and open the restore intermission.
- [ ] Redirect to a Welcome Back summary and Season closeout after success.

### Portability semantics

- [ ] Document that export/import migrates or copies a snapshot; it is not continuous synchronization.
- [ ] Document that multiple devices should use the same server for live shared progress.
- [ ] Never merge two divergent Achelife histories automatically.
- [ ] Make repeated restore safe without duplicate relationships.
- [ ] Preserve the backup timezone initially and use the existing warning before later timezone changes.

### Verification

- [ ] Round-trip a complete user graph and compare semantic equality.
- [ ] Test fresh import, existing-account replacement, and multi-user isolation.
- [ ] Test import before and after the latest Season's end.
- [ ] Test month- and year-long stale backups without fabricated Seasons.
- [ ] Test corrupted, malicious, future, older, and newer archives.
- [ ] Test restore rollback, duplicate import, ID collision prevention, and post-restore record creation.
- [ ] Test Subscription and Transfer-fee restoration and catch-up.
- [ ] Add portable backup and restore documentation.

---

## Phase 16 — Self-hosted installer and Achelife Manager CLI

### Goal

Install and operate Achelife through a discoverable host command without requiring Git, source builds, or long Docker Compose commands.

### Installer

- [ ] Publish versioned multi-architecture container images through verified release workflows.
- [ ] Install a thin `achelife` command into the user's executable path.
- [ ] Support configurable installation directory, port, bind address, exact version, release channel, and non-interactive mode.
- [ ] Default to localhost binding and warn before trusted-LAN exposure.
- [ ] Generate and preserve secrets, Compose project identity, configuration, and persistent volumes.
- [ ] Make installation idempotent and independent of the current working directory.
- [ ] Wait for health and print useful recovery information on failure.

### Commands

- [ ] `achelife install`
- [ ] `achelife start`, `stop`, and `restart`
- [ ] `achelife status` with version, URL, health, containers, database size, last backup, auto-start, and update state
- [ ] `achelife update`, `update --check`, `update --to VERSION`, and explicit `update --channel rc`
- [ ] `achelife enable`, `disable`, `enable --now`, and `disable --now` for boot startup
- [ ] `achelife logs` and `logs --follow`
- [ ] `achelife doctor`
- [ ] `achelife backup` and destructive `restore FILE` for full-instance recovery
- [ ] `achelife open`, `version`, and `help`
- [ ] `achelife registration status|open|close`
- [ ] `achelife user reset-password EMAIL`
- [ ] `achelife uninstall`, preserving data unless an explicit purge is confirmed
- [ ] Add machine-readable `--json` output to status, doctor, and version.

### Safe updates and recovery

- [ ] Lock management operations so updates, restores, and lifecycle commands cannot race.
- [ ] Abort an update when preflight checks or backup verification fail.
- [ ] Create a consistent full-instance backup containing the database, application key, configuration, and persistent storage.
- [ ] Pull an exact image tag and record its immutable digest.
- [ ] Preserve the prior running/stopped and enabled/disabled state.
- [ ] Enter maintenance mode for an active update.
- [ ] Run migrations and verify health, migration state, and a basic authenticated-ready response.
- [ ] Retain the prior image and backup until the upgraded installation is verified.
- [ ] Never run old code against a migrated incompatible database; use declared rollback support or restore the verified snapshot.
- [ ] Default updates to stable and require explicit RC opt-in.
- [ ] Redact secrets from terminal output and logs.

### Verification

- [ ] Test fresh and repeated installation.
- [ ] Test custom paths, ports, bind addresses, and multiple Compose project identities.
- [ ] Test stopped, running, enabled, and disabled update states.
- [ ] Test unavailable Docker, port conflicts, low disk space, failed pulls, failed migrations, and failed health checks.
- [ ] Test full-instance backup and restore on a clean host.
- [ ] Test uninstall with retained data and explicit purge.
- [ ] Add install, command reference, upgrade, backup/restore, networking, and uninstall documentation.

---

## Phase 17 — v1 release hardening and RC promotion

### Goal

Prove fresh installation, upgrades, portability, scheduling, and recovery before publishing a stable release.

### Automated release gates

- [ ] Run Pint, PHPUnit, TypeScript checks, ESLint, production build, and `git diff --check`.
- [ ] Add installer and CLI shell tests.
- [ ] Build and scan production images for supported architectures.
- [ ] Test fresh database migration and upgrade migration from the latest supported pre-v1 state.
- [ ] Test backup creation before every migration path.
- [ ] Run full portable and full-instance restore suites.
- [ ] Verify scheduler and access-driven Subscription idempotency.
- [ ] Verify progression totals and Season closeouts after restore.

### Manual acceptance matrix

- [ ] Fresh local installation and first-user onboarding.
- [ ] Trusted-LAN installation with security warning.
- [ ] Automatic Season rollover and long absence.
- [ ] Manual rollover, one-time hold, and multi-month intermission.
- [ ] Mid-Season export followed by a late import and manual next-Season start.
- [ ] Complete Money preset installation, Transfer fees, and Subscription payments.
- [ ] Existing-user upgrade with verified data, restart persistence, and rollback recovery.
- [ ] Desktop and mobile accessibility checks for every new workflow.
- [ ] Backup files stored outside the Docker host and restored on a different machine.

### Release process

- [ ] Publish `v1.0.0-rc.1`; do not publish stable directly.
- [ ] Test fresh install, update, backup, restore, failure recovery, and data persistence against the RC image.
- [ ] Fix issues in subsequent RCs without bypassing the same gates.
- [ ] Preserve the last RC backup and exact image digests used for acceptance.
- [ ] Promote the verified RC source to `v1.0.0` only when all required checks pass.
- [ ] Publish release notes with upgrade, backup, restore, known limitations, and rollback instructions.

## Explicit v1 boundaries

- No automatic merging of divergent account exports.
- No continuous offline-first synchronization between independent servers.
- No external bank execution or bank-account integration for Subscriptions.
- No cross-currency Transfers or fee conversion.
- No active-Season pause, early completion, or date shifting.
- No SP, Rank, or Daily Progress effects from Money.
- No full Statistics destination beyond the Season closeout and required operational summaries.
- No automatic stable release before RC verification.
