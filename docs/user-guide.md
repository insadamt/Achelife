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

Use the **Overview / Stats** toggle in the Season selector to switch between the command center and on-demand performance analysis. Stats include the SP trajectory, source breakdown, practical outcomes, and a same-day comparison with the preceding finalized Season.

**Automatic rollover** starts the next Season the following day. **Manual rollover** waits until you start it. You can also request a one-time hold after the current Season.

During an intermission, seasonal progression pauses. Money and historical records remain available.

## Tasks

Create one-time or recurring Tasks with dates, subtasks, and importance. A checklist can contain as many steps as needed; press Enter to add each step or paste multiple lines to add a complete checklist at once. Complete or reschedule Tasks as needed; completion history keeps its original reward attribution.

Open a Task to review and edit its details without leaving the side panel. On larger screens, choosing a field widens the panel into a divided workspace and keeps the Task summary visible beside the native editor pane; on smaller screens, **Details** returns from the editor to the summary. You can also start Focus Time or review completed Focus Sessions there. **Add time**, session edit, and session delete use the same editor pane instead of opening another modal. The global timer continues from server time while you navigate, reload, or close the browser. Starting Focus on another Task pauses the current one and starts or resumes the chosen Task; only one counter runs. Open the Dynamic Island to pause the running Task, resume a paused Task, find another Task, or finish any open Focus Session. Paused time is saved in its Task's session but appears in statistics only after you finish Focus. Completing a Task finishes its open Focus Session. Task details show completed Focus Time in your saved timezone. Manual ranges cannot overlap other Focus intervals and may be no longer than 24 hours.

Open **Tasks → Statistics** for the separate statistics page. Completion analytics show completed Tasks, earned SP, on-time completion, important completions, and completion activity. Focus analytics add completed Focus Time, session counts and averages, longest session, daily activity, a local-day heatmap, Project totals, and most-focused Tasks. Filter both sections by Season, month, year, or all time. Current periods compare with the full previous period; all time has no delta. See [Task statistics](task-statistics.md) for exact metric definitions.

## Habits

Use Boolean check-ins or numeric tracking. Choose an icon when creating or editing a Habit to make it easier to spot across Habits, Today, and archives. Habits support schedules, streaks, skips, and archiving. Schedule changes do not rewrite earlier occurrences.

Open **Statistics** on an active or archived Habit for completion rate, completion count, current and best streaks, period comparisons, an outcome donut, and a history calendar. Numeric Habits also show totals, averages, and a Total / Average chart. Filter by Season, Month, Year, or All time. See [Habit statistics](habit-statistics.md) for metric definitions.

## Diary and People

Diary entries autosave and support moods, languages, and People mentions. Entries and People notes are included in exports and backups.

## Constitution

Create personal Laws and record violations. Penalties follow each Law's rules; historical violations retain their original Season effect.

## Money

Track Accounts, income, expenses, Transfers, fees, categories, recurring Subscriptions, and Debts. Use the fixed **Add** control for new activity. Income and Expense entry uses a searchable visual Category and Subcategory picker. You can also add one Merchant and up to ten colored Tags to Income or Expenses. Merchant identifies where money came from or went, while Tags add reusable dimensions across Categories. Install the editable category pack during setup or from Money settings.

Open **Money → History** to search Merchant and Tag names or filter activity by a specific Merchant or Tag. Transfers do not use Merchants or Tags because both Accounts already identify the movement endpoints.

Open **Money → Organization** to control Categories, Merchants, and Tags from one page. The three views let you manage Category presets and Subcategories, create or rename Merchants, and create or recolor Tags. Used Merchants and Tags cannot be deleted because that would damage history; archive them instead. Unused values can be deleted permanently.

Open **Money → Debts** to record money you borrowed or lent. Choose an existing Person or create one inline, then select the Account that received the borrowed money or funded the loan. Every partial repayment must use a same-currency Account, though it may differ from the opening Account. Forgiveness closes the remaining balance without pretending that money moved. See [Money debts](money-debts.md) for the complete behavior.

Open **Money → Statistics** to compare income, opening balances, spending, net cash flow, savings rate, Categories, Account movement, fees, and Subscription spending. Filter by Season, Month, Year, currency, Account, or All time. Opening balances enter the period containing the Account creation date. See [Money statistics](money-statistics.md) for metric definitions and delta behavior.

**Manual Subscriptions** wait for you to pay or skip. **Automatic Subscriptions** record Expenses when due; they do not move money through a bank. Repeated synchronization does not duplicate payments.

Debt principal is excluded from ordinary Income and Spending statistics. Money never changes SP, Rank, or Daily Progress. Cross-currency Transfers and cross-currency Debt repayments are unsupported.

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
