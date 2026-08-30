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
- Achelife is a single-user application with no login boundary and must remain on localhost, a trusted private network, or a private VPN.
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

Replace the assumption that every date after initial setup belongs to a Season with an explicit lifecycle that supports continuous automatic Seasons, manual starts, one-time holds, and restore-created intermissions.

### Domain model

- [x] Add a user-owned rollover preference: `automatic` or `manual`.
- [x] Add a one-time `hold_next_season` state independent of the long-term preference.
- [x] Represent an open or completed intermission explicitly, including its reason: manual rollover, one-time hold, or restore.
- [x] Keep `calendar_started_on` as the immutable beginning of the user's Achelife history, not as an arithmetic source for every later Season.
- [x] Derive each new Season number from the latest persisted Season.
- [x] Prevent overlapping Seasons while allowing calendar gaps between them.
- [x] Add a central Season-cycle result that returns either an active Season or an intermission.
- [x] Add a transactional `StartNextSeason` action that creates exactly one Season for the current local date.
- [x] Make concurrent or repeated start requests idempotent or reject the second request safely.
- [x] Finalize Rank and closeout data when an active Season reaches its original Day 30.

### Automatic and manual behavior

- [x] Preserve existing continuous backfill for automatic users who return after a long absence.
- [x] Stop after the completed Season for manual users and create no later Seasons.
- [x] Let automatic users select “Pause after this Season” as a one-time hold.
- [x] Clear the one-time hold after the user starts the next Season.
- [x] Restore the user's long-term automatic/manual preference after an import-created hold is resolved.
- [x] When automatic mode is enabled during an intermission, start the next Season today rather than backdating it.
- [x] Do not allow a new Season to start before the active Season ends.
- [x] Do not support ending an active Season early in v1.

### Intermission behavior

- [x] Show an intermission dashboard with the last closeout, pause reason, elapsed rest days, and “Start Season N” action.
- [x] Keep Money, subscriptions, Settings, export/import, and historical browsing available.
- [x] Allow Task planning and rescheduling without awarding SP.
- [x] Block rewarded Task completion until a Season is active and explain why.
- [x] Pause recurring Task materialization across intermission dates.
- [x] Resume each Task series on the first eligible date on or after the new Season start.
- [x] Do not materialize Habit occurrences for intermission dates.
- [x] Preserve the last Habit streak across the intermission without incrementing it.
- [x] Do not create Diary misses during intermission and use the previous Season's final eligible day as the next streak baseline.
- [x] Keep new Diary writing, Objective mutation, and Violation recording unavailable until a Season starts.
- [x] Keep Law and historical Diary views readable.

### Restore-specific lifecycle

- [x] If the imported Season has not ended, continue it through its original Day 30.
- [x] If the imported Season has ended, finalize it on its original end date.
- [x] Synchronize scheduled behavior only from the backup date through that Season's original end date.
- [x] Treat every later date as an import-created intermission.
- [x] Create no empty intervening Seasons even when months or years elapsed.
- [x] Hold the next Season until the user starts it manually.
- [x] Example: S3 ends 2026-03-15; an import on 2026-05-17 holds the timeline until S4 starts on 2026-05-17 and ends on 2026-06-15.

### Interface and settings

- [x] Add Automatic and Manual rollover controls to General Settings.
- [x] Add a one-time hold control to the active Season command center.
- [x] Show the next Season's expected date only when automatic rollover is active and no hold is scheduled.
- [x] Show “Waiting for you” instead of invented dates for a held Season.
- [x] Confirm the exact start and end dates before manually starting a Season.
- [x] Make active, completed, future, and held states accessible without relying on color.

### Verification

- [x] Test automatic Day 30-to-Day 1 rollover.
- [x] Test manual Day 30-to-intermission transition.
- [x] Test one-time hold and preference restoration.
- [x] Test long automatic and manual absences.
- [x] Test starting after a multi-month gap.
- [x] Test user-local timezone boundaries.
- [x] Test no overlaps, duplicate numbers, or double starts.
- [x] Test every module's intermission restrictions.
- [x] Test Habit and Diary streak preservation across a gap.
- [x] Test recurring Task resumption without gap backfill.
- [x] Update the Seasons, Tasks, Habits, Diary, Constitution, Today, Rank, and timezone documentation.

---

## Phase 12 — Money presets and Transfer fees

### Goal

Make Money useful immediately with an idempotent two-level category pack and model Transfer fees as part of the authoritative Transfer record.

### Preset architecture

- [x] Add stable, locale-independent preset keys to Categories and Subcategories.
- [x] Track the installed category-pack version per user.
- [x] Install the complete pack in one transaction.
- [x] Make repeated installation repair missing presets without creating duplicates.
- [x] Keep preset names renameable and preset records archiveable or deletable under normal lifecycle rules.
- [x] Provide category search and parent-scoped Subcategory selection.
- [x] Add “Install missing presets” and a pack preview to Money settings.
- [x] Install the pack during first-run Money onboarding when selected.

### Expense preset taxonomy

- [x] Housing: Rent, Mortgage, Home Maintenance, Furniture, Household Supplies
- [x] Food: Groceries, Restaurants, Fast Food, Café, Delivery
- [x] Transport: Fuel, Public Transport, Taxi / Ride Sharing, Parking, Tolls, Vehicle Maintenance
- [x] Shopping: Clothing, Electronics, Personal Items, Online Shopping, Other Shopping
- [x] Bills & Utilities: Electricity, Water, Internet, Mobile, Gas
- [x] Health: Doctor, Pharmacy, Dental, Vision, Medical Tests
- [x] Entertainment: Games, Movies, Events, Hobbies, Music
- [x] Education: Courses, Books, Tuition, Software, Certifications
- [x] Personal Care: Barber / Hairdresser, Cosmetics, Hygiene, Spa
- [x] Family: Parents, Children, Family Support, Household Contribution
- [x] Gifts & Donations: Gifts, Charity, Donations
- [x] Travel: Flights, Hotels, Local Transport, Food, Activities
- [x] Financial: Bank Fees, Interest, Taxes, Insurance
- [x] Other: Miscellaneous, Uncategorized

### Income preset taxonomy

- [x] Work: Salary, Bonus, Overtime
- [x] Freelance: Freelance Work, Contract Work
- [x] Business: Sales, Services, Other Business Income
- [x] Investments: Dividends, Interest, Capital Gains
- [x] Gifts: Family, Friends, Other
- [x] Other Income: Prize, Sale of Belongings, Miscellaneous

### Charity migration

- [x] Replace the protected top-level Charity Category with Gifts & Donations → Charity.
- [x] Move existing Charity transactions to the new parent and Subcategory without changing amounts or dates.
- [x] Preserve and reconcile any user-created Subcategories previously attached to Charity.
- [x] Remove the obsolete built-in repair rule after the migration is proven safe.
- [x] Document that Charity is an ordinary preset and has no scoring behavior.

### Transfer fees

- [x] Add `fee_minor`, defaulting to zero, to Money Transfers.
- [x] Define `amount_minor` as the amount received by the destination Account.
- [x] Subtract `amount_minor + fee_minor` from the source Account.
- [x] Add only `amount_minor` to the destination Account.
- [x] Require a non-negative fee and restrict it to Transfers.
- [x] Use the source Account currency for the fee.
- [x] Show Transfer amount, fee, source debit, and destination credit before saving.
- [x] Keep one authoritative Transfer row; do not create a hidden Expense transaction.
- [x] Present fees under Financial → Bank Fees in future reporting without duplicating balance effects.
- [x] Make Transfer edit and deletion reverse principal and fee atomically.
- [x] Include exact fees in transaction details, history, filters, and portable exports.

### Verification

- [x] Test complete preset installation, repair, rename, archive, and deletion behavior.
- [x] Test stable preset keys across export/import.
- [x] Test Charity migration with and without existing history.
- [x] Test zero and positive fees.
- [x] Test source and destination balance effects.
- [x] Test Transfer edits, deletion, authorization, archived Accounts, and matching currencies.
- [x] Update the Money documentation.

---

## Phase 13 — Money subscriptions

### Goal

Add recurring expense definitions with automatic bookkeeping or deliberate manual payment while preserving independent historical occurrences.

### Subscription definitions

- [x] Create user-owned Subscription definitions with name, positive amount, Account, Expense Category, optional Subcategory, note, start date, optional end date, and payment mode.
- [x] Support weekly, monthly, every-three-months, and yearly recurrence.
- [x] Preserve the original monthly anchor so a 31st-of-month Subscription does not drift after February.
- [x] Support active, paused, ended, and deletable-unused lifecycle states.
- [x] Restrict new selections to active Accounts and Categories while preserving historical snapshots.
- [x] Make edits forward-only for future occurrences.

### Subscription occurrences

- [x] Materialize one occurrence per Subscription and due date with a unique constraint.
- [x] Snapshot amount, Account, Category, Subcategory, and due date on every occurrence.
- [x] Support due, paid, and skipped states.
- [x] Link a paid occurrence to exactly one ordinary Expense transaction.
- [x] Prevent duplicate processing under concurrent scheduler or page requests.
- [x] Return an occurrence to Due if its linked transaction is deleted.
- [x] Allow a one-payment override without silently changing the future definition.
- [x] Offer an explicit “apply to future payments” action.

### Automatic and manual payment

- [x] Define automatic mode as automatic Expense recording, not external bank payment.
- [x] Process due automatic occurrences with a daily scheduler.
- [x] Run the same idempotent synchronization on Money access as a correctness fallback.
- [x] Let automatic mode catch up every elapsed due date after downtime.
- [x] Show manual occurrences as Due or Overdue until paid or skipped.
- [x] Add a Pay action with prefilled amount, Account, Category, and Subcategory.
- [x] Require confirmation before skipping a due occurrence.
- [x] Preview the number and value of catch-up occurrences when a historical start date is selected.

### Interface

- [x] Add Active, Due, Paused, and Ended views under `/money/subscriptions`.
- [x] Add compact Due and Upcoming sections to the Money overview.
- [x] Surface due manual payments in Today without adding them to Daily Progress or SP.
- [x] Show a readable schedule sentence and next payment in the composer.
- [x] Show paid occurrence history and its linked transaction.

### Cross-feature behavior

- [x] Keep Subscription processing active during Season intermissions.
- [x] Keep all Subscription activity isolated from SP and Rank.
- [x] Include definitions, occurrences, and linked transactions in data portability.
- [x] Include pending automatic catch-up counts and values in import preview.
- [x] Preserve skipped and paid history across edits, archive, and restore.

### Verification

- [x] Test recurrence boundaries, leap years, month ends, and user-local dates.
- [x] Test scheduler/access idempotency and concurrent processing.
- [x] Test automatic catch-up after downtime.
- [x] Test manual Pay, Skip, edit, deletion, pause, and end behavior.
- [x] Test Category, Subcategory, Account, and cross-user validation.
- [x] Test exact balance effects and linked-transaction rollback.
- [x] Update the Money and Today documentation.

---

## Phase 14 — First-run onboarding and Season closeout

### Goal

Give new and returning users a clear path into Achelife and complete the 30-day Season loop with an explainable closeout.

### First-run onboarding

- [x] Offer “Start fresh” and “Restore backup” before creating domain data.
- [x] For a fresh start, confirm profile and timezone before Season creation.
- [x] Explain the 30-day Season, SP, Rank, and rollover preference.
- [x] Let the user create up to three initial Objectives.
- [x] Let the user create the first Habit and optional Task.
- [x] Offer the Money category pack and first Account setup.
- [x] Keep optional module steps skippable.
- [x] Use existing domain actions rather than a separate onboarding data model.
- [x] Persist completion state and allow onboarding to resume after interruption.
- [x] After import, replace creation steps with a restore and catch-up summary.

### Account and instance basics

- [x] Create exactly one internal profile through passwordless first-run setup.
- [x] Resolve the sole profile automatically without login or logout.
- [x] Remove registration, email, password, and password-recovery surfaces.
- [x] Keep internal user ownership for policies, foreign keys, exports, and restore mapping.
- [x] Fail safely instead of silently choosing among multiple existing profiles.
- [x] Document that anyone with network access can use the instance.
- [x] Keep production bound to localhost by default and require trusted LAN or private VPN access for remote use.
- [x] Require literal `RESTORE` and a verified safety export for destructive account replacement.

### Season closeout

- [x] Show final Rank, Season SP, and SP grouped by Tasks, Habits, Diary, Objectives, and Constitution.
- [x] Show Objective completion, Task resolution, Habit adherence, Diary days, and Constitution impact.
- [x] Compare with the previous completed Season when available.
- [x] Store an optional reflection and `recap_seen_at` without duplicating derived statistics.
- [x] In automatic mode, show closeout before the next Season introduction.
- [x] In manual mode, keep closeout on the intermission dashboard until the user starts the next Season.
- [x] After a restored absence, summarize the finalized imported Season and the intermission rather than showing fabricated empty Seasons.

### Verification

- [x] Test fresh, interrupted, skipped, and restored onboarding.
- [x] Test onboarding authorization and duplicate submission protection.
- [x] Test closeout totals against authoritative source records.
- [x] Test negative SP, Unranked, Legend, and Seasons with no activity.
- [x] Test automatic, manual, held, and restored closeout sequences.
- [x] Update the foundation, Seasons, Rank, and onboarding documentation.

---

## Phase 15 — Account data portability

### Goal

Create a safe, versioned, per-user archive that can migrate Achelife progress between servers while preserving relationships, historical dates, and the held-Season restore policy.

### Archive format

- [x] Use an `.achelife.zip` archive with `manifest.json`, `checksums.json`, and dependency-ordered NDJSON table files.
- [x] Separate backup format version from application version.
- [x] Record creation time, saved timezone, calendar start, rollover preference, latest Season state, table counts, and SHA-256 checksums.
- [x] Export every user-owned Season, Task, Habit, Diary, Person, Law, Objective, Money, Subscription, and settings record.
- [x] Export Transfer fees, preset keys, Subscription occurrence snapshots, closeout reflection, and intermission state.
- [x] Exclude passwords, password-reset tokens, remember tokens, sessions, and server secrets.
- [x] Produce a transactionally consistent export while writes are occurring.
- [x] Warn that the archive contains sensitive Diary and financial data.

### Validation and preview

- [x] Reject unsafe ZIP paths, duplicate entries, undeclared files, malformed rows, invalid checksums, oversized archives, and excessive uncompressed sizes.
- [x] Reject backups created materially in the future or with impossible Season timelines.
- [x] Reject newer unsupported formats with an “update Achelife first” message.
- [x] Support older formats only through explicit version adapters.
- [x] Preview backup age, source version, timezone, latest Season, Rank, SP, and counts by module.
- [x] Calculate the imported Season's remaining catch-up window through its original Day 30.
- [x] Preview Habit misses, Diary streak effects, recurring Task occurrences, Subscription catch-up, and the resulting held Season number.
- [x] Warn that changes made after the backup date are absent.

### Restore

- [x] Support fresh-install import before normal onboarding.
- [x] Support existing-instance destructive replacement after creating a safety export.
- [x] Preserve the target's internal schema identity while importing domain identity and timezone.
- [x] Lock the user against concurrent writes during restore.
- [x] Restore in dependency order with old-to-new ID maps.
- [x] Reconcile preset Categories by stable keys without duplication.
- [x] Validate Season boundaries, foreign keys, row counts, SP totals, and Subscription links before commit.
- [x] Roll back the database completely on failure.
- [x] Require literal `RESTORE` confirmation for replacement.
- [x] Run the bounded Season catch-up, finalize the imported Season when required, and open the restore intermission.
- [x] Redirect to a Welcome Back summary and Season closeout after success.

### Portability semantics

- [x] Document that export/import migrates or copies a snapshot; it is not continuous synchronization.
- [x] Document that multiple devices should use the same server for live shared progress.
- [x] Never merge two divergent Achelife histories automatically.
- [x] Make repeated restore safe without duplicate relationships.
- [x] Preserve the backup timezone initially and use the existing warning before later timezone changes.

### Verification

- [x] Round-trip a complete user graph and compare semantic equality.
- [x] Test fresh import, existing-account replacement, and multi-user isolation.
- [x] Test import before and after the latest Season's end.
- [x] Test month- and year-long stale backups without fabricated Seasons.
- [x] Test corrupted, malicious, future, older, and newer archives.
- [x] Test restore rollback, duplicate import, ID collision prevention, and post-restore record creation.
- [x] Test Subscription and Transfer-fee restoration and catch-up.
- [x] Add portable backup and restore documentation.

---

## Phase 16 — Self-hosted installer and Achelife Manager CLI

### Goal

Install and operate Achelife through a discoverable host command without requiring Git, source builds, or long Docker Compose commands.

### Installer

- [ ] Publish versioned multi-architecture container images through verified release workflows.
- [x] Prepare a guarded RC-only multi-architecture image and manager-bundle workflow without publishing it.
- [x] Install a thin `achelife` command into the user's executable path.
- [x] Support configurable installation directory, port, bind address, exact version, release channel, and non-interactive mode.
- [x] Default to localhost binding and warn before trusted-LAN exposure.
- [x] Generate and preserve secrets, Compose project identity, configuration, and persistent volumes.
- [x] Make installation idempotent and independent of the current working directory.
- [x] Wait for health and print useful recovery information on failure.

### Commands

- [x] `achelife install`
- [x] `achelife start`, `stop`, and `restart`
- [x] `achelife status` with version, URL, health, containers, database size, last backup, auto-start, and update state
- [x] `achelife update`, `update --check`, `update --to VERSION`, and explicit `update --channel rc`
- [x] `achelife enable`, `disable`, `enable --now`, and `disable --now` for boot startup
- [x] `achelife logs` and `logs --follow`
- [x] `achelife doctor`
- [x] `achelife backup` and destructive `restore FILE` for full-instance recovery
- [x] `achelife open`, `version`, and `help`
- [x] `achelife uninstall`, preserving data unless an explicit purge is confirmed
- [x] Add machine-readable `--json` output to status, doctor, and version.

### Safe updates and recovery

- [x] Lock management operations so updates, restores, and lifecycle commands cannot race.
- [x] Abort an update when preflight checks or backup verification fail.
- [x] Create a consistent full-instance backup containing the database, application key, configuration, and persistent storage.
- [x] Pull an exact image tag and record its immutable digest.
- [x] Preserve the prior running/stopped and enabled/disabled state.
- [x] Enter maintenance mode for an active update.
- [x] Run migrations and verify health, migration state, and a basic single-user-ready response.
- [x] Retain the prior image and backup until the upgraded installation is verified.
- [x] Never run old code against a migrated incompatible database; use declared rollback support or restore the verified snapshot.
- [x] Default updates to stable and require explicit RC opt-in.
- [x] Redact secrets from terminal output and logs.

### Verification

- [x] Test fresh and repeated installation.
- [x] Test custom paths, ports, bind addresses, and multiple Compose project identities.
- [x] Test stopped, running, enabled, and disabled update states.
- [x] Test unavailable Docker, port conflicts, low disk space, failed pulls, failed migrations, and failed health checks.
- [x] Test full-instance backup and restore on a clean host.
- [x] Test uninstall with retained data and explicit purge.
- [x] Add install, command reference, upgrade, backup/restore, networking, and uninstall documentation.

---

## Phase 17 — v1 release hardening and RC promotion

### Goal

Prove fresh installation, upgrades, portability, scheduling, and recovery before publishing a stable release.

### Automated release gates

- [x] Run Pint, PHPUnit, TypeScript checks, ESLint, production build, and `git diff --check`.
- [x] Add installer and CLI shell tests.
- [x] Build and scan production images for supported architectures.
- [x] Test fresh database migration and upgrade migration from the latest supported pre-v1 state.
- [x] Test backup creation before every migration path.
- [x] Run full portable and full-instance restore suites.
- [x] Verify scheduler and access-driven Subscription idempotency.
- [x] Verify progression totals and Season closeouts after restore.

### Manual acceptance matrix

- [ ] Fresh local installation and passwordless single-user onboarding.
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
