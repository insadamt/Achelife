# Achelife

A private, self-hosted app for Tasks, Habits, Diary, Seasons, and Money. Free and open-source under the [MIT License](LICENSE).

[Release notes](https://github.com/insadamt/Achelife/releases/latest) · [Documentation](docs/README.md)

## Features

**Daily planning:** Manage one-time and recurring Tasks, check in on Habits, and see what needs attention in Today.

**Seasons:** Set Objectives for a 30-day Season, earn Season Points, and review your progress at the end.

**Personal records:** Write in your Diary, track personal Laws, and manage Money Accounts, Transactions, Subscriptions, and Person-linked Debts.

**Backups:** Export an account or use the manager to back up and restore your installation.

## Install

Requires Linux, Docker Engine, Docker Compose v2, `curl`, `tar`, and a SHA-256 utility.

```bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/v1.0.0/scripts/install.sh | sh
```

Open the URL printed by the installer. The default is `http://127.0.0.1:8080`.

**Privacy:** Achelife has no login. Anyone who can reach it can read and change its data. Use localhost, a trusted private network, or a private VPN; never expose it publicly.

## Documentation

[User guide](docs/user-guide.md) · [Install, update & back up](SELF_HOSTING.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)
