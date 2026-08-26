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

The shared `RankEmblem`, `RankBadge`, `RankProgress`, and `SeasonRankSummary` components render backend-provided Rank state. The lozenge emblem keeps one silhouette across the progression, adds tier-specific frame details, and develops its core from a pip through a ring and inner lozenge for divisions I through III. Legend uses a radiant core and double lozenge. Badge presentation uses explicit small, medium, large, and hero size presets so every placement can preserve the emblem's game-badge presence without hardcoded local dimensions.

The authenticated application shell exposes live Rank and Season progress through its screen-attached progress notch on every page. The Season command center gives Rank its own selectable emblem-led HUD beside the 30-day Season pulse, followed immediately by Objectives. Season switcher tokens deliberately omit Rank to keep navigation compact, while locked future tokens expose no progression.

Selecting the Rank HUD opens a horizontal 3D Rank explorer centered on the user's current division. All 22 divisions remain available through native swipe and scroll snapping, pointer selection, previous and next controls, and Left, Right, Home, and End keyboard navigation. Neighboring cards recede with restrained perspective while the selected card retains readable text, its authoritative minimum SP, the next division, and its relationship to the user's current Rank. Reduced-motion behavior keeps centering functional without smooth animation.

Rank identity always includes text and exact SP progress rather than relying on tier accent color. Long labels use responsive sizing, and all progress remains textual as well as visual.

## v1 intermission extension

Phase 11 adds `finalized_at` to the completed-Season closeout and snapshots Rank before entering an intermission. Rank does not progress during a gap, and the next manually started Season begins at zero SP and Bronze I.

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
