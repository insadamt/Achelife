[Documentation](docs/README.md)

# Self-hosting

## Requirements

Linux, Docker Engine, Docker Compose v2, a POSIX shell, `curl`, `tar`, `dd`, `base64`, a SHA-256 utility, and at least 512 MiB of available installation storage. Your user must be able to run Docker.

**Privacy:** Achelife is passwordless. Anyone who can reach it can read and change all data. Use localhost, a trusted private network, or a private VPN. Do not expose it publicly.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/v1.0.0/scripts/install.sh | sh
```

Confirm the prompt and open the printed URL. The default is `http://127.0.0.1:8080`; an occupied port prompts an alternative. You can [review the installer](scripts/install.sh) before running it.

Use `--dir`, `--bin-dir`, and `--port` to customize paths and port. A trusted-network bind requires both `--bind ADDRESS` and `--acknowledge-network-risk`. Use `--yes` for a non-interactive install or `--no-start` to prepare configuration only.

If `achelife` is not found, reopen your terminal or add its default location:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Commands

**App:** `achelife open`, `achelife status`, `achelife start`, `achelife stop`, `achelife restart`.

**Diagnostics:** `achelife doctor`, `achelife logs`. `status`, `doctor`, and `version` also support `--json`.

**Boot behavior:** `achelife enable --now` or `achelife disable`. Restart recreates containers while keeping the database and files in persistent volumes.

## Update

Check for an update and create a backup:

```bash
achelife update --check
achelife backup
```

Copy the verified backup outside the Docker host, then update:

```bash
achelife update
achelife doctor
```

Use `--to 1.0.0` for an exact version. Stable is the default; release candidates require `--channel rc`.

The manager verifies a backup before migrations. If migration or health checks fail, it restores the matching snapshot before restarting the previous images.

## Backup

```bash
achelife backup
```

The verified archive includes the database, application key, configuration, Compose snapshot, and persistent storage. Copy it outside the Docker host and protect it like a password vault.

An in-app `.achelife.zip` export contains account data, not the server installation. Use [account exports](docs/user-guide.md#portable-account-exports) to move an account and full-instance backups for disaster recovery.

## Restore

On the recovery host, use the same or a newer trusted manager bundle and your verified backup:

```bash
achelife restore /path/to/achelife-full-TIMESTAMP.tar.gz --bin-dir "$HOME/.local/bin"
```

Restore validates the archive before replacing data. An existing target requires literal `RESTORE` confirmation. Periodically test restoration on a separate host.

## Uninstall

`achelife uninstall` removes containers and manager files while retaining data. `achelife uninstall --purge` permanently removes data after creating a recovery archive outside the installation directory and requiring literal `PURGE` confirmation.

## Troubleshooting

Start with `achelife status`, `achelife doctor`, and `achelife logs`. Check Docker, `docker compose version`, the configured port, free disk space, and GitHub/GHCR connectivity.

Include versions, host platform, and redacted diagnostics in [bug reports](https://github.com/insadamt/Achelife/issues). Never post `.env`, `installation.env`, keys, archives, or private records. Report vulnerabilities through the [security policy](SECURITY.md).

[Manager reference](docs/v1.0.0/phase-16-self-hosted-installer-and-manager.md) · [Release procedure](docs/v1.0.0/phase-17-release-hardening-and-rc-promotion.md)
