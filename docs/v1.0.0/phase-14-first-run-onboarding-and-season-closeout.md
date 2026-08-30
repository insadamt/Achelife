# Phase 14 First-run onboarding and Season closeout

## First-run boundary

Passwordless instance setup creates the sole internal profile and its stable initial calendar date. It does not create a Season or any module records. The first onboarding screen offers Start fresh and Restore backup before domain setup. Phase 15 supplies upload, validation, preview, bounded catch-up, and real restore before any fresh domain action runs.

Fresh setup persists its current step on the user and resumes at that step after navigation, interruption, restart, or a failed request. Normal domain routes redirect incomplete profiles back to onboarding, and the shared progress panel remains inactive until setup completes. Each mutation locks the user and advances only when the submitted step is still current. Repeated or concurrent requests for an earlier step become no-ops, which prevents duplicate Seasons, Objectives, Habits, Tasks, Accounts, and preset installations.

Profile confirmation saves the name, validated IANA timezone, and automatic or manual rollover preference before creating Season 1 through the existing Season synchronization authority. The interface explains the fixed 30-day calendar, SP sources, Rank, and rollover behavior first. The remaining steps call the existing `CreateObjective`, `CreateHabit`, `CreateTask`, `InstallMoneyPresetPack`, and `CreateMoneyAccount` actions. Up to three Objectives are accepted; Habit, Task, category pack, and Account setup are optional and skippable. Completing Money setup marks onboarding complete and routes to the ordinary first-Season introduction.

The Phase 15 importer replaces fresh creation steps with Welcome Back, keeps imported Seasons authoritative, and routes an ended imported Season into the existing restore intermission and closeout. It never fabricates empty Seasons for an absence. Fresh, current-Season, ended-Season, month-stale, and year-stale restore coverage now closes that onboarding boundary.

## Single-user access and security boundary

Achelife is a single-user self-hosted appliance. An empty database exposes only `/setup`, which creates exactly one internal profile under a process lock. Once that profile exists, request middleware resolves it automatically; there are no registration, login, logout, email-change, password-change, or password-recovery endpoints. The internal email and generated password hash remain only for schema compatibility and are never presented as credentials.

The `users` row remains the ownership boundary for policies, foreign keys, exports, restore locks, and multi-user isolation tests. General Settings exposes only the profile display name. If an unauthenticated request encounters multiple existing profiles, Achelife returns a conflict rather than choosing one silently.

This design intentionally provides no public-internet authentication boundary. Supported access is localhost, a trusted private network, or a private VPN. Anyone who can reach the HTTP service can read and mutate the private instance. The production Compose definition therefore binds to `127.0.0.1` by default. Phase 15 destructive replacement requires literal `RESTORE` and creates and validates a safety export before mutation; the confirmation is an accident-prevention gate, not user authentication.

Phase 16 enforces that deployment boundary from the host installer. A non-localhost bind requires a separate network-risk acknowledgement even in non-interactive mode. Operational health reports zero profiles as ready for `/setup`, one as single-user ready, and rejects multiple profiles. The manager does not add login, logout, registration, password, or recovery commands.

## Closeout calculation and presentation

Final Rank and `season_points` remain the finalized Season snapshots. `SeasonCloseoutViewDataFactory` derives every other recap value from authoritative records at read time:

- Task SP from Tasks attributed to the Season and Task resolution from Tasks scheduled within its dates;
- Habit SP and adherence from required Season occurrences, with completed and skipped counts retained separately;
- Diary SP and completed writing days from Season entries;
- Objective SP and Boolean completion from Season Objectives;
- Constitution SP and impact from the Season's Violations.

No copied statistics or recap JSON is stored. The migration adds only optional `reflection` text and `recap_seen_at` to Seasons. Previous comparison reads the nearest earlier finalized Season when one exists. Signed SP remains intact, so negative totals present Unranked, zero/no-activity Seasons present Bronze I with zero outcomes, and totals at or above 2,100 SP present Legend.

Automatic rollover resolves and finalizes the ended Season as before, but both synchronized navigation and direct introduction access route through the latest closeout before showing the new Season introduction. Repeated closeout submission updates the same reflection and preserves the first seen timestamp. Manual and one-time-hold users stay on the intermission dashboard, where the complete recap and reflection remain visible until they start the next Season.

Money and Subscription synchronization remain independent of closeout and progression. Money access continues to process Subscription occurrences during onboarding-adjacent navigation and intermissions; no Money record enters the SP breakdown, Rank, or Daily Progress.

## Migration and upgrade compatibility

`2026_08_26_130000_add_onboarding_and_season_closeouts.php` is an additive forward migration. It adds onboarding state to users and reflection/seen state to Seasons. Existing users are backfilled as onboarding-complete, so upgrades never rerun first-run setup or create domain duplicates. New passwordless setup explicitly enters the `path` step.

The migration does not alter any Phase 11 lifecycle table, Phase 12 Money field, Phase 13 Subscription table, or existing transaction/occurrence key. In particular, the three Phase 13 migrations remain unchanged. Fresh databases and upgrades converge on the same schema.

## Verification and portability completion

Coverage includes empty-instance setup, automatic sole-profile resolution, missing credential endpoints, ambiguous-profile rejection, fresh and interrupted resume, fully skipped onboarding, ownership authorization, repeated submission protection, the Money preset action integration, derived closeout totals, prior-Season comparison, no activity, negative/Unranked and Legend results, automatic gating, manual intermission presentation, and cross-user closeout authorization.

Phase 15 completes restore selection, archive parsing, preview, literal-confirmed replacement, safety export, restored catch-up summaries, imported-Season finalization, restore intermissions, and restored-absence tests. Welcome Back links the authoritative imported closeout; automatic, manual, one-time-hold, and restore-created sequences all retain the same derived recap contract.
