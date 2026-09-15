# Task statistics

Tasks has two pages connected by Tasks / Statistics navigation. The task workspace stays at `/tasks`; the separate Statistics page at `/tasks/statistics` combines completion and Focus analytics.

Completion statistics show Completed Tasks, Task SP earned, On-time completion, and Important Tasks completed. All completion metrics use completion dates in the user's saved timezone. Older overdue Tasks completed now count now; recurring occurrences count individually, and subtasks do not count separately. Stored rewards, timing, and importance at completion are authoritative. Undoing a completion removes it from statistics until it is completed again.

The filters are Season (default), Month, Year, and All time. Season, Month, and Year include previous/next controls around the selected period label, such as `< Season 1 >` or `< September 2026 >`. The next control stops at the current period. Each selected season/month/year compares with the **entire** preceding season/month/year. All time has no selector controls or comparison. During intermission, Season initially displays the latest season. A first season has no previous-season baseline. Calendar periods with no completions have zero count/SP totals.

Count and SP cards display absolute and percentage changes. A zero baseline displays “Previously 0” for growth and “No change” when both totals are zero. On-time completion is the percentage of completions classified early or on-time, with changes in percentage points. With no completions the rate is unavailable, not zero. All time has no deltas or comparison label.

A single-color line chart switches between completed Task count and earned Task SP. It shows daily activity for season/month, monthly activity for year/all time, and yearly activity for all-time histories longer than 36 months. Missing dates within the displayed range are zero-filled; future dates are omitted. Points expose dates and values on hover and keyboard focus. Empty periods display an empty state.

Statistics cover all matching completions, independently of task-list pagination. The filter and selected value are kept in the `statistics_period` and `statistics_value` query parameters; changing either refreshes only statistics. Existing unrelated query parameters are preserved. No schema changes or stored snapshots are required.

## Focus metrics

Focus statistics use closed intervals belonging to completed Focus Sessions as their authoritative source. Timer-created, manually added, and corrected completed sessions count identically. Running and paused sessions do not count until they are stopped. Deleting a completed session removes it immediately.

- **Total Focus** is the sum of interval duration attributed to the selected period.
- **Sessions** is the number of distinct completed sessions that contribute positive duration to the selected period. A session spanning two periods counts once in each period.
- **Average Session** is attributed Focus duration divided by distinct contributing sessions.
- **Average Active Day** is attributed Focus duration divided by profile-local dates with positive Focus duration.
- **Longest Session** is the largest duration contributed by one session inside the selected period. For a boundary-spanning session, only the portion inside that period is considered.

Every closed interval is split at midnight in the user's currently saved timezone. Each duration portion is then attributed to its local day, calendar month, calendar year, and exact Season dates. Focus during an intermission appears in calendar and All-time statistics but belongs to no Season. Changing the profile timezone recalculates daily and period attribution from the stored absolute timestamps.

The Focus activity chart zero-fills eligible days, months, or years and omits future dates. The daily Focus heatmap exposes every displayed local date and its exact completed duration to pointer, keyboard, and assistive-technology users. Empty periods show zero metrics and dedicated empty states.

## Project and Task attribution

Focus by Project and Most-focused Tasks use each Task's current organization when the page is requested. Historical Focus therefore follows a Task when it moves, uses the Project's current name after a rename, and moves to Inbox when its Project is deleted. Inbox combines all unassigned Tasks. Deleting a Task cascades to its Focus Sessions, removing it from every Focus total and ranking. The page does not store Project or Task-name snapshots on Focus Sessions.

Focus comparisons use the same complete preceding Season, month, or year as completion statistics. All time has no comparison. All Focus queries cover every matching interval independently of Task-list pagination and use the existing `statistics_period` and `statistics_value` parameters without discarding unrelated query parameters.
