# Phase 15 Account data portability

## Snapshot boundary

Achelife account portability copies or migrates one user-owned snapshot between servers. It is not continuous synchronization and it never merges divergent histories. Multiple devices that need live shared progress should connect to the same Achelife server.

Every archive contains private Diary writing, People notes, Money balances, transactions, Transfer fees, and Subscription history. Treat an archive like a password vault: transfer it through a trusted channel, retain only the copies that are needed, and store it encrypted when the surrounding storage is not already protected.

## Archive format version 1

Exports use the filename suffix `.achelife.zip`. The ZIP contains:

- `manifest.json`;
- `checksums.json`;
- one NDJSON file per portable table under `tables/`.

`archive_format_version` is independent from `source_application_version`. Format version 1 is frozen around the Phase 11–14 schema. A newer format is rejected with “Update Achelife first.” An older format is accepted only when a named adapter is registered; there is no implicit best-effort import.

The manifest records UTC creation time, the source-local creation date, application and format versions, saved timezone, immutable calendar start, long-term rollover preference, latest Season number/dates/Rank/SP/finalization state, exact table counts, module counts, and the declared file list. `checksums.json` contains a SHA-256 digest for the manifest and every NDJSON file.

The dependency order is account profile; Seasons and intermissions; Task series, exclusions, Tasks, subtasks, and reschedules; Habits, definition versions, occurrences, and settings; People, Diary entries, mentions, and settings; Laws and Violations; Objectives; Money Accounts, Categories, Subcategories, Subscriptions, transactions, occurrences, and settings. Transfer `fee_minor`, stable preset keys, occurrence selection and payment-mode snapshots, linked transactions, skipped/paid state, automatic retry blocks, closeout reflection, and `recap_seen_at` are retained exactly.

The safe profile row includes only domain identity and calendar settings. Email, password hash, email verification state, remember token, password-reset tokens, sessions, cache, queues, application keys, environment configuration, and server secrets are excluded.

## Export consistency and checksums

The exporter reads the user graph in one database transaction. PostgreSQL explicitly uses repeatable-read isolation; SQLite and MySQL use their transaction snapshot behavior. The internal profile row is locked and all account requests plus scheduled Subscription synchronization share the same per-user operation lock. Date-only values are normalized to `YYYY-MM-DD`, making the archive independent from database-specific midnight serialization.

NDJSON files are written incrementally and then checksummed. The ZIP is created only after the manifest, counts, and digests are complete. Checksums detect corruption or alteration; they are not a digital signature and do not prove who created an archive.

## Validation and preview

Validation performs no extraction. It rejects unreadable ZIPs, absolute or traversal paths, backslashes, dot segments, directories, symbolic links, duplicate entries, undeclared or missing files, too many files, oversized compressed archives, oversized entries, excessive total expansion, overlong NDJSON rows, malformed JSON, malformed NDJSON, unexpected columns, duplicate IDs, mixed-user rows, missing foreign keys, inconsistent row/module counts, and invalid SHA-256 digests. Decompressed limits are enforced again while streams are read rather than trusting ZIP directory metadata alone.

Domain validation rejects non-30-day or overlapping Season timelines, nonconsecutive Season numbers, calendar-start mismatches, impossible intermissions, invalid SP totals, duplicate preset keys, impossible Transfer fee structure, malformed Subscription dates, duplicate or mismatched payment links, and backups materially in the future. The latest Season manifest state must match its authoritative row.

The preview shows backup age, source application and version, format version, timezone, calendar start, rollover preference, latest Season, Rank, SP, counts by module, and the next held Season number. It warns that post-backup changes are absent and that replacement does not merge data.

Catch-up preview is bounded from the backup's local date through the imported latest Season's original Day 30. It reports required Habit outcomes that become Missed, missing Diary days and resulting streak, recurring Task occurrences, and automatic Subscription count and minor-unit values grouped by Account currency. No elapsed month or year is converted into an empty Season.

## Fresh restore

Fresh restore is available only at the first onboarding path step, before a Season or module record exists. The user uploads an archive, receives the complete validated preview, and confirms restore. The destination's internal schema-compatibility identity remains in place while the archive's name, timezone, calendar start, long-term rollover preference, settings, and domain graph are imported.

Successful import marks onboarding complete and replaces the fresh Objective, Habit, Task, and Money creation steps with a Welcome Back page. The page summarizes catch-up, the imported Season, its original Day 30, the restore intermission, and the held next Season. If the imported Season ended, its closeout is finalized and linked directly from the summary.

## Existing-instance replacement and safety export

Existing-instance replacement requires literal `RESTORE`. Before any destructive database mutation, Achelife creates a new account archive of the current target graph, validates every checksum and relationship, and retains that safety export under the target profile. Failure to create, validate, or retain it prevents replacement. Because Achelife has no login boundary, this literal is deliberate-action confirmation rather than identity verification.

Restore then locks the profile and replaces the scoped graph inside one database transaction. The importer never changes the internal compatibility email or generated password hash. Any failure during deletion, mapping, insertion, validation, catch-up, finalization, or summary creation rolls back the entire database replacement. The retained safety export remains available for download from Welcome Back.

## ID mapping, presets, and repeated restore

Archive IDs are relationship keys only. Restore never inserts source primary keys. It creates old-to-new maps in dependency order and rewrites every foreign key, including Person IDs embedded in Diary mention nodes. This prevents collisions with existing or future records.

Preset Categories and Subcategories reconcile by stable `preset_key`; visible renamed values remain the archive values and duplicate keys are not created. Replacement deletes the target domain graph in reverse dependency order, then imports forward. Repeating the same restore replaces the prior snapshot again, so relationships, occurrences, and preset records do not duplicate. New records continue from the destination database's own identity sequence.

## Season and Subscription catch-up

Restore preserves the backup timezone before any catch-up date is calculated. Recurring Tasks, Habit occurrences, Diary progression, and Subscription automation replay only through the earlier of the current local date and the latest imported Season's original Day 30. Existing paid, skipped, Due, retry-blocked, and linked Subscription history is left authoritative; newly elapsed automatic dues use the normal idempotent payment action.

If the imported Season has ended, its final eligible Habit and Diary outcomes are resolved, Rank and `finalized_at` are stored, and no later Season is fabricated. A restore intermission begins the day after that original Day 30. If the imported Season is still active, it continues unchanged and the restore intermission is already reserved for the day after Day 30.

Restore sets the independent one-time hold while preserving the imported long-term automatic/manual preference. Starting the held next Season uses the current user-local date, closes the restore intermission, clears the one-time hold, and leaves the long-term preference unchanged. Money remains global and non-gamified throughout.

## Schema and upgrade compatibility

Phase 15 adds no database migration. It uses the final Phase 11 lifecycle, Phase 12 preset/fee, Phase 13 Subscription, and Phase 14 onboarding/closeout columns. The four protected Phase 13–14 migrations remain unchanged. Fresh databases and Phase 14 upgrades therefore converge on the same archive-format version 1 schema without rewriting a migration that may already have run.

`ACHELIFE_VERSION` identifies the source application build in new archives and defaults to `1.0.0-rc.1-dev`. This work does not publish a stable release; installation, upgrade, migration, backup/restore, and security changes must pass through an RC.

Phase 16 adds a separate `achelife-full-*.tar.gz` operational backup. It contains the complete SQLite volume, application key, manager configuration, recorded image digests, and persistent application storage for server recovery and update rollback. It must never be uploaded to the `.achelife.zip` import interface. Conversely, a `.achelife.zip` profile snapshot excludes infrastructure secrets and is not sufficient as the only pre-migration rollback point.

## Verification

Automated coverage includes complete-graph export/import, fresh onboarding restore, existing-instance replacement, internal identity preservation, multi-user isolation, old-to-new ID mapping, Diary mention rewriting, preset reconciliation, exact Transfer fees, Subscription snapshots and paid/skipped history, bounded Subscription catch-up, repeated restore, post-restore inserts, current and ended Seasons, month- and year-long stale backups, no fabricated Seasons, literal confirmation, safety-export failure, full transaction rollback, and the shared restore lock.

Adversarial coverage includes corrupted non-ZIPs, invalid checksums, traversal paths, duplicate and undeclared entries, malformed NDJSON, impossible Season timelines, oversized entries, excessive expansion, future backups, newer formats, and older formats without an explicit adapter.

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
git diff --check
```
