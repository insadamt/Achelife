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

## Authentication

The foundation supports registration, login, logout, session regeneration, login throttling, and authenticated route protection. Password reset, email verification, profile management, and UI customization are deferred until they are required.
