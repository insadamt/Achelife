# Phase 0.5 global UI foundation

## Scope

Phase 0.5 establishes Achelife's global visual language, reusable UI primitives, authenticated application shell, responsive navigation, and authentication presentation. It does not implement any life-management module or progression logic.

## Visual system

- League Spartan is bundled through `@fontsource-variable/league-spartan` and used as the unified interface typeface.
- Semantic color tokens live in `resources/css/app.css` for the application background, surfaces, borders, text hierarchy, accent, and feedback states.
- Lime is the application-wide primary accent. The legacy module accent tokens resolve to the same lime value so navigation, controls, progress, focus, and active surfaces remain harmonized across every destination.
- Surfaces use restrained borders, rounded geometry, controlled elevation, and accent glow only for meaningful active states.
- Interaction transitions use a 160–220ms motion range and collapse when reduced motion is requested.
- Controls that combine icons and text use a shared optical baseline adjustment so navigation, actions, and compact metadata remain visually aligned.

## Component primitives

The primitives in `resources/js/components/ui` include:

- buttons with primary, secondary, ghost, and destructive treatments;
- default, elevated, selected, accented, and interactive surfaces;
- metric, linear progress, circular progress, and status patterns;
- text, number, date, select, and checkbox form controls with accessible labels and error states;
- a focus-managed dialog with Escape and overlay dismissal;
- a drawer built from the same dialog behavior.

## Application shell

At medium and larger widths, authenticated pages use a fixed compact sidebar with all planned destinations. Today links to the temporary showcase; unavailable module destinations are visibly disabled and labeled `Soon`.

On smaller widths, the shell uses a bottom bar for Today, Tasks, and Habits plus a More action. More opens a focus-managed drawer with every destination and account controls. This is intentionally separate from the desktop sidebar layout.

Authenticated pages also expose a narrow pull notch attached to the right viewport edge. It opens a focus-managed, screen-attached progress panel shared by the application shell rather than a page-specific standard drawer.

## Authentication

Login and registration retain the Phase 0 endpoints, validation, throttling, and form behavior. Their presentation now uses the global dark foundation, typography, surface, button, input, spacing, and focus systems. No additional authentication capability was added.

## Temporary showcase

The authenticated home page is a design-system preview, not the real Today page. Its values and controls are explicitly neutral component demonstrations and have no persistence or domain behavior.

## Verification

Run the automated checks with:

```bash
./vendor/bin/pint --test
php artisan test
npm run types:check
npm run lint
npm run build
```

Manually inspect login, registration, the authenticated shell, navigation, showcase controls, dialog, and drawer at desktop, laptop, tablet, and mobile widths.
