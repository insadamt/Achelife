# Account archive export fix — 2026-10-06

## Problem and correction

Starting the next Season on the first eligible day after Day 30 legitimately persists an intermission with equal `started_on` and `ended_before` dates. Because `ended_before` is exclusive, this represents zero rest days. The archive semantic validator required the end boundary to be strictly later and rejected these accounts with “The imported intermission timeline is impossible.” Export validates its generated archive through this same validator, so it failed before returning a download. Replacement restore could also fail while creating its mandatory safety archive.

The validator now accepts equal dates while continuing to reject end boundaries before the start, incorrect start dates, and unsupported reasons. Export, import, and safety archives use the correction. No migration, persisted-data edits, archive version change, or additional library is needed. Existing records from previous releases are accepted by the corrected application. Installed older builds need an update or backport to receive the fix; this work does not modify installed Docker instances or publish a release.

## Automated verification

The new `IntermissionArchiveTest` covers 19 cases:

- Successful HTTP export after manual rollover, a one-time hold, or a restore intermission ends on its first eligible day.
- Validation, fresh restore, and re-export with the zero-day historical intermission preserved in archive formats 1 through 11. Legacy fixtures retain only the tables supported by their format and have matching counts and checksums.
- Replacement restore retains a validated safety archive for a target account with a zero-day intermission.
- Rejection of an end before the start, starts overlapping or skipping the Season boundary, and an unknown reason.

The export/restore regression was reproduced before the correction. All 19 new cases pass after it.

| Check | Result |
| --- | --- |
| Full PHP suite | 434 passed out of 445; the same 11 failures also occur on the unchanged validator baseline (415 passed out of 426, excluding the new test file). Failure names and messages were compared. |
| Changed PHP files: Pint | Passed. |
| Repository-wide Pint | Existing failures in `ArchiveAppearanceValidator.php` and `HandleInertiaRequests.php`. |
| TypeScript | Existing errors in Today animation cleanup callbacks, `AppLayout.tsx`, and `useWorkspacePageTransition.ts`. |
| ESLint | Existing React ref errors in `chartRearrangement.ts`. |
| Production build | Passed. |
| Whitespace check | Passed. |

The 11 baseline PHP failures concern outdated expectations for format 9, a newer-format rejection test using the now-supported format 10, and legacy fixtures retaining unsupported appearance tables. They are not introduced by this validation correction. Repository-wide checks must be repaired and an internal release candidate verified before stable promotion.

## Manual test checklist

These checks remain pending; automated HTTP and service tests were run, but no manual browser verification or test against the affected installed account was performed. Use an isolated development instance on the nearest available port from 8000 through 8009.

- [ ] With manual rollover enabled, start the next Season on the day immediately after Day 30. Export from Settings and confirm an `.achelife.zip` downloads without an integrity error.
- [ ] Repeat with automatic rollover and a one-time hold, then with a restored account whose held next Season starts on that same day.
- [ ] Export a copy of the originally affected account on the corrected build. Confirm its Seasons and module data are unchanged.
- [ ] Preview that archive on an isolated fresh instance, restore it, and confirm Season dates, historical intermissions, and module counts match. Re-export successfully.
- [ ] On a disposable existing account with a zero-day intermission, perform confirmed replacement restore. Download and preview its retained safety archive.
- [ ] Check accounts with an open intermission, several rest days, and uninterrupted automatic rollover still export and preview successfully.
- [ ] Preview representative archives from older releases and confirm they restore with their historical intermission dates preserved.

## Suggested commit messages

- `fix(portability): accept zero-day intermissions in account archives`
- `test(portability): cover intermission exports and legacy archive restores`
