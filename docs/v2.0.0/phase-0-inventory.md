# v2.0.0 Phase 0 baseline inventory

Recorded 2026-09-26 from the route table, Inertia pages, shared UI, appearance code, and [user workflows](../user-guide.md). This is a source inspection baseline. No route has yet been opened for the Phase 0 desktop/mobile manual pass, so runtime defects are **unverified**.

## Route and screen map

`App` means the desktop sidebar, mobile header/bar/More drawer, progress notch, and Focus island from `AppLayout`. `Intro` is the navigation-free `IntroductionLayout`; `Setup` is `AuthLayout`. For App routes, the shell owns the outer 92rem limit. “Feedback” covers the route's empty, loading, validation, or success presentation, not a claim that every state has been visually checked.

| GET route / screen | Shell and header | Navigation, views, and filters | Content, overlays, and feedback |
| --- | --- | --- | --- |
| `/` | Redirect | — | `/home` |
| `/setup` | Setup; setup title | None | Name/timezone form and validation |
| `/onboarding` | Intro; step title | Path → profile → objectives → habit → task → money | Optional module forms; fresh archive upload, preview, validation, resume |
| `/home` active | App; Today/date/progress | Mobile Tasks/Habits tabs; desktop parallel lists | Tasks, Habits, manual payments; Today settings dialog and Task drawer; empty lists |
| `/home` intermission | App; intermission hero | Links to Season/history | Start confirmation, closeout summary, manual payments |
| `/seasons` | App; Seasons | Season switcher and Overview/Insights views | Command center, objectives, statistics; start/hold confirmation and empty states |
| `/seasons/ranks` | App; Rank Explorer | Rank selection | Rank details and historical progression |
| `/seasons/{season}/insights` | JSON endpoint; no page shell | Requested by Seasons Insights view | Returns historical metrics for its charts; verify through `/seasons` rather than opening as a page |
| `/seasons/{season}/closeout` | App; closeout panel title | None | Reflection form, summary, validation, finalization |
| `/season-introduction` | Intro; milestone hero | Continue action | Current/previous Season introduction and acknowledgment |
| `/tasks` | App; Tasks | Tasks/Calendar/Statistics links; Files/Inbox/Project and task views; search | File browser, composer, lists, pagination, Task detail drawer, move/create dialogs, undo announcement, intermission notice |
| `/tasks/calendar` | App; Calendar | Task module links; month/week/three-day and project controls | Calendar grid/timeline, Task drawer, reschedule and empty states |
| `/tasks/statistics` | App; Task statistics | Back link, period/metric controls | Completion and Focus charts, cards, heatmap, history; chart/empty states |
| `/habits` | App; Habits | Active/archive and calendar controls | Habit cards, check-in, create/edit forms, status feedback |
| `/habits/archived` | App; Archived | Return to active | Archived cards and reactivation/empty state |
| `/habits/{habit}/statistics` | App; habit name | Date/range controls | Habit metrics/calendar and loading/empty states |
| `/diary` | App; Diary | Date rail/calendar; search, People, settings panels | Editor/autosave, mood dialog, person editor, save and empty states |
| `/constitution` | App; Constitution | Active/archived | Laws, violations, forms, confirmation/flash feedback |
| `/constitution/archived` | App; Constitution | Return to active | Archived laws and empty state |
| `/money` | App; Money Overview | Money module links | Accounts, subscriptions, recent activity; Account and transaction drawers, floating Add, empty states |
| `/money/history` | App; Money History | Money module links; search, date, type, account, Merchant/Tag filters | Activity list, transaction drawer, empty results |
| `/money/accounts/{account}` | App; Account name | Back/related Money links | Balance/activity; edit, transaction and archive actions |
| `/money/accounts/archived` | App; Archived Accounts | Back link | Archived accounts, reactivation and empty state |
| `/money/debts` | App; Money Debts | Money module links; debt status views | Debt cards, composer/repayment drawers, floating Add, empty state |
| `/money/subscriptions` | App; Money Subscriptions | Money module links; Active/Due/Paused/Ended route views | Subscriptions/due items, composer/occurrence drawers, floating Add, empty state |
| `/money/organization` | App; Money Organization | Money module links; Categories/Merchants/Tags route views | Editors, preset drawer, archive/delete confirmation, empty states |
| `/money/statistics` | App; Money Statistics | Money module links; period/currency/account controls | Charts, breakdown/detail activity, empty data |
| `/money/categories`, `/money/merchants` | Redirect | Organization section query | Legacy route aliases; retain |
| `/settings/general` | App; Settings/Account data | Appearance/Profile/Calendar/Season/Data sections via query | Appearance controls, profile/calendar forms, archive export and replacement preview/confirmation, field errors |
| `/restore/welcome` | App; Welcome Back | Continue links | Restore catch-up summary and safety export |

Non-page routes include mutations, archive download, background image delivery, Season Insights JSON, and Focus Task option JSON. Keep them in compatibility review even though they do not create additional screens.

## Shared foundation and current appearance

- `resources/js/components/ui`: Button, Surface, Field/number/date/select/checkbox, Dialog, Drawer, Metric, ProgressBar, CircularProgress, StatusChip, Icon. `AppLayout` owns global navigation, progress, Focus, and ThemeProvider. Money has a reusable page header and section nav; Tasks and Today have module/local navigation components. These are existing pieces to adapt, not discard.
- `resources/css/app.css` defines current dark and light semantic colors, one lime accent (`#d7e66b`), module aliases, shadows, `--radius-panel`, 160/220ms motion, focus utilities, and reduced-motion CSS. `resources/css/appearance.css` holds `.app-glass`, `.app-wallpaper`, and blur; `resources/css/today.css` adds Today-specific glass. League Spartan is loaded in `resources/js/app.tsx` and used for the whole interface; Inter has not been installed.
- `resources/js/theme/theme.ts`, `ThemeProvider.tsx`, and the pre-render script in `resources/views/app.blade.php` keep `system`/`light`/`dark` in device `localStorage` key `achelife.theme`. The resolved theme is set on the document before render and follows OS changes in System mode.
- `appearance_settings.surface_style` defaults to `glass`; existing values are `normal` (solid) and `glass` (Frosted glass). Missing rows also resolve to `glass` in `HandleInertiaRequests`. `AppLayout` shows the built-in city garden for glass; a custom image applies to either style. Normal without a custom image is plain. The account-owned image lives in `appearance_background_chunks`, with hash/MIME/byte metadata in `appearance_settings`; the background endpoint validates the hash.
- Current export format is **10**, not 9: it includes `appearance_settings` and image chunks. `AccountArchiveExporter`, `PortableTableRegistry`, `ArchiveFormatAdapterRegistry`, `ArchiveRowAdapter`, `ArchiveAppearanceValidator`, and `ArchiveDatabaseImporter` define the export/import path. Formats 1–9 are explicit older paths; format 10 validates only `normal`/`glass`. The older archive path has no appearance row and therefore falls back to Frosted glass.

## Layout baseline against the new guide

The shell's outer rail is 92rem. Tasks workspace/Calendar use `max-w-7xl`; Habits uses `max-w-5xl`; Seasons, Constitution, Settings, and Task Statistics commonly use `max-w-6xl`; Money pages often use the full shell width. Today uses a 2xl title, Money header uses 3xl/4xl, and many other pages use 4xl/5xl. Today local tabs are 48px high, Task views 44px, Season views 36px, and Money module links 40px. Shared buttons are 36px small or 44px medium; fields are 44px. Task module links form a rounded rail while Money module links use an underline. These are **confirmed source-level design inconsistencies**, not verified runtime failures. See the [layout audit](../ui-layout-and-hierarchy.md#current-app-audit).

Preserve the existing Focus island/progress notch, Today saved tab (session storage), Task workspace/search routes and movement, Season switcher/history, Money page header, accessible drawer/dialog focus handling, and responsive global navigation as behavioral foundations. Planned 92rem exceptions: Tasks file/project workspace, Task Calendar, and possibly wide Money Statistics charts when a standard 80rem rail demonstrably clips data. The Season introduction and intermission may keep larger hero titles; other headers should use the shared scale. Each exception must be checked when its page phase is implemented.

## Workflow baseline and known status

The [user guide](../user-guide.md) defines current flows: first setup and fresh/restore onboarding; Today Tasks/Habits and progress; 30-day Seasons, objectives, closeout/intermission and Rank; Task organization, completion, Focus and statistics; Habit check-ins/statistics; Diary autosave/People; Constitution violations; Money activity, transfers, debts, subscriptions, organization and statistics; Settings and portable archives. These are the behavior-preservation checklist for later visual phases. Domain calculations and archive semantics remain unchanged in Phases 0–6 and 8.

Known before redesign: inconsistent page rails, title scales, nav treatment and control heights; translucent contrast and blur fallback still need review, especially Light glass and uploaded images; Normal glass, editable palettes, and Inter are not implemented. No functional defect is asserted from source inspection alone. The user should record any pre-existing route failure during the manual pass below, with URL, viewport, appearance, and observed behavior.

## Proposed Phase 7 appearance compatibility design

1. Add a **new migration** for nullable palette storage on the account appearance row, never edit the existing migration. Store a versioned JSON object with independent `light` and `dark` maps of semantic **base colors**; omit/reset roles by removing overrides. Missing row, null JSON, or missing role resolves to shipped defaults. Keep the current `surface_style` and background columns and image chunks untouched. Validate known roles, canonical color syntax, size, and schema version at write/import boundaries. Do not let a malformed value break page rendering.
2. Use `normal_glass` as the distinct third saved style. Keep `normal` solid and `glass` Frosted glass. A current or older account retains its existing style. Style defaults to `glass` only when absent. Background selection remains built-in for `glass` and `normal_glass`, plain for `normal`, and uploaded image for all three.
3. Save each user-selected base color exactly in canonical `#RRGGBB` form (including the accent); never replace the saved accent with a contrast-adjusted color. Derive foreground/ink, hover, pressed, border, tint, and focus companions at render time from that base and the active theme. Choose high-contrast black/white text for filled accents; derive standalone ink against the page/surface. If a chosen color cannot meet contrast for all uses, show measured preview feedback and a warning while keeping the chosen base. Use the same derivation for both independent palettes, without linking them.
4. Keep `achelife.theme` device-local. Copying an accent writes its current exact base into the other palette once. Reset one role removes only that override. Reset all appearance clears both maps, sets account style to `glass`, removes the custom image, and resets this device's preference to System; do not change other account settings. Cross-device System preference is never exported.
5. Advance new exports to **format 11** when persistence ships. Freeze format-10 table columns and accepted values. Format 11 may add a palette column to `appearance_settings` and allow `normal_glass`; the validator must choose allowed shape by archive version. During format-10 or older restore, synthesize the new column/default in memory after validation, preserving old checksums and `normal`/`glass`. Format 1–9 must still restore without an appearance row. New exports include palettes and images. The importer must map only the selected version's columns, and a round trip must retain exact base colors. Cover old account rows, format 1–10 imports, format-11 export/import, and invalid new palette payloads with focused compatibility regression tests in Phase 7.

This proposed schema and the visual default colors require user acceptance at the Phase 0 gate; no persistence code is changed here.

## Review record

| Phase | Representative captures | Exceptions and findings | User result |
| --- | --- | --- | --- |
| 0 | Desktop and mobile route pass pending | Runtime baseline pending | Pending |
| 1–9 | Add links or filenames in each phase handoff | Record contrast, reflow, and approved exceptions there | Pending |

For the Phase 0 pass, open each row's route on desktop and a narrow viewport, including the alternate query views and the conditional intermission/closeout/restore screens when safe development data permits. Record any unavailable state instead of marking it passed. Do not perform destructive restore on the installed instance.
