# Phase 10 General Settings and user-local calendar

## Scope

Phase 10 adds authenticated General Settings and makes every calendar-day decision use the user's saved IANA timezone. It does not change UTC timestamp storage, rewrite historical calendar records, request device location, or automatically follow the user while travelling.

## Calendar model

- `users.timezone` stores an IANA identifier such as `Africa/Casablanca`, `Europe/Paris`, or `Asia/Dubai`.
- `UserCalendar` converts the current UTC instant into the user's local calendar date and returns that date as a timezone-neutral value for comparison with database `date` columns.
- Laravel's application timezone and timestamp persistence remain UTC.
- Date-only values such as Task schedules, Habit occurrences, Diary entries, transaction dates, violation dates, and Season boundaries represent user-calendar dates rather than instants.
- Timestamp values such as completion, archive, resolution, and audit times continue to represent real instants.

Task completion keeps its UTC timestamp but derives completion timing, reward attribution, recurring advancement, and the receiving Season from the user's local date containing that instant. Today aggregation, progress-panel attribution, Habit synchronization, Diary availability, Constitution validation, Money future-date validation, Objective windows, and Season synchronization use the same calendar authority.

## Stable historical boundaries

`users.calendar_started_on` permanently anchors the 30-day Season timeline. New registrations derive it from the creation instant in the browser-supplied timezone. Existing accounts are backfilled from Season 1 when available, falling back to the prior UTC creation date, so installing the migration cannot move an established timeline.

Changing timezone affects the meaning of the current day immediately but never changes `calendar_started_on`, existing Season dates, Task schedules, Habit occurrences, Diary entries, transaction dates, or violation dates. A settings warning is shown when the selected timezone currently resolves to a different date.

Laws store a stable `created_on` calendar date because violation eligibility cannot safely be derived from a UTC creation timestamp after the user changes timezone. Existing Laws retain their previous UTC-derived creation date during backfill; new Laws use the active user calendar.

## Registration and interface

Registration submits the browser's timezone from `Intl.DateTimeFormat` when available and falls back to UTC. This does not request geolocation permission. Achelife does not silently change the saved timezone on later visits.

`/settings/general` provides:

- the saved timezone;
- a complete validated IANA timezone list with current UTC offsets;
- the browser-detected timezone as an explicit option;
- a current local date and time preview;
- a warning when saving crosses the current calendar-day boundary.

General Settings is available from the authenticated account controls on desktop and mobile. The Today settings control remains scoped to Today presentation preferences.

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

Calendar tests cover positive and negative UTC offsets, settings validation and persistence, stable Season history after timezone changes, user-local Today aggregation, local Task completion timing and Season attribution, UTC timestamp persistence, and registration across a UTC date boundary.
