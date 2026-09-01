# Phase 16 self-hosted installer and Achelife Manager

## Operational boundary

Phase 16 turns Achelife into a host-managed self-hosted appliance. A released manager bundle installs exact versioned application and web images, records their immutable registry digests, writes the production Compose definition, creates stable named volumes, and installs a discoverable `achelife` command. The host needs Docker Engine with Docker Compose v2, `curl`, `tar`, and a SHA-256 utility. It does not need Git, PHP, Composer, Node.js, npm, or a source checkout.

Achelife remains passwordless and single-user. It has no public-internet authentication boundary. The safe default is `127.0.0.1`; anyone who can reach another bind address can read and mutate the private Diary, People, Money, and all other data. Trusted-LAN access requires the explicit `--acknowledge-network-risk` flag and must be protected by a trusted private network, firewall, or private VPN. Public port forwarding and direct public-internet exposure are unsupported.

No RC or stable release is published by this change. The guarded workflow accepts only a manually authorized `MAJOR.MINOR.PATCH-rc.N` version and a literal `PUBLISH RC` confirmation. Stable publication remains blocked until an RC completes Phase 17 acceptance.

## Installer

After an RC is explicitly authorized and published, the bootstrap script installs the checksum-verified manager bundle, application stack, and `achelife` CLI in one command. Run the installed manager from any directory:

```bash
achelife install --version 1.0.0-rc.1 --channel rc
```

The stable channel is the default. Until a stable release exists, installation must explicitly select an authorized RC or an exact locally tested version. Supported options are:

- `--dir PATH`: installation directory, defaulting to `~/.local/share/achelife`;
- `--bin-dir PATH`: executable directory, defaulting to `~/.local/bin`;
- `--port PORT`: preferred host port, defaulting to `8080`;
- `--bind ADDRESS`: fixed host bind address, defaulting to `127.0.0.1`;
- `--project NAME`: stable Compose project identity, defaulting to `achelife-PORT`;
- `--version VERSION`: exact stable or RC image version;
- `--channel stable|rc`: release selection policy;
- `--yes`: non-interactive ordinary installation confirmation;
- `--acknowledge-network-risk`: mandatory separate acknowledgement for a non-localhost bind;
- `--no-start`: write and verify installation configuration without starting containers.

Ordinary interactive installation uses a `[Y/n]` prompt where Enter means yes. When the preferred port is occupied, the manager finds an available port and lets the user accept it with Enter or enter another port; occupied custom ports are rejected with a new suggestion. `--yes` accepts the available suggestion non-interactively. The default Compose project identity follows the final selected port on a fresh install.

`--yes` never substitutes for the network-risk acknowledgement. Invalid or relative paths, invalid ports or bind addresses, unavailable Docker, missing Compose v2, insufficient disk space, unavailable exact image tags, missing digests, and failed health checks stop installation with recovery guidance.

Installation is idempotent. Repeating it preserves the application key, Compose identity, volume names, restart policy, and exact installed version unless a corresponding option is supplied. An existing Phase 15 SQLite data volume can be adopted with its original Compose project identity; when `/data/app-key` exists, the installer preserves that key without printing it.

## Installed layout

The default host layout is:

```text
~/.local/bin/achelife                         command symlink
~/.config/achelife/install-dir                active installation pointer
~/.local/share/achelife/
├── config/installation.env                   mode 0600; includes APP_KEY and pinned images
├── compose.yaml                              generated production topology
├── runtime/achelife                          installed manager entrypoint
├── runtime/manager/lib/                      focused manager operations
├── runtime/manager/templates/compose.yaml    trusted Compose template
├── state/                                    lock, update check, and prior-image metadata
└── backups/                                  verified full-instance archives
```

The named Docker volumes default to `<project>_achelife-data` and `<project>_achelife-storage`. The first contains SQLite and the persisted application-key compatibility file. The second contains Laravel application storage. Volume and project names are configuration, not values derived from the current shell directory.

`installation.env` is sensitive. It is created with mode `0600`, never sourced as shell code, and never printed by manager commands. Compose receives the application key through its environment without displaying it. The container mirrors that key into the data volume for clean-host recovery and refuses to start when configured and persisted keys conflict.

## Production topology

The manager runs three services across a private service network and a separate edge network:

- `app`: PHP-FPM, startup migrations, operational verification, SQLite, and application storage;
- `scheduler`: `schedule:work` with migrations disabled, including daily Money Subscription synchronization;
- `web`: Caddy static assets, FastCGI routing, security headers, the fixed host binding on the edge network, and HTTP health checks.

Only Caddy joins the edge network. PHP-FPM and the scheduler remain on the internal network. Every service uses an init process and `no-new-privileges`.

The app health check runs `php artisan achelife:verify`. It proves that all migrations ran, storage is writable, the database is available, and the profile count is compatible with passwordless single-user behavior. Zero profiles is `ready_for_setup`, one is `ready`, and multiple profiles fail safely as `conflict`. The manager also checks `/up`, pending migration state, and single-user readiness before declaring the stack healthy.

## Command reference

| Command | Behavior |
| --- | --- |
| `achelife install` | Install or idempotently reconcile an exact version. |
| `achelife start` | Start app, scheduler, and web; clear maintenance mode; verify health. |
| `achelife stop` | Stop containers without deleting them or their volumes. |
| `achelife restart` | Stop, start, and run the complete verification gate. |
| `achelife status` | Show version, URL, running/health state, container count, database bytes, last backup, auto-start, and cached update state. |
| `achelife update` | Resolve the latest stable release and perform the safe update transaction. |
| `achelife update --check` | Resolve and validate exact remote image availability without pulling or mutating the installation. |
| `achelife update --to VERSION` | Select an exact stable version. Add `--channel rc` for every exact RC target. |
| `achelife update --channel rc` | Explicitly opt into the latest published RC channel. |
| `achelife enable` | Set existing and future containers to `unless-stopped`. |
| `achelife disable` | Set existing and future containers to restart policy `no`. |
| `achelife enable --now` | Enable auto-start and start/verify Achelife now. |
| `achelife disable --now` | Disable auto-start and stop Achelife now. |
| `achelife logs` | Show the last 200 app, scheduler, and web log lines. |
| `achelife logs --follow` | Follow the same service logs. |
| `achelife doctor` | Check Docker, Compose, protected configuration, health, migrations, and single-user readiness. |
| `achelife backup` | Stop writes, create, checksum, validate, and retain a full-instance backup. |
| `achelife restore FILE` | Validate and destructively restore a full-instance backup after literal `RESTORE`; `--bin-dir PATH` rewrites the command location on a clean host. |
| `achelife open` | Open the configured private URL with the platform browser command. |
| `achelife version` | Show manager, installed application, channel, and application digest. |
| `achelife help` | Show the command and option reference. |
| `achelife uninstall` | Remove containers and the manager while preserving volumes and moving configuration to a recoverable path. |

`status`, `doctor`, and `version` accept `--json`. JSON mode contains no application key or other secret. There are intentionally no registration, login, logout, password, or password-reset commands.

## Management locking

Every lifecycle, configuration, backup, restore, update, and uninstall mutation acquires `state/manager.lock` with an owning PID. A live owner causes the second operation to fail immediately. An invalid or dead-PID lock is moved aside and replaced atomically. Read-only status, version, logs, and ordinary help do not take the mutation lock.

This host lock is independent from the Phase 15 per-profile operation lock. The host lock serializes container and volume operations; the profile lock serializes application export, import, and scheduled account mutations.

## Safe update and rollback

Updates default to stable. RC discovery and exact RC targets require `--channel rc`. The high-level sequence is:

1. validate Docker, Compose configuration, writable paths, port ownership, and at least 1 GiB of free space;
2. resolve an exact version and prove both exact image tags exist;
3. pull the exact application and web tags and record both immutable digests;
4. write a persistence probe into the storage volume;
5. preserve the prior running/stopped and enabled/disabled state;
6. enter Laravel maintenance mode when the installation was running;
7. stop the stack and create a verified full-instance backup;
8. retain prior version, image, and digest metadata without deleting the old images;
9. select the new digest-pinned images and start the app so its entrypoint runs forward migrations;
10. leave maintenance mode, start scheduler and web, and verify HTTP health, migrations, persistence, and single-user readiness;
11. restore the prior running/stopped and enabled/disabled state and retain the successful backup.

Failed pulls and backups stop before configuration or migration mutation. If migration, startup, persistence, or health verification fails, the manager stops new code, restores the matched database, application key, configuration, and storage snapshot, and only then starts the prior image if it was previously running. It never starts old code against a database left at an incompatible migrated state. The previous image metadata and verified backup remain until the update succeeds and are not automatically pruned.

The update command rejects version downgrades. Operational rollback is a matched full-instance restore, because switching only the image could run old code against an incompatible migrated database.

## Full-instance backup format

Manager backups use `achelife-full-YYYYMMDDTHHMMSSZ.tar.gz` and contain:

```text
manifest.env
checksums.sha256
config/installation.env
config/compose.yaml
volumes/data.tar
volumes/storage.tar
```

The manifest records format version, creation time, application version, project identity, and prior running/enabled state. SHA-256 covers the manifest, protected configuration, Compose snapshot, and both volume archives. Verification rejects missing, extra, duplicate, unsafe, or checksum-mismatched entries, conflicting image digests, and images outside Achelife's configured registry; volume archives reject unsafe paths and link entries. Restore uses the current trusted manager Compose template rather than executing Compose content from the archive.

Backups contain the application key, complete SQLite database, private Diary and Money data, and persistent application storage. Protect them like a password vault, copy them outside the Docker host, and periodically test a clean-host restore.

`achelife restore FILE` supports an existing installation and a clean host with the manager bundle. It validates before mutation and requires literal `RESTORE` (or `--confirm RESTORE` for deliberate automation). `--bin-dir PATH` selects the executable location on the recovery host instead of retaining a source-host path from the archive. An existing installation receives a second verified safety backup before replacement. Restore pulls the recorded digest-pinned app image, replaces both volumes, restores protected configuration, starts the stack for verification, and returns it to the backup's running/stopped state. A failed replacement restores the safety snapshot.

## Full recovery versus `.achelife.zip` portability

These are separate products:

- a `.achelife.zip` archive is a versioned profile/domain snapshot for migration through `/setup` or Settings. It excludes server secrets, Docker identity, and infrastructure state; it maps IDs and applies the held-Season import policy;
- an `achelife-full-*.tar.gz` archive is an operational image of one complete installation. It includes the database, application key, manager configuration, image digests, and both persistent volumes so the same server state can be recovered.

Do not upload a full-instance archive to the profile portability interface. Do not use a `.achelife.zip` archive as the only infrastructure rollback snapshot before migrations.

## Auto-start and uninstall

`enable` uses Docker restart policy `unless-stopped`; `disable` uses `no`. Docker itself must be configured to start at boot. The manager does not silently elevate privileges or enable the Docker system service.

Default uninstall runs Compose `down`, removes the command pointer, retains the named volumes, and moves the complete installation directory to a timestamped sibling path. That move is recoverable and contains the secret configuration required to reattach the volumes.

`achelife uninstall --purge` is separate and requires literal `PURGE` or `--confirm-purge PURGE`. Before deleting volumes, it creates and re-verifies a full-instance backup, copies that archive outside the installation directory, and verifies the copy. Only then does it remove containers, volumes, manager files, and the active pointer. The command reports the external recovery archive path.

## Verification

The Phase 16 shell suite uses isolated fake Docker and network commands. It covers fresh and repeated install, Enter-as-yes and no cancellation, available-port suggestions, occupied custom-port retries, non-interactive port selection, custom directories/ports/binds/projects, localhost defaults, explicit LAN acknowledgement, missing Docker and Compose, invalid configuration, running/stopped and enabled/disabled states, exact/channel update selection, pull/backup/migration/health failures, rollback, locking, backup verification, clean-host restore, restart persistence, secret redaction, retained-data uninstall, confirmed purge, and JSON status/doctor/version.

Laravel coverage proves fresh-database setup readiness, existing one-profile compatibility, and safe failure for multiple profiles. Phase 17 adds explicit Phase 15 migration, progression-after-restore, isolated Docker recovery, container scan, dependency audit, Compose, workflow, shell syntax, and source hygiene gates. The guarded RC workflow scans each architecture by digest before it creates any public version manifest. See [Phase 17 release hardening](phase-17-release-hardening-and-rc-promotion.md).
