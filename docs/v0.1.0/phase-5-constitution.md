# Phase 5 Constitution

## Scope

Phase 5 adds the Constitution: global user-defined Laws, active-Season violation recording, escalating per-Law penalties, exact shared Season SP adjustments, permanent Season locking, and irreversible Law archiving. Money, Objectives, Today, standalone Statistics, and Constitution Statistics remain deferred.

## Data model

- `laws` stores user ownership, name, current severity, archive timestamp, and normal creation/update timestamps. A Law remains global across Seasons.
- `violations` stores user, Law, and Season ownership; the violation date; immutable severity and base-penalty snapshots; chronological sequence; exact final SP penalty; and stable timestamp/ID ordering metadata.
- Composite foreign keys require a Violation to share its user with both its Law and Season. Enum checks constrain severity snapshots and base penalties. Model invariants enforce Season date membership, matching severity/base snapshots, positive sequences, and exact final penalties.
- `season_points` is signed from this phase onward because Constitution penalties may legitimately make a Season total negative.

## Severity and penalties

`LawSeverity` is the single severity-to-base-penalty mapping:

| Severity | Base penalty |
| --- | ---: |
| Minor | -10 SP |
| Major | -50 SP |
| Critical | -100 SP |

`ConstitutionPenaltyCalculator` validates stored base snapshots and applies `base penalty × sequence number`. There is no custom penalty field.

## Chronological progression

`RecalculateLawViolations` replays one Law within one Season using `violation_date`, `created_at`, then `id`. This permits multiple same-day records while keeping their order stable. The sequence starts at one independently for every Law and Season.

Backdating, date correction, and deletion capture the Law's previous current-Season penalty total, replay all of that Law's affected records, then add only the difference to shared Season SP. Task, Habit, and Diary contributions are never recomputed or overwritten. Existing reward replays also permit a negative shared balance now that Constitution deductions exist.

Each Violation retains its original severity and base penalty. Editing a Law's severity affects only newly recorded Violations and never resets the current-Season sequence.

## Date and Season rules

- New Violations may use today or an earlier date in the active Season.
- Today and new Law creation dates use the user's saved timezone. Each Law keeps a stable calendar creation date for historical validation.
- Future dates, completed-Season dates, and dates before the Law was created are rejected.
- Current-Season Violation dates may be corrected and current-Season Violations may be deleted.
- Once a Season completes, every Violation attributed to it is permanently immutable.

## Law lifecycle

Active Laws may be renamed or assigned a new severity. A Law may be hard-deleted only while it has no Violation history. Any Law may be archived; archive is permanent, blocks future Violations, and makes the Law read-only. Archived Laws remain visible in a dedicated read-only list and cannot be reactivated.

## Interface

`/constitution` uses a compact Law ledger with active Season SP, Constitution-only Violation count and SP lost, severity, current-Season impact, and each Law's next consequence. Active and archived Laws use linked views, while Law creation remains the single primary page action.

Recording remains a deliberate review action. Its dialog previews the new record penalty and the full Season SP adjustment, including chronological replay caused by backdating. Successful records use a short-lived undo toast. Selecting a Law opens its current-Season drawer with summary metrics, recording and editing actions, a newest-first violation ledger, exact snapshot penalties, and projected SP adjustments before date correction or deletion. `/constitution/archived` shows compact permanent read-only Laws. Long-term Season browsing, charts, and analytics are reserved for Constitution Statistics.

## v1 intermission extension

Phase 11 keeps Laws and historical violations readable during intermission. New violation recording, correction, and deletion remain guarded by the requirement that their date belongs to the active Season.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```

Constitution tests cover all severities, fixed penalties, lifecycle restrictions, forward-only severity edits, sequence continuation and Season reset, per-Law independence, backdating, date correction, deletion, stable same-day order, exact shared-SP deltas, negative Season SP, Season locking, date boundaries, page projections, and cross-user authorization.
