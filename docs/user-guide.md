# Achelife user guide

Achelife is a private, single-user workspace for planning daily actions, building Habits, reflecting, tracking personal rules, managing 30-day Seasons, and recording Money. It is designed for one person and does not include accounts, teams, sharing, or a login boundary.

## Before you begin

Your Achelife server contains personal information. Use it only through localhost, a trusted private network, or a private VPN. Do not expose its port directly to the public internet.

The first person who completes `/setup` becomes the one local profile. Achelife then routes directly into that profile without asking for a password. If another person can reach the server, they can use the same profile and see the same information.

## First setup

Open the URL printed by the installer. On a default installation it is:

```text
http://127.0.0.1:8080/setup
```

Create the local profile, choose the profile timezone, and complete onboarding. The onboarding flow introduces the core areas and prepares the first Season. The timezone controls the user's calendar days while timestamps remain safely stored in UTC.

You can restore a portable Achelife account during onboarding instead of starting empty. Preview the archive before confirming a restore.

## Today

Today brings together the work that matters on the current calendar day:

- due and available Tasks;
- today's Habit occurrences;
- Daily Progress and earned SP;
- current Season progress and Rank context;
- shortcuts to the surrounding areas.

Completing an item updates its own domain and the progression summary. Money activity never changes SP, Rank, or Daily Progress.

## Seasons, Objectives, SP, and Rank

Achelife organizes progression into 30-day Seasons. Each Season has its own date range, Objectives, SP total, Rank result, introduction, and closeout.

Objectives are Boolean Season outcomes. Define them during setup, then complete them when the result is genuinely achieved. Achelife preserves exact reward accounting if Objective rewards are rebalanced before the setup boundary closes.

At the end of a Season, Achelife prepares a closeout with the progression breakdown. You can review the result, move through the intermission, and start the next Season. Holds and long absences are handled through explicit lifecycle screens so missed time does not fabricate completed Seasons.

## Tasks

Tasks can be one-time or recurring. They support due dates, subtasks, completion rewards, rescheduling, and stopping the future part of a recurring series.

Completion history belongs to the date and Season in which it occurred. Editing a current Task does not rewrite previously earned Season progression.

## Habits

Habits support Boolean check-ins and numeric values. Their schedules are effective-dated, so later changes do not rewrite earlier occurrences. You can complete, skip, clear, archive, or permanently delete Habits when the available safety rules permit it.

Habit streaks follow the profile calendar and the configured schedule. A skip is an explicit state and is different from an uncompleted occurrence.

## Diary and People

The Diary autosaves entries by profile calendar date. Entries can include mood, language, rich text, and mentions of People. People records can hold names and private notes and can be archived when no longer active.

Diary entries and People notes are included in portable exports and full-instance backups. Treat those files as sensitive.

## Constitution

The Constitution is a personal set of Laws. Recording a violation applies the Law's configured escalating penalty within its defined progression rules. Historical violations retain their original Season-safe effect when Laws later change.

The Constitution is personal tracking, not access control or enforcement outside Achelife.

## Money

Money is a local record-keeping tool. It supports:

- accounts and balances;
- income, expense, and Transfer transactions;
- Transfer fees;
- categories and subcategories;
- an optional preset category pack;
- transaction history;
- recurring Subscriptions with pay, skip, pause, resume, and end workflows.

Achelife does not connect to banks, move real funds, convert currencies, or execute payments. A Subscription payment records a local transaction only.

The scheduler processes due Subscription occurrences. Opening Achelife also performs the same idempotent synchronization, so a temporarily stopped scheduler does not create duplicate payments when access resumes.

## Settings

General Settings contains profile and calendar preferences plus account portability controls. Be careful when changing timezone: a new timezone can change which local day contains a timestamp. Achelife warns before the change when stored activity may be affected.

## Portable account exports

A portable export moves or copies one Achelife account snapshot. It includes the supported application data and can be restored during onboarding or used to replace an existing instance after explicit confirmation.

Portable restore does not continuously synchronize two servers and does not merge divergent histories. Pick one authoritative history before restoring.

## Full-instance backups

Use the host manager for disaster recovery:

```bash
achelife backup
```

A full-instance backup contains the database, application key, configuration, and persistent storage. Copy the verified archive outside the Docker host and periodically test restoration on another host.

Restore on a clean host with a trusted manager bundle:

```bash
achelife restore /path/to/achelife-full-TIMESTAMP.tar.gz \
  --bin-dir "$HOME/.local/bin"
```

The archive can contain Diary, People, and Money information as well as the application key. Protect it like a password vault.

## Updates

Stable is always the default update channel. While v1 is in release-candidate testing, opt in explicitly:

```bash
achelife update --check --channel rc
achelife update --channel rc
```

The manager locks the operation, checks the host, creates and verifies a backup, pulls exact image digests, runs migrations, and verifies health. If migration or health verification fails, it restores the matched snapshot before restarting the previous image.

## Getting help

Run local diagnostics before opening an issue:

```bash
achelife status
achelife doctor
achelife logs
```

Include the Achelife version, manager version, host platform, and redacted diagnostic output in bug reports. Never attach `.env` files, `installation.env`, account exports, full-instance backups, application keys, or unredacted private records.
