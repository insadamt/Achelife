# Phase 0 foundation

## Scope

Phase 0 establishes the runtime and development baseline only. It does not implement any Achelife domain module, progression system, feature navigation, or final visual design.

## Stack

- Laravel 13 and PHP 8.3 or newer
- React 19 with strict TypeScript
- Inertia 3
- Tailwind CSS 4
- Vite 8
- SQLite for local development
- PHPUnit, Laravel Pint, ESLint, and the TypeScript compiler

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm install
npm run build
```

Run the application with:

```bash
composer run dev
```

## Quality checks

```bash
composer test
npm run types:check
npm run lint
npm run build
```

The test environment uses an in-memory SQLite database. The local environment uses `database/database.sqlite`, which is intentionally ignored by Git.

## Single-user access

The application retains one internal `users` row as the ownership boundary for every domain record, policy, export, and restore relationship. It does not use that row as a login identity. An empty instance redirects to passwordless setup, a one-user instance resolves that profile automatically on every web request, and ambiguous multi-profile access fails safely.

Achelife therefore has no public-internet authentication boundary. Supported deployment is localhost, a trusted private network, or a private VPN. Anyone who can reach the application can use it.

## v1 onboarding extension

Phase 14 separates creation of the sole internal profile from domain creation. New installations enter resumable first-run onboarding, while upgraded profiles are explicitly backfilled as complete. General Settings can change the display name; there is no email, password, registration, login, logout, or password-recovery surface. See `docs/v1.0.0/phase-14-first-run-onboarding-and-season-closeout.md`.

## v1 portability extension

Phase 15 adds `.achelife.zip` snapshot export and restore without carrying the internal compatibility email, generated password hash, sessions, or server secrets. Existing-instance replacement requires literal `RESTORE`, and a verified safety export is mandatory before mutation. See `docs/v1.0.0/phase-15-account-data-portability.md`.

## v1 self-hosting extension

Phase 16 replaces source-directory Docker commands with the host-side `achelife` manager. Production installs use exact versioned app and web images, immutable recorded digests, named SQLite and storage volumes, localhost-first binding, operational health verification, and a scheduler service. Updates and destructive infrastructure restore run only behind the host management lock and a verified full-instance snapshot. See `docs/v1.0.0/phase-16-self-hosted-installer-and-manager.md`.
