# Habit statistics

Open Statistics on an active or archived habit to see its own history at `/habits/{habit}/statistics`. The page is read-only and restricted to the habit's owner. Deleted habits are unavailable.

Season (default), Month, Year, and All time use the same period resolver as task statistics. Previous/next controls select historical periods, stop at the current period, and compare against the entire preceding season, month, or year. During intermission, Season shows the latest season. All time has no comparison. Query parameters `statistics_period` and `statistics_value` preserve the selection; filter changes refresh only statistics and retain unrelated query parameters.

Completion rate is completed required days divided by completed plus missed required days. Skipped days, pending days, flexible extras, future dates, unscheduled dates, and intermissions do not enter that denominator. With no eligible outcomes the rate is unavailable. Times completed includes flexible extras, whose count appears separately. The donut shows only resolved scheduled outcomes: completed, missed, and skipped. Its percentages include skips, so its completed share can differ from completion rate.

Current streak is the current overall stored streak, without a period comparison. Best streak counts consecutive completions within the selected period, including flexible extras; skips and unscheduled/intermission days preserve it, while required misses reset it. A streak entering a period starts counting from the first completion within that period.

Numeric totals include all recorded values, including zero, partial missed days, today's partial entry, and unresolved flexible extras. Average divides by the number of days with a recorded value; missing values are not zeros. Values use the habit's displayed unit. Historical targets come from occurrence snapshots.

Count, best streak, total, and average cards show absolute and percentage changes. Completion rate shows percentage-point changes. Zero baselines show “Previously 0” or “No change”; unavailable averages/rates have no numeric delta.

Boolean charts show completions. Numeric charts switch between Total and Average per recorded day. Season/month charts use daily buckets; year/all-time charts use monthly buckets, switching to yearly buckets for all-time histories longer than 36 months. Future buckets are omitted. Missing totals/counts are zero-filled; missing averages are gaps. Daily numeric charts show historical target marks. Points expose exact values on hover and keyboard focus.

The calendar uses the habit calendar's state colors and symbols. Season shows a continuous grid across its dates; Month shows a single month grid; Year shows month grids through the current month or the full historical year. All time offers a calendar year selector without changing the statistics period. Selecting a day shows its outcome, whether it was a flexible extra, and any numeric value/target. Dates outside the selected period and future dates cannot be selected. Entries cannot be edited from this view.

Statistics use stored local occurrence dates and synchronize habits through today in the user's saved timezone before reading history. No schema changes or additional snapshots are required.
