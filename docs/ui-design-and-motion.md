# Achelife UI and motion guide

This is the working design contract for new pages, components, and redesigns. Apply it alongside the [page layout and hierarchy guide](ui-layout-and-hierarchy.md) and the [global UI foundation](v0.1.0/phase-0.5-global-ui-foundation.md). The aim is a calm, modern interface whose content and controls remain clear in every supported appearance. This guide describes decisions for future UI work; it does not claim that every existing screen already meets them.

## Supported appearance

The design has two independent choices:

- **Color theme:** System, Light, or Dark. System resolves to Light or Dark on this device. The redesign will provide an independent editable palette for each resolved theme, with Achelife defaults for both. Custom palette controls are planned, not yet implemented.
- **Surface style:** Normal, Frosted glass, or Normal glass. Normal glass is an agreed design direction, not yet an implemented setting. Surface style follows the account.

Frosted glass and Normal glass use the built-in city garden image unless a custom background is uploaded. Normal uses a plain background unless a custom image is uploaded. A custom image is shown in every style. The current Normal and Frosted glass behaviors and storage rules are described in the [user guide](user-guide.md#settings) and implemented by `AppLayout`, `app.css`, `appearance.css`, and `today.css`.

| Combination | Page backdrop | Content surfaces | Text and controls |
| --- | --- | --- | --- |
| Light + Normal | Neutral gray, or custom image | Solid, light surfaces | Dark semantic text; solid controls |
| Dark + Normal | Deep neutral, or custom image | Solid, dark surfaces | Light semantic text; solid controls |
| Light + Frosted glass | Built-in or custom image without a page-wide tint | Separate cool translucent panels with blur; transparent nested components and no decorative border or depth | Dark semantic text |
| Dark + Frosted glass | Built-in or custom image without a page-wide tint | Separate deep translucent panels with blur; transparent nested components and no decorative border or depth | Light semantic text |
| Light + Normal glass | Built-in or custom image without a page-wide tint | Cool light translucent surfaces with glass edges and nested depth; left navigation is the reference | Dark semantic text |
| Dark + Normal glass | Built-in or custom image without a page-wide tint | Deep translucent surfaces with glass edges and nested depth | Light semantic text |

The wallpaper is decoration, never the color source for text. Do not tint the whole image white or black; strengthen local surfaces where content needs contrast. Theme tokens decide foreground colors in all three styles; text does not switch colors according to the image behind an individual panel. Design and verify the built-in background for readability. A custom image can reduce readability, so explain that risk beside the background control and offer Normal as the most readable style. The custom image is the user's choice; it does not require automatic per-image text adaptation.

## Rules in priority order

1. **Content and actions remain readable and recognizable.** Target [WCAG 2.2 AA text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) of at least 4.5:1 for ordinary text and 3:1 for qualifying large text with the built-in background. Prefer 4.5:1 for headings too when practical. Required control boundaries, state indicators, and meaningful icons need at least [3:1 against adjacent colors](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast). Measure the rendered foreground against the rendered background, after image, transparency, gradients, and overlays are combined. User-uploaded images may make glass styles harder to read; show that limitation clearly in Settings.
2. **Structure and behavior are the same across appearances.** Appearance changes material and color, not information hierarchy, labels, control placement, or access to an action.
3. **Semantic roles drive styling.** Use `bg-app`, `bg-surface`, `bg-elevated`, `text-foreground`, `text-secondary`, `text-muted`, `border-border-subtle`, and the shared components in `resources/js/components/ui`. Add a semantic token when a recurring role cannot be expressed clearly. Do not choose arbitrary light or dark neutrals inside a page.
4. **Use the accent with purpose.** Lime is the default, and a freely chosen user accent is a planned Settings option. Apply it to primary actions, active navigation, selection, and progress; keep Frosted glass borderless. Save the user's exact chosen color, then derive readable foreground, standalone ink, and focus variants for each theme while retaining its hue. Do not assume a tint conveys selection by itself. The earlier [global foundation](v0.1.0/phase-0.5-global-ui-foundation.md) describes the current fixed-lime implementation; this guide records the agreed redesign direction.
5. **Motion explains change.** Animate a state transition, navigation relationship, or acknowledgment when it improves understanding. A static state must still communicate the same information.

## Theme palettes

Light and Dark each have their own palette. Editing one must not silently change the other. System mode uses whichever palette matches the current device theme. Both palettes start from Achelife defaults and may be customized through Settings. Custom palettes follow the account across devices and belong in account exports; the System/Light/Dark preference remains local to each device. Glass and Normal surfaces respond to the active theme, while Frosted glass stays translucent and blurred in both.

The default Light palette takes a **cool porcelain** direction: a soft blue-gray page background, brighter but distinct solid surfaces, cool clear glass, and charcoal text. The Dark palette uses deeper translucent glass with light text. These are visual directions; final token values require design review. Settings offers the Achelife defaults and individual color editing, with no preset palette gallery.

The primary accent starts as lime in both palettes and can be edited independently. Settings must offer an explicit one-time copy of the accent from one palette to the other. Later edits to the source palette do not change the destination palette. Each color and appearance option has its own reset-to-default action. A separate **Reset all appearance** action restores both palettes, the System theme preference, Frosted glass surface style, and the built-in background by removing any custom image. This action concerns Appearance settings only; it does not affect other account data.

Organize editable colors by meaning instead of by page. The planned palette covers:

| Group | Base roles |
| --- | --- |
| Background and depth | Page, main surface, raised surface, inset surface, overlay |
| Content | Primary, secondary, and muted text; link text |
| Actions | Primary accent and secondary action; semantic action treatments use the shared Success, Warning, and Danger families |
| Feedback | One editable Success, Warning, Danger, and Information family for text, icons, buttons, messages, and status indicators |
| Interaction | Focus, selection, input boundary, divider, disabled treatment |
| Glass materials | Surface tint and blur for Frosted glass; tint, edges, and shadow for the planned Normal glass |
| Data | A chart series palette; individual Project, Category, and Tag colors retain their own item-level meaning |

Each role may need a foreground, tint, border, hover, pressed, or disabled variant. Derive those companions from the edited base color and active theme instead of requiring a separate picker for every state. Show live component previews and contrast feedback in Settings. If a user-chosen palette makes essential text or controls hard to read, show a clear warning but allow the choice; the user retains full control and can reset individual roles or all of Appearance. Achelife's default palettes remain the readability target. The remaining editor details and persistence format remain to be decided. The current `app.css` tokens are the starting inventory, not the limit of the finished palette.

Success, Warning, Danger, and Information each use one editable color family per theme. Derive related text, icon, button, border, and tinted-message treatments from that family's base color; do not offer unrelated color pickers for the same meaning.

## Surface and depth system

Use separate section panels with visible wallpaper between them. In Frosted glass, every surface inside a section stays translucent and blurred, including nested cards, controls, menus, and inputs. Put page headings and standalone navigation on their own glass panels so text has a material behind it. Keep subtle divider lines inside panels where they separate content.

| Level | Typical use | Treatment |
| --- | --- | --- |
| Page | App background and wallpaper | Plain color in Normal without an image; unfiltered image where one is present |
| Surface | Main cards and panels | The selected material with its surface fill and panel radius |
| Raised surface | Menus, drawers, dialogs, floating controls | The selected material with a distinct fill but no artificial depth in Frosted glass |
| Inset surface | Inputs, nested data, selected row groups | A quieter translucent fill with blur in Frosted glass |

Frosted glass uses visibly blurred backdrops and translucent fills across parent and nested components. It has no visible panel outline, reflected edge, or depth shadow; internal divider lines remain visible. Light and Dark use different transparent tints. Normal glass takes its visual cue from the current left navigation: subtle transparency that reveals background light and color without clearly showing image details, a shaped edge, and shadow with little or no backdrop blur. Normal uses solid fills. Keep enough visible separation for the shape and state of a control to remain clear.

Light Frosted glass takes a **cool clear glass** direction with a restrained blue-gray tint rather than a flat white wash. Dark Frosted glass uses a deeper transparent tint. Neither uses decorative edges or shadows. The planned Normal glass material can retain a shaped edge and shadow; blur remains the main difference between the two glass styles.

Use **soft, layered corners** in every style. Main panels have the largest radius, nested cards and inset controls step down in radius, and selected controls or primary buttons may use pill shapes. The changing radius should make the parent-child relationship clear instead of giving every level the same outline. Keep the shared `--radius-panel` as the starting point and derive smaller component radii consistently.

Nested Frosted glass is intentional: a card can contain a transparent blurred row, control, or inset panel. Keep the number of levels understandable, so the parent and child remain visually related without panel outlines or depth shadows. Dense reading, forms, charts, menus, destructive confirmations, and long text still need legible local fills within the selected material. Use subtle divider lines, text, spacing, focus indicators, and selected states to define content and interactive boundaries.

Blur softens background detail but does not set a predictable contrast ratio. `backdrop-filter` may be unavailable in older browsers, so Frosted glass needs a usable fill without blur; see [MDN's backdrop-filter reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter). Where supported, honor `prefers-reduced-transparency: reduce` with more opaque surfaces, while retaining the in-app Normal option because [browser support for that preference is incomplete](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-transparency).

## Text, icons, and data

- Use League Spartan throughout the interface, including headings, body text, forms, labels, navigation, and dense data. Establish hierarchy through size, weight, and spacing before color. Reserve `text-muted` for supplementary text that still passes the contrast requirement; placeholders, timestamps, axis labels, and empty-state explanations are real content.
- Keep body copy comfortably readable. Avoid tiny uppercase labels for essential information and avoid all-caps paragraphs. Allow long names, localized strings, user text, and 200% text scaling to wrap without hiding actions. At narrow widths, pages should [reflow at 320 CSS pixels](https://www.w3.org/WAI/WCAG22/Understanding/reflow). Do not clip content when users increase [text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing).
- Icons that carry meaning need an accessible name and a visible shape with sufficient contrast. Pair unfamiliar icons with labels. Decorative icons can be hidden from assistive technology.
- Give charts readable axes and labels on stable surfaces. Distinguish series by labels, symbols, or line patterns in addition to color. Show exact values through text or an accessible detail view. Check colors against the chart's actual fill, not the page token alone.
- Status and validation use text and, where helpful, an icon or shape in addition to color. This follows the [WCAG use-of-color rule](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color). Do not make a completed item, error, or selected tab recognizable only through a green/red/lime tint.

## Controls and states

Use the shared `Button`, `Surface`, form controls, dialog, and drawer before adding a page-specific version. The default button hierarchy is one primary action per immediate decision area, secondary actions for alternatives, ghost actions for low emphasis, and destructive treatment for destructive actions. Keep button labels as verbs that describe the result.

In Frosted glass and Normal glass, the primary action keeps a filled accent color. Secondary actions use a quieter layer of the selected glass material. Buttons inside panels still read as part of that material family; in Frosted glass, their fill and text establish the action hierarchy without borders or depth shadows.

Warning and Danger actions use a restrained tinted treatment in ordinary menus and workflows. Use a strongly filled semantic button for the final confirmation of a consequential warning or destructive action. This keeps the action's meaning visible without making every related control compete with the primary accent.

Every interactive element needs distinct default, hover where relevant, keyboard focus, pressed or selected, disabled, loading, success, and error treatments as applicable. Selected state needs a persistent visible cue such as an indicator, checked mark, shape, or label. Disabled state must remain identifiable; if a reason matters, explain it in adjacent text instead of relying on a faint button. Loading must preserve button size and prevent accidental duplicate submission. Errors belong beside the relevant field and should be announced accessibly.

Make focus visible on every interactive surface, including image-backed and tinted cards. The existing `.focus-ring` is a starting primitive, but inspect its final contrast on each material and adjacent color. Avoid clipping the ring inside `overflow: hidden`. Ensure a focused control is not obscured by a fixed header, bottom navigation, or floating island. Give pointer targets at least [24 by 24 CSS pixels](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum); prefer roughly 44 by 44 for primary touch controls. Keep keyboard order aligned with visual order.

## Motion language

Motion should feel fluid and controlled: routine actions respond quickly, panels change smoothly, and animation makes the result of an action understandable. Use the current `--motion-fast` (160 ms) and `--motion-standard` (220 ms) for routine feedback. Introduce longer motion only for a meaningful, larger transition such as a panel entering, and document the reason with the component. Prefer opacity and transform for movement; animate small distances, avoid continuous background movement and page-wide parallax. Do not animate layout in a way that makes nearby controls jump during input.

Clicking a main destination in the fixed primary navigation uses a 180 ms vertical entrance with 32 px of travel. Moving down the primary navigation brings content upward; moving back brings it downward. Other route changes do not use vertical motion. Route based tabs use a 160 ms horizontal entrance with 24 px of travel. The navigation that changed and everything above it stay in place; only content below that navigation moves. This applies at each level, including module navigation, Task Files / Archived, Task views, Calendar views, Money Organization, Subscriptions, and Settings. The wallpaper, global navigation, Dynamic Island, and progress panel stay fixed. The content region is an Inertia scroll region so scroll position is managed across visits.

Animate the incoming content with transforms only, using the shared navigation animation helper. Do not clone the outgoing page or tab: duplicating large lists and nested glass surfaces adds rendering work during navigation. Short travel keeps new content readable immediately. The browser's animation completion cleans up the effect, and a new navigation cancels the previous animation. Avoid assigning `view-transition-name` or animating opacity on the content region: these can change the backdrop sampled by frosted glass panels. Data updates that do not change the selected view do not trigger the transition. Reduced-motion users switch immediately, including when the preference changes during an animation.

In-page tabs use the same 160 ms horizontal entrance with 24 px of travel. Moving to a later tab brings content in from the right; moving to an earlier tab brings it in from the left. The tab controls and surrounding page stay in place.

| Event | Motion behavior | Reduced motion behavior |
| --- | --- | --- |
| Hover or press | Small, quick response on the control | Instant state change |
| Tab, filter, or selection | Short indicator or content transition without obscuring data | Immediate new state |
| Drawer or dialog | Brief enter/exit that preserves the origin and focus destination | Immediate open/close with correct focus |
| Saved, completed, or error | One brief acknowledgment; text/state remains visible | Text/state change without movement |
| Progress or live timer | Update values in place; no perpetual pulse | Update values in place |

Honor `prefers-reduced-motion: reduce` in CSS **and** JavaScript-driven movement, including smooth scroll. The project already has a global CSS reduction rule and some JavaScript checks; new behavior must follow the same preference. [W3C guidance](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) identifies nonessential interaction motion as something users should be able to disable. Never make animation the only evidence that an action completed. Avoid automatic looping movement; if it is necessary, follow [pause/stop/hide guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).

## Page composition

Use the shared page rail, header, module navigation, local views, and control dimensions in the [page layout and hierarchy guide](ui-layout-and-hierarchy.md). Use balanced density: generous space between page sections and major cards, with tighter rows inside lists, tables, and forms so data remains easy to scan. Give related content a shared panel and enough whitespace to scan. Keep persistent navigation, floating controls, dialogs, and mobile safe areas from covering content. On small screens, stack content in the same logical order and keep the primary action reachable without making it the only route to an action. Empty, loading, error, and populated states should share the same visual hierarchy and surface language.

## Review matrix for every new or redesigned screen

Review the screen in Light and Dark × all available surface styles, using the default background for each. For Normal without a custom image, verify the plain backdrop. Check representative bright, dark, and visually busy custom images to understand limitations and ensure the Settings guidance is honest; arbitrary uploads are not a guaranteed contrast target. For System theme, switch the operating system between Light and Dark while the page is open. Include desktop and narrow/mobile widths, keyboard navigation, zoom/reflow, reduced motion, and a browser without backdrop blur. If the platform offers reduced transparency or increased contrast, inspect those too.

In each case, inspect ordinary and muted text; primary, secondary, ghost, and destructive actions; selected and disabled states; field borders, placeholders, errors, and focus rings; dialogs, drawers, menus, charts, fixed controls, and empty states. Measure contrast at the worst built-in-background patch behind a translucent element. If that combination fails, strengthen the local surface or token and repeat it.

## Implementation boundaries and known follow-up

Current glass tokens in `resources/css/appearance.css` use translucent Light and Dark materials, and `today.css` adds page-specific layers. Their alpha values alone cannot prove contrast for arbitrary uploaded images. The no-blur fallback and reduced-transparency treatment need manual review. Normal glass has a draft recipe but still needs a settings option; the current left sidebar is its visual reference. The user-selectable accent and separate editable Light and Dark palettes also need Settings, theme-aware token derivation, and persistence work; they have not yet been implemented. Address shared token or component problems centrally when a page review reveals them.

Keep appearance data and its existing meanings compatible: `normal` and `glass`, theme preferences, and custom-background behavior are already persisted or exported. Adding Normal glass requires a distinct saved value and compatible import/export handling; do not silently reinterpret either existing value or saved archive data. The account-level palettes must be included in exports. A future palette format must have defaults for older accounts and archives and an explicit versioned import path when the format evolves.

## Source notes

The numerical accessibility targets and interaction requirements come from [WCAG 2.2](https://www.w3.org/TR/WCAG22/). The glass fallback and system preference guidance comes from [MDN's backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter), [reduced transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-transparency), and [contrast preference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-contrast) references. Duration, hierarchy, and material usage are Achelife design decisions, not WCAG requirements.
