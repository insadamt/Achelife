# Phase 4 Diary

## Scope

Phase 4 adds one autosaved Diary entry per user and calendar date, active-Season backfill, writing streak rewards, manual languages, a two-level mood wheel, structured Person mentions, People profiles and lifecycle rules, real-calendar navigation, and portable search filters. Objectives, Constitution, Money, Today, Diary statistics, attachments, rich formatting, and automatic language or sentiment detection remain deferred.

## Content and mention model

`diary_entries.content` stores an ordered JSON array containing only text nodes (`{type: "text", text}`) and mention nodes (`{type: "mention", personId, label}`). A derived `plain_text` column concatenates visible text and mention labels for threshold counting, excerpts, and portable `LIKE` search. `diary_entry_mentions` separately records each mention node's Person ID, node position, and visible label. This preserves stable relationships through Person renames while keeping historical writing readable and searchable.

People are user-owned and intentionally lightweight: name, optional nickname and note, timestamps, and an optional archive timestamp. An unmentioned Person can be deleted. Once mentioned, foreign-key restrictions and application validation prohibit hard deletion; archive removes the Person from new autocomplete while retaining historical links and the readable profile.

## Autosave and validity

The editor debounces changes for 700 ms, aborts superseded browser requests, and sends a monotonically increasing client revision. The backend locks the daily row and ignores revisions that are not newer, preventing a delayed response or request from overwriting newer content. Saving, saved, and unobtrusive error states remain visible near the editor controls. Short and language-less drafts are persisted normally.

The active writing surface keeps a native textarea for reliable selection and input while a measurement-matched overlay renders structured mentions as clickable inline profile links with a concise hover label. Mention insertion preserves surrounding text, adds a word-boundary space only when needed, and positions autocomplete from the actual textarea caret rather than a fixed page coordinate. Autocomplete stays closed while the caret is inside an existing name token. Diary autosave requests bypass global string trimming so text-node boundary spaces survive persistence; affected development entries are safely repaired at alphanumeric mention boundaries when reopened.

The backend derives visible plain text from validated nodes and counts `mb_strlen(trim($plainText))`. Leading and trailing whitespace therefore cannot satisfy the threshold; ordinary internal spaces and visible mention labels count; JSON keys and Person IDs do not. Completion requires at least 20 visible characters, an explicitly selected configured language, and a specific mood from the mood wheel.

Once the text threshold is reached without either required selection, the editor highlights the missing mood or language control and explains which choice unlocks completion and SP. Successful autosaves immediately refresh the day state, date rail, calendar state, exact reward, writing streak, multiplier, and shared Season SP without a page reload.

## Progression and Season locking

A completed day earns 4 SP for streaks 1–9, 6 SP at ×1.5 for streaks 10–19, and 8 SP at ×2 from streak 20. Every entry stores its exact completion state, character count, streak, multiplier, and reward.

`RecalculateDiaryProgression` replays real calendar days through today within only the active Season. Completed days increment the streak, past missing or invalid days reset it, and unresolved today has no effect. The immediately preceding completed Season day supplies the immutable cross-Season baseline. Replay compares old and new Diary reward totals and applies only that exact delta to shared Season SP, preserving Task and Habit contributions. Entry writes outside the current Season, before account creation, or in the future are rejected.

## Languages and mood

Diary settings store an array of stable language codes selected from a small catalog. Removing a configured language never rewrites entries: every entry retains its code and language-name snapshot. Known Arabic, Persian, Hebrew, and Urdu codes render the writing surface RTL; application controls remain LTR. No text detection is performed.

Mood uses stable group and specific identifiers and is required for a completed, rewarded Diary day. The modal first presents eight families in a circular visual treatment, then the family's five specific moods. The selected pair is backend-validated, autosaved, clearable, and keyboard accessible. Clearing it keeps the entry as a draft and transactionally reverses/recalculates Diary progression; the particular mood selected never changes the reward amount.

## Navigation and search

Desktop Diary uses a compact 14-day state rail beside a dominant notebook-like writing surface. Mobile prioritizes the editor and opens the calendar as a dialog. The expanded Monday–Sunday calendar supports month and year traversal and serializes Completed, Pending, Missed, and Unavailable states from account creation through today. Completed Seasons remain navigable and permanently read-only.

Search operates only on persisted autosaves and supports portable plain-text `LIKE` matching plus mood, language, and Person filters. Results open their exact dates; locked history remains read-only.

## Verification

Run:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```
