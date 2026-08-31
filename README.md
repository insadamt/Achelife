# Achelife

Achelife is a free and open-source, single-user life management application. It brings 30-day Seasons, Tasks, Habits, a private Diary, personal rules, Objectives, progression, and Money tracking into one self-hosted workspace.

Achelife is licensed under the [MIT License](LICENSE).

> [!IMPORTANT]
> Achelife v1 is currently a release candidate. It is not a stable release. Release-candidate installation and updates always require explicit `rc` channel opt-in.

> [!WARNING]
> Achelife has no login screen or public-internet authentication boundary. Keep the default localhost binding, or use only a trusted private network or private VPN. Anyone who can reach the application can read and change its Diary, Money, and other private data.

## Features

- A focused Today view for current Tasks, Habits, Daily Progress, Season SP, and Rank.
- Thirty-day Seasons with introductions, Objectives, closeouts, intermissions, holds, and long-absence recovery.
- One-time and recurring Tasks with subtasks, completion rewards, rescheduling, and historically safe SP attribution.
- Effective-dated Habits with Boolean and numeric tracking, streaks, skips, and archives.
- An autosaving Diary with moods, languages, People, mentions, search, and writing rewards.
- A personal Constitution with Laws, escalating violations, and Season-safe penalties.
- Local Money accounts, transactions, transfers, fees, categories, presets, history, and recurring Subscriptions.
- Portable account export/restore and full-instance operational backup/restore.
- A host-side manager for health checks, updates, rollback, logs, backups, and disaster recovery.

Read the [user guide](docs/user-guide.md) for the product workflow and terminology.

## Install the current release candidate

The supported deployment is a Docker-capable Linux host with Docker Engine, Docker Compose v2, `curl`, `tar`, and a SHA-256 utility. Git, PHP, Composer, Node.js, and npm are not required on the server.

Download the installer, review it, and explicitly select the RC channel:

```bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/master/scripts/install.sh \
  -o /tmp/achelife-install.sh
sh /tmp/achelife-install.sh --channel rc
```

The installer downloads a checksum-protected manager bundle, resolves exact container digests, binds Achelife to `127.0.0.1:8080`, and waits for health. Open `http://127.0.0.1:8080/setup` to create the single local profile and complete onboarding.

If `$HOME/.local/bin` is not already on your `PATH`, add it before using the manager command:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Useful commands:

```bash
achelife status
achelife open
achelife update --check
achelife backup
achelife doctor
```

See [SELF_HOSTING.md](SELF_HOSTING.md) for installation options, networking, updates, backup/restore, rollback, and uninstall.

## Protect your data

Achelife stores the operational database and uploaded files in persistent Docker volumes. Create full-instance backups regularly and copy them outside the Docker host:

```bash
achelife backup
```

Portable exports created inside Achelife are for moving an account snapshot between instances. They are not a substitute for full-instance disaster-recovery backups. Both formats can contain Diary writing, People notes, Money records, and other sensitive information.

## Develop from source

Development requires PHP 8.3 or newer, Composer 2, Node.js 22, npm, SQLite, and the PHP extensions required by Laravel.

```bash
git clone https://github.com/insadamt/Achelife.git
cd Achelife
composer setup
composer dev
```

Run the focused suites while developing:

```bash
composer test
npm run types:check
npm run lint
npm run build
sh tests/Installer/run.sh
```

The complete release gate additionally requires Docker:

```bash
sh scripts/release/verify-source.sh
```

## Project documentation

- [User guide](docs/user-guide.md)
- [Self-hosting and operations](SELF_HOSTING.md)
- [Documentation index](docs/README.md)
- [v1 pre-release roadmap](docs/v1.0.0/pre-release-roadmap.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

The versioned documents under `docs/` preserve product behavior, decisions, migration boundaries, and release evidence.

## Contributing

Bug reports, documentation improvements, tests, and focused pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before starting a substantial change. Report security issues privately as described in [SECURITY.md](SECURITY.md).
