# Achelife self-hosting

Achelife is installed and operated through the host-side `achelife` command. The manager uses exact versioned container images and does not require Git, PHP, Composer, Node.js, npm, or a source build on the host.

> [!WARNING]
> Achelife has no login boundary. The safe default is `127.0.0.1`. Anyone who can reach another bind address can read and change the instance, including Diary and Money data. Never expose Achelife directly to the public internet.

## Requirements

The tested production path is a Docker-capable Linux host with:

- Docker Engine;
- Docker Compose v2 through `docker compose`;
- a POSIX shell;
- `curl`, `tar`, `dd`, `base64`, and a SHA-256 utility;
- at least 512 MiB of available installation storage.

The installing user must be able to run Docker and write to the selected installation and executable directories.

## Quick install

There is no stable v1 release yet. This one command installs both Achelife and the `achelife` CLI from the current release-candidate channel:

```bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/master/scripts/install.sh | sh -s -- --channel rc
```

If you do not want to pipe a remote script into the shell, [review and download the installer](scripts/install.sh), then run it with `sh /path/to/install.sh --channel rc`.

The installer shows the selected version, location, bind address, and port. At the `[Y/n]` prompt:

- press Enter, `y`, or `yes` to install;
- enter `n` or `no` to cancel without writing the installation;
- use `--yes` for an intentional non-interactive installation.

During installation it:

1. resolves the newest RC from GitHub Releases;
2. downloads the versioned manager archive and checksum;
3. verifies the checksum and archive layout;
4. installs Achelife under `$HOME/.local/share/achelife`;
5. installs the `achelife` CLI under `$HOME/.local/bin`;
6. pulls exact digest-pinned app and web images;
7. starts the stack and waits for readiness.

The final message prints the exact application URL and CLI path. If your shell cannot find `achelife`, reopen the terminal or add the default command directory to `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Open the printed URL, visit `/setup`, and complete the first-run flow.

### When the preferred port is busy

Achelife prefers port `8080`. If it is occupied, the installer searches for an available port and shows a suggestion. Press Enter to accept the suggestion or type a custom port. A custom port is checked before installation; if it is also occupied, the installer explains that and suggests another one.

With `--yes`, the installer automatically selects the suggested available port and prints the change. The generated project identity follows the selected port on a fresh default installation.

## Installation options

Run the downloaded installer with additional manager options:

```bash
sh /tmp/achelife-install.sh \
  --channel rc \
  --dir "$HOME/.local/share/achelife" \
  --bin-dir "$HOME/.local/bin" \
  --port 8080 \
  --bind 127.0.0.1
```

Useful options include:

| Option | Purpose |
| --- | --- |
| `--version VERSION` | Install an exact stable or RC version. |
| `--channel stable\|rc` | Select the release channel; stable is the default. |
| `--dir PATH` | Select the installation directory. |
| `--bin-dir PATH` | Select the manager command directory. |
| `--port PORT` | Prefer a host port; an occupied port triggers another suggestion. |
| `--bind ADDRESS` | Select a local or trusted-private bind address. |
| `--project NAME` | Select an isolated Compose project identity. |
| `--no-start` | Write and verify configuration without starting containers. |
| `--yes` | Confirm non-interactively and accept an available suggested port. |

A non-localhost bind also requires `--acknowledge-network-risk`. Use it only on a trusted private network or private VPN with appropriate firewall rules:

```bash
achelife install \
  --channel rc \
  --bind 192.168.1.20 \
  --acknowledge-network-risk
```

## Everyday commands

Start with these commands:

```bash
achelife status
achelife start
achelife stop
achelife restart
achelife open
achelife logs
achelife doctor
```

`achelife status --json`, `achelife doctor --json`, and `achelife version --json` provide machine-readable output without revealing the application key.

Enable or disable Docker restart behavior at boot:

```bash
achelife enable --now
achelife disable
```

## Updates and rollback

Stable updates remain the default. Merely knowing an RC version never changes an installation to the RC channel. RC testing requires explicit opt-in:

```bash
achelife update --check --channel rc
achelife update --channel rc
achelife update --to 1.0.0-rc.1 --channel rc
```

Before target code starts, the manager locks management operations, checks the host, creates and verifies a full-instance backup, and pulls exact image digests. It then enters maintenance mode, runs migrations, and verifies migration state, health, and application readiness.

If migration or health verification fails, the manager restores the matching snapshot before restarting the previous image. It never starts old code against an unsuccessfully migrated database.

## Full-instance backup

Create and verify a backup:

```bash
achelife backup
```

The archive contains:

- the complete SQLite database;
- the application key;
- protected installation configuration;
- the Compose snapshot;
- persistent application storage;
- a checksummed manifest.

Backups contain private records and decryption material. Copy them outside the Docker host, store them on encrypted storage where appropriate, and periodically test a clean-host restore.

## Clean-host restore

Install the same or a newer trusted manager bundle on the recovery host, copy the backup there, and run:

```bash
achelife restore /off-host/achelife-full-TIMESTAMP.tar.gz \
  --bin-dir "$HOME/.local/bin"
```

Restore validates archive paths, links, duplicate entries, checksums, image registries, configuration, and volume contents before replacing installation state. An existing target requires the documented literal `RESTORE` confirmation.

## Portable account export

The export available inside General Settings is separate from a full-instance backup. Use it to migrate or copy one account snapshot between Achelife instances. It does not contain the host installation and is not continuous synchronization.

Never merge two divergent Achelife histories automatically. Choose the authoritative snapshot before replacement.

## Uninstall

The safe default removes containers and manager files while retaining persistent volumes and recoverable configuration:

```bash
achelife uninstall
```

Permanent removal is separate and requires literal `PURGE` confirmation. Before deleting volumes, the manager creates and verifies a recovery archive outside the installation directory:

```bash
achelife uninstall --purge
```

## Troubleshooting

Start with:

```bash
achelife status
achelife doctor
achelife logs
```

Check that Docker is running, `docker compose version` succeeds, the configured port is available, the host has free space, and the GHCR packages are reachable. Do not share `installation.env`, `.env`, backup archives, account exports, application keys, or unredacted logs in public issues.

The complete command and recovery contracts are documented in [Phase 16 self-hosted operations](docs/v1.0.0/phase-16-self-hosted-installer-and-manager.md). Release maintainers should also follow the [Phase 17 RC gates](docs/v1.0.0/phase-17-release-hardening-and-rc-promotion.md).
