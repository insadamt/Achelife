# Phase 17 release hardening and RC promotion

## Release boundary

Phase 17 adds the gates needed to prepare an Achelife v1 release candidate. It does not publish an RC or a stable release. Publication requires a manual workflow dispatch with an exact `MAJOR.MINOR.PATCH-rc.N` version and the literal confirmation `PUBLISH RC`. The workflow rejects stable versions.

A stable release must be promoted from source already proven as an RC. It must never be built or published as an independent first release.

## Source release gate

Run the complete source gate from a dependency-installed checkout:

```bash
sh scripts/release/verify-source.sh
```

It validates:

- Composer metadata and the locked PHP dependency audit;
- the locked npm dependency audit at HIGH severity;
- Pint and the complete PHPUnit suite;
- the installer and manager POSIX shell suite;
- TypeScript, ESLint, and the production frontend build;
- shell syntax for manager, installer, release, and acceptance scripts;
- development and generated production Compose configurations;
- every GitHub Actions workflow with a digest-pinned Actionlint image;
- the 500-line first-party file limit and `git diff --check`.

The production Dockerfile pins Node, Composer, PHP, and Caddy base images by multi-architecture digest. The production context excludes development tooling, tests, documentation, local agent state, and release files. Release workflow actions and scanner images are pinned to immutable commits or digests.

## Image gate

The RC workflow builds `linux/amd64` and `linux/arm64` application and web images independently. Each platform image is pushed by digest without a public version tag, scanned at that exact digest, and recorded as a short-lived workflow artifact. Only after all four builds and scans pass does the workflow assemble the public multi-architecture RC manifests.

Each BuildKit result includes maximum provenance and an SBOM. The pinned Trivy gate reports fixable HIGH and CRITICAL vulnerabilities and fails on any fixable CRITICAL vulnerability. HIGH findings remain visible for release review and base-image refresh decisions.

Run the same scan against a locally built image with:

```bash
sh scripts/release/scan-image.sh IMAGE_REFERENCE
```

## Container and network hardening

The production topology uses three services with `init`, `no-new-privileges`, and exact digest-pinned images. The application and scheduler have only the internal service network. Caddy bridges that private network to a separate edge network which owns the fixed host port. The default binding remains `127.0.0.1`; a trusted-LAN bind requires a separate risk acknowledgement.

Caddy removes its server identity and sends a restrictive Content Security Policy, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`. Achelife remains passwordless and must not be exposed directly to the public internet.

## Migration and recovery evidence

Laravel release tests cover a fresh external SQLite migration, the complete migration chain from the older Phase 10 schema, and compatibility from the latest supported Phase 15 schema with onboarding and Subscription data. Each upgrade case copies a pre-upgrade database backup, applies the candidate migrations, proves the backup is unchanged, and verifies representative single-user Season, Task, Money, and Subscription state.

The restored-progression test validates a complete portable graph, exact SP reconciliation, rank, closeout breakdown, and restore intermission state. The existing portability suite continues to cover archive integrity, semantic validation, clean and replacement imports, rollback, catch-up, and idempotency.

The manager shell tests prove that a verified full-instance backup completes before the target image starts. Pull or backup failure cannot start target code. A failed migration or health check restores the matched snapshot before prior code restarts. RC targets require `--channel rc`; stable remains the default even when an exact target is supplied.

## Isolated Docker acceptance

Run:

```bash
sh tests/Release/docker_acceptance.sh
```

The script creates a uniquely named localhost registry, images, projects, volumes, homes, and installation paths, then removes them through its exit trap. It verifies:

- a fresh RC installation, `/setup`, security headers, JSON diagnostics, localhost publication, the private/edge network split, and `no-new-privileges`;
- refusal of a trusted-LAN install without the separate acknowledgement and the required warning when acknowledged;
- installation of a simulated Phase 15 image followed by an explicit RC update;
- a verified pre-migration backup, complete migrations, preserved single-user Season/Task/Money data, and application-key retention;
- scheduler-driven automatic Subscription payment, access-driven repeat synchronization, and exact-once results;
- scheduler startup, restart persistence, and no pending migrations;
- a deliberately broken target image, automatic snapshot restoration, prior-image restart, and preserved data;
- copying a full-instance backup off host, destroying the source stack and volumes, and restoring into a different clean-host home and executable path.

The local registry is deliberately HTTP-only and is enabled solely for this isolated harness. Production manifest checks remain TLS-only.

## Local browser acceptance

`tests/Release/browser_acceptance.mjs` drives a disposable Chrome DevTools session against an empty migrated database. It completes passwordless setup, the full fresh onboarding path, and Season entry before checking desktop and mobile layouts for Today, Seasons, Money, Subscriptions, Settings, and mobile navigation. Each screen fails on browser runtime errors, duplicate IDs, unnamed interactive controls, images without alternative text, or horizontal overflow.

Start Achelife with a dedicated empty SQLite database and Chrome with a dedicated profile and remote-debugging port, then run:

```bash
node tests/Release/browser_acceptance.mjs http://127.0.0.1:18086 http://127.0.0.1:9226
```

The harness is a repeatable accessibility smoke check, not a replacement for the complete manual acceptance matrix. During Phase 17 it identified duplicate Today task and Habit heading IDs caused by simultaneous responsive render trees; each instance now receives a layout-specific heading ID.

## RC publication and promotion

`.github/workflows/release-rc.yml` is the only publication workflow. It orders authorization, source verification, Docker acceptance, per-platform build and scan, manifest assembly, checksum-protected manager bundle creation, and GitHub pre-release creation. A failed scan cannot leave a version tag pointing at an unverified image.

Before authorizing publication:

1. run the source, Docker acceptance, and image gates from the exact candidate source;
2. review all HIGH scan findings and refresh pinned bases when an acceptable upstream fix exists;
3. prepare release notes using the RC checklist below;
4. dispatch the workflow only with an RC version and explicit authorization;
5. retain the generated image digest file and the final acceptance backup outside the Docker host;
6. repeat fresh install, update, rollback, backup, and clean-host restore against the published RC digests;
7. fix failures in a later RC without bypassing any gate;
8. promote the already verified RC source only after every required automated and manual check passes.

No registry publication, GitHub release, stable tag, or promotion was performed during Phase 17 implementation.

## RC release-notes checklist

Release notes must include:

- exact app and web multi-architecture digests;
- installation and explicit RC opt-in commands;
- the supported Phase 15-to-v1 upgrade path;
- the mandatory verified backup and its off-host storage guidance;
- clean-host restore and failed-update recovery commands;
- passwordless single-user and networking limitations;
- reviewed container findings and other known limitations;
- the statement that the release is a pre-release and is not stable.
