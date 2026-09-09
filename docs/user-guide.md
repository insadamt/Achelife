[Documentation](README.md)

# User guide

## First setup

[Install Achelife](../SELF_HOSTING.md#install), then open the URL printed by the installer. Create your local profile and choose **Start fresh** or **Restore backup**.

For a fresh start, confirm your timezone and Season rollover preference. You can add up to three Objectives, a Habit, a Task, and a Money Account. These steps are optional, and interrupted setup resumes at the saved step.

Achelife has no login. Keep your instance on localhost, a trusted private network, or a private VPN.

## Today

Today shows your Tasks, Habit check-ins, Daily Progress, and Season Points. Use it as your daily starting page.

## Seasons, Objectives, SP, and Rank

A Season lasts 30 local calendar days. Set Objectives, earn Season Points (SP), and review your Rank and closeout at the end.

**Automatic rollover** starts the next Season the following day. **Manual rollover** waits until you start it. You can also request a one-time hold after the current Season.

During an intermission, seasonal progression pauses. Money and historical records remain available.

## Tasks

Create one-time or recurring Tasks with dates, subtasks, and importance. Complete or reschedule them as needed; completion history keeps its original reward attribution.

Open **Tasks → Statistics** for the separate statistics page. Statistics show completed Tasks, earned SP, on-time completion, important completions, and a line chart of completion activity. Filter by this Season, month, year, or all time. Current periods compare with the full previous period; all time has no delta. See [Task statistics](task-statistics.md) for metric definitions.

## Habits

Use Boolean check-ins or numeric tracking. Choose an icon when creating or editing a Habit to make it easier to spot across Habits, Today, and archives. Habits support schedules, streaks, skips, and archiving. Schedule changes do not rewrite earlier occurrences.

Open **Statistics** on an active or archived Habit for completion rate, completion count, current and best streaks, period comparisons, an outcome donut, and a history calendar. Numeric Habits also show totals, averages, and a Total / Average chart. Filter by Season, Month, Year, or All time. See [Habit statistics](habit-statistics.md) for metric definitions.

## Diary and People

Diary entries autosave and support moods, languages, and People mentions. Entries and People notes are included in exports and backups.

## Constitution

Create personal Laws and record violations. Penalties follow each Law's rules; historical violations retain their original Season effect.

## Money

Track Accounts, income, expenses, Transfers, fees, categories, and recurring Subscriptions. Install the editable category pack during setup or from Money settings.

Open **Money → Statistics** to compare income, opening balances, spending, net cash flow, savings rate, Categories, Account movement, fees, and Subscription spending. Filter by Season, Month, Year, currency, Account, or All time. Opening balances enter the period containing the Account creation date. See [Money statistics](money-statistics.md) for metric definitions and delta behavior.

**Manual Subscriptions** wait for you to pay or skip. **Automatic Subscriptions** record Expenses when due; they do not move money through a bank. Repeated synchronization does not duplicate payments.

Money never changes SP, Rank, or Daily Progress. Cross-currency Transfers are unsupported.

## Settings

General Settings contains appearance, your name, timezone, rollover preference, and account portability. Choose System, Light, or Dark under Appearance; the choice is stored on the current device. Changing timezone can change which local day contains an activity.

## Portable account exports

Download a `.achelife.zip` file from **Settings → General → Account portability**. To restore, upload it during setup or preview a replacement in Settings. Replacing existing data requires a verified safety export and literal `RESTORE` confirmation.

An account export moves a snapshot; it does not merge histories or continuously synchronize instances. For server recovery, use a [full-instance backup](../SELF_HOSTING.md#backup).

## Full-instance backups

Use `achelife backup` and copy the verified archive outside the Docker host. Follow the [backup and restore instructions](../SELF_HOSTING.md#backup).

## Updates

Use the stable channel by default. See [safe updates](../SELF_HOSTING.md#update).

## Getting help

Run `achelife doctor` and check the [troubleshooting steps](../SELF_HOSTING.md#troubleshooting). Never share private records, keys, or backup files in public issues.
