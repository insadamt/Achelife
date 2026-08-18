# Phase 9 Rank and Season Progression

## Scope

Phase 9 adds a live Rank presentation over authoritative Season SP. Rank has no mutation endpoint, currency, rewards, protection, carry-over, standalone page, or Statistics behavior. Tasks, Habits, Diary, Objectives, and Constitution continue to mutate only `season_points`; Money remains isolated from SP and Rank.

## Authoritative calculation

`SeasonRankCalculator` is the only threshold and progression authority. It maps signed Season SP to a structured Rank result containing a stable key, tier and division identity, display name, current threshold, actual next Rank, division progress, SP remaining, and top-Rank state.

- Negative SP is `UNRANKED`; SP is never clamped and no arbitrary negative progress percentage is created.
- Zero SP starts `BRONZE I`.
- Divisions advance `I`, `II`, `III`, then the next main Rank in exact 100 SP intervals.
- `LEGEND` starts at 2,100 SP, has no subdivisions or ceiling, and exposes no fake next-Rank progress.

Active Rank is calculated on every Season response from the refreshed `season_points` value. Existing SP actions therefore promote and demote Rank through their normal redirect and Inertia refresh without writing a separate progression value.

## Final Rank snapshots

The existing nullable `seasons.rank` column stores only completed-Season snapshot keys such as `diamond_iii`, `legend`, or `unranked`. `SynchronizeUserSeasons` finalizes every elapsed Season before returning the new current Season. Finalization calculates and stores a missing or invalid snapshot from that Season's final SP, while an existing valid snapshot is never overwritten.

This access-driven step also backfills completed development Seasons created before Phase 9. New Seasons keep a null snapshot, begin at 0 SP, and are presented dynamically as `BRONZE I`. Historical responses hydrate their identity from the stored key and intentionally omit next-Rank progress.

## Interface

The shared `RankBadge`, `RankProgress`, and `SeasonRankSummary` components render backend-provided Rank state. The authenticated application shell exposes live Rank and Season progress through its screen-attached progress notch on every page. Season details place live progression or final Rank/SP ahead of Overview and Objectives. Carousel cards show compact current or final Rank text, while locked future cards expose no Rank.

Rank identity always includes text and exact SP progress rather than relying on tier accent color. Long labels use responsive sizing, and all progress remains textual as well as visual.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
git diff --check
```

Rank tests cover threshold boundaries, division order, normal progress, negative SP, Legend behavior, live promotion and demotion through existing module actions, reversal demotion, completed snapshots, missing-snapshot backfill, new-Season reset, Money isolation, and authenticated response scoping.
