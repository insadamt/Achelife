# Contributing to Achelife

Thank you for helping improve Achelife. Bug fixes, tests, documentation, accessibility improvements, and focused features are welcome.

## Before starting

Search existing issues and pull requests before opening a duplicate. For a substantial feature or a behavior change, open an issue first so the domain rules, user impact, migrations, and release path can be agreed before implementation.

Security vulnerabilities must not be reported in a public issue. Follow [SECURITY.md](SECURITY.md).

## Development setup

You need PHP 8.3 or newer, Composer 2, Node.js 22, npm, SQLite, and the PHP extensions required by Laravel.

```bash
git clone https://github.com/insadamt/Achelife.git
cd Achelife
composer setup
composer dev
```

The setup command creates a local `.env`, generates a development key, initializes SQLite, installs dependencies, applies migrations, and builds the frontend. Never use production data, a real backup, or a private account export in development or test fixtures.

## Code expectations

- Use intention-revealing names and keep high-level flows readable.
- Extract low-level behavior into focused functions or services.
- Keep new and substantially modified files below 500 lines.
- Add comments only when they explain why a decision exists.
- Preserve historical domain behavior and existing migrations.
- Add or update tests for every behavior change and failure path.
- Keep the application single-user and localhost-first unless an accepted design explicitly changes that boundary.
- Keep stable updates as the default and require explicit RC opt-in.

Do not mix unrelated cleanup into a focused pull request.

## Validation

Run the relevant focused tests while working:

```bash
composer test
npm run types:check
npm run lint
npm run build
sh tests/Installer/run.sh
```

Before requesting review, run the complete release source gate when Docker is available:

```bash
sh scripts/release/verify-source.sh
```

Installation, deployment, migrations, backups, restore, persistent data, security, and networking changes require isolated Docker acceptance and must enter an RC before stable promotion.

## Pull requests

Describe:

- the user problem and intended behavior;
- important implementation decisions;
- migrations or compatibility effects;
- tests run with their exact results;
- remaining limitations or follow-up work.

Do not include secrets, personal records, generated production configuration, database files, backups, or account exports.

## License

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).
