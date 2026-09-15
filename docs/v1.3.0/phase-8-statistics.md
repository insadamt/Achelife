# Phase 8 — Expanded Task statistics

## Goal

Extend the existing Task Statistics page into combined completion and Focus analytics without removing or redefining existing completion metrics.

## Existing metrics

Preserve Completed Tasks, Task SP, On-time completion, Important Tasks completed, existing activity charts, period controls, comparison rules, empty states, and query parameters.

## Focus metrics

Add:

- Total Focus Time
- Focus Sessions
- Average Session
- Average Focus per Active Day
- Longest Session
- Focus activity chart
- User-local daily Focus heatmap
- Focus by current Project, including Inbox
- Most-focused Tasks

Manual and corrected completed sessions count exactly like timer-created completed sessions. Active running or paused time is excluded until the session is completed.

## Period attribution

- Use completed Focus Session intervals as the authoritative duration source.
- Split every interval at user-local day boundaries.
- Allocate each resulting duration portion to the matching day, month, and Season.
- A session contributes to every selected period in which at least one of its intervals contributes duration.
- Focus Session count is the number of distinct completed sessions contributing duration in the period.
- Average Session is attributed Focus duration divided by those distinct sessions.
- Average Focus per Active Day is attributed Focus duration divided by local days with positive Focus duration.
- Longest Session is the largest duration contributed by one session inside the selected period.
- Adjacent Seasons do not receive time outside their exact user-local dates; intermission Focus belongs to calendar statistics but to no Season.
- Period comparisons use the same complete preceding-period behavior as existing Task statistics.

## Project and Task attribution

- Resolve Project from the Task's current `task_project_id` when statistics are requested.
- Moving a Task moves all its Focus history to its new Project or Inbox.
- Renaming a Project changes its displayed historical label.
- Deleting a Project moves affected Tasks and their Focus totals to Inbox.
- Deleting a Task removes its Focus Sessions, so it disappears from Project and most-focused results.
- Do not add Project or Task-name snapshots to Focus Sessions.

## Visualization and accessibility

- Extend the existing period filters: Season, Month, Year, and All time.
- Use the existing statistics query parameters and preserve unrelated parameters.
- Heatmap cells expose exact local date and duration to keyboard and assistive technology.
- Charts zero-fill eligible dates, omit future dates, and remain readable in light and dark themes.
- Statistics queries cover all matching data independently of Task-list pagination.

## Verification

- [ ] Every Focus metric and empty-period behavior
- [ ] Manual, edited, deleted, and paused timer sessions
- [ ] Midnight, month, year, Season, and intermission boundaries
- [ ] Multiple intervals from pause/resume cycles
- [ ] Project move, rename, delete, and Inbox aggregation
- [ ] Task deletion and most-focused ranking
- [ ] Current-period and previous-period comparison
- [ ] User-timezone boundaries and timezone changes
- [ ] Chart and heatmap accessibility
- [ ] Existing Task statistics remain byte-for-behavior compatible where their payload is unchanged
- [ ] Update [Task statistics](../task-statistics.md) with exact metric definitions

## Exit criteria

Task Statistics reports consistent completion and Focus analytics across every supported period without allowing unfinished timers to produce unstable totals.

