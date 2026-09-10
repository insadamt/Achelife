# Season stats

Season stats are available from the selected Season on `/seasons`. The Season selector includes **Overview** and **Stats** views so Rank, the 30-day pulse, and Objectives remain separate from performance analysis.

The Stats view loads on demand. Selecting it does not add statistics queries to the initial Seasons response, including when a user has a long Season history.

## Definitions

- Season SP is the authoritative signed `season_points` balance.
- SP today is the net Task, Habit, Diary, Objective, and Constitution SP attributed to the latest displayed Season day.
- Daily average divides the authoritative Season SP by elapsed Season days.
- The SP trajectory attributes completed Tasks and Objectives in the user's saved timezone. Habit, Diary, and Constitution activity uses its stored local calendar date. The chart is cumulative and preserves negative SP.
- The comparison line uses the nearest earlier finalized Season. The displayed delta compares the same elapsed day, while a completed Season compares Day 30.
- SP sources and practical outcomes reuse the same authoritative derived summary as Season closeout. No statistics snapshot or duplicated JSON is stored.

Current Seasons call the view **Season performance**. Completed Seasons call it **Season report** and remain read-only.
