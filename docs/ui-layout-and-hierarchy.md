# Page layout and hierarchy

This is the layout contract for Achelife page redesigns. Read it with the [UI and motion guide](ui-design-and-motion.md). It covers alignment, widths, vertical rhythm, headings, navigation levels, tabs, and control dimensions. The values below are proposed shared defaults for the redesign; they are not all implemented yet.

## Before alignment audit

The shared application shell allows content up to `92rem`, but pages choose widths independently. Tasks and Calendar use `max-w-7xl`; Habits uses `max-w-5xl`; Seasons, Statistics, Constitution, and Settings commonly use `max-w-6xl`; Money pages have no page-level width wrapper and can expand to the shell limit. Those decisions change the left and right edges of content when moving between destinations.

Top-level title size also changes by module: Today uses `text-2xl`, Money's shared page header uses `text-3xl sm:text-4xl`, and many Tasks, Habits, Diary, Constitution, and Settings pages use `text-4xl sm:text-5xl`. Some pages place section navigation next to the title, while Money puts it below a bordered heading. The visual order of title, context, action, and navigation therefore changes during navigation.

Controls at similar levels use different shapes and heights. Today view tabs use `min-h-12` and a large pill; Task view tabs use `min-h-11` in a rounded panel; Season view tabs use `min-h-9`; Money section links use `min-h-10` with an underline. Money Debts and Subscriptions use another underline pattern for local views. The shared Button uses `min-h-9` or `min-h-11`, and shared fields use `min-h-11`. These are source observations, not a claim that every difference is wrong; the problem is that equivalent roles have no shared rule.

Representative source: `resources/js/layouts/AppLayout.tsx`, `resources/js/features/today/TodayHeader.tsx`, `resources/js/features/today/TodayTabSwitcher.tsx`, `resources/js/features/tasks/TaskSectionNav.tsx`, `resources/js/features/tasks/TaskViewNavigation.tsx`, `resources/js/features/seasons/SeasonSwitcher.tsx`, `resources/js/features/money/MoneyPageHeader.tsx`, and `resources/js/features/money/MoneySectionNav.tsx`.

| Existing area | Redesign alignment target |
| --- | --- |
| Money pages reaching the `92rem` shell limit | Shared `80rem` page rail |
| Habits `max-w-5xl` and common `max-w-6xl` pages | Standard `80rem` page rail; narrow individual reading columns inside it |
| Tasks workspace and Calendar `max-w-7xl` | Use the same `80rem` rail as the other pages |
| Today, Money, and other top-level titles using different scales | Shared responsive page-title scale; retain a larger hero only for a deliberate milestone |
| Task and Money module navigation using different patterns | One shared module-navigation role and placement below the page header |
| Today, Task, Season, Debt, and Subscription local views | One shared local-view pattern with consistent height and selected state; preserve each view's route or in-page behavior |

## One page frame

The shared page chrome uses one `80rem` rail and a `7rem` desktop header. Headers scroll with the page. Titles and controls align vertically in a rounded header; descriptions and secondary metrics sit outside it. Route navigation shares the header surface, keeps 44px targets, and scrolls horizontally when it cannot fit. Frosted and normal glass use a blurred translucent header and navigation surface; reduced-transparency settings use an opaque surface.

All authenticated destinations use the same inner content rail and left edge after the global sidebar. The default page rail is `80rem` maximum and fills the available width below that. It is centered inside the shell, with the shell providing consistent responsive side padding. Page headers, module navigation, and primary content align to this rail.

A long-reading or single-form section may have a narrower **inner column**, but its page header and navigation stay aligned with the main rail. Do not assign a different page max width simply because a new module is being built.

The page frame grows with content. Do not force a fixed page height or equal-height cards across unrelated sections. Use equal heights only within a deliberate row of peer cards, and preserve content and controls when text wraps or the viewport narrows.

## Vertical rhythm

Use a shared spacing scale based on 4px steps. The main intervals are 8px for tightly related items, 12px for controls within a group, 16px for card contents or peer cards, 24px from a page header to its navigation or first section, and 32px between major sections. Larger gaps are allowed for a deliberate hero or milestone, but the ordinary page should not invent a new rhythm.

The application shell owns top and side padding. Pages own the space between their header, module navigation, local controls, and content. Avoid stacking page-level padding on top of shell padding. On mobile, respect the bottom navigation, safe area, and any floating control; no content or keyboard focus should be completely hidden behind them. [WCAG 2.2 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) is the reference for that requirement.

## Consistent page hierarchy

Each standard page follows this order:

1. **Page header:** one `h1`, module navigation where present, and at most one prominent page action. Place descriptive context below the header.
2. **Module navigation:** destinations such as Tasks / Calendar / Statistics or Money / History / Debts. Place it beside the heading when space allows, and wrap it below the heading within the same header surface on narrower screens.
3. **Local view controls:** tabs, search, filters, and period controls belonging to this page.
4. **Primary content:** summary or main work area, then supporting sections.
5. **Feedback:** loading, empty, error, and success states appear in the relevant content region without shifting the whole page hierarchy.

Use one `h1` per page. For standard pages, use a common responsive title scale around 32px on mobile and 40px on larger screens; keep it consistent across modules. Use `h2` for major page sections around 24px and `h3` for card or subsection titles around 18–20px. League Spartan remains the interface font at every level. Hero screens such as Season introduction can deliberately exceed the standard title scale.

The page header may wrap into two rows on narrow screens, but its content order stays the same. A long title wraps instead of truncating. A page action moves below the title when needed; it does not squeeze the title or force horizontal scrolling.

## Navigation and tab hierarchy

Use three distinct levels, with one shared component pattern for each level across modules:

| Level | Purpose | Behavior and visual treatment |
| --- | --- | --- |
| Global navigation | Move between Today, Tasks, Habits, Money, and other modules | Existing sidebar/mobile shell; strongest location cue |
| Module navigation | Move between routes within one module | Consistent compact rail within the page header; active destination is persistent and uses `aria-current="page"` |
| Local views | Replace one content panel within the current page | Consistent inset segmented or tab treatment near that panel; selected state is persistent |

Filters and period selectors sit below local navigation and look like controls, not a second module navigation bar. A page should not show two visually equal rows of tabs with unclear priority. Counts are supporting metadata; they must not dominate labels or change tab height.

Route navigation uses links and `aria-current="page"`. In-page tabs use the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): tablist, tabs, associated panels, selected state, and the expected keyboard behavior. A group of filter buttons may instead use buttons with `aria-pressed` or native controls. Choose the interaction model first, then the visual style; do not add `role="tab"` to route links merely to make them look like tabs.

Module navigation and local tabs use a 44px minimum control height. Compact 36px controls are reserved for dense, secondary contexts where the larger surrounding interaction remains clear. Shared inputs and ordinary buttons use 44px minimum. Icon-only controls have a 40–44px target; primary touch controls aim for 44px. These are design defaults above the [WCAG 2.2 minimum target guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). Keep widths content-driven, and allow horizontal scrolling for a long module rail on small screens rather than shrinking labels below readability.

## Section and card sizing

Use the selected Normal, Frosted glass, or Normal glass material through parent and child surfaces as specified in the [material guide](ui-design-and-motion.md#surface-and-depth-system). Frosted glass uses separate flat section panels without outer borders, translucent nested components, and subtle internal dividers. A section's width follows the page grid. A card should fit its content; use minimum heights only for a known visual purpose such as an empty state or comparable summary cards. Equal-height peer cards align their content and actions; nested cards step down in corner radius. Avoid different panel padding for the same component role across pages.

## Adoption rule for agents

When redesigning a page, identify its page rail, page header, module navigation, local views, filters, and content sections before styling. Reuse or create shared primitives for recurring roles. Change existing pages by role, not by copying a neighboring page's one-off class list. Keep route behavior, focus behavior, data loading, and saved view state intact. Review desktop, mobile, long labels, zoom, and all available appearance combinations manually. Record any deliberate layout exception in the page's design notes.
