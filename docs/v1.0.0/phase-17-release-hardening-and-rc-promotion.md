# Phase 17 release hardening and RC promotion

## Release boundary

Phase 17 adds the gates needed to prepare and verify an Achelife v1 release candidate. Publication requires a manual workflow dispatch with an exact `MAJOR.MINOR.PATCH-rc.N` version and the literal confirmation `PUBLISH RC`. The workflow rejects stable versions.

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
- the production PHP ZIP extension and a real portable-account download through Caddy;
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

`.github/workflows/release-stable.yml` is the guarded promotion workflow. It must be dispatched from the exact verified RC tag with matching stable and RC versions plus the literal confirmation `PROMOTE VERIFIED RC`. It verifies the RC release target, manager checksum, embedded version, license, and digest manifest; repeats the source and Docker acceptance gates; and re-scans all four platform images. Stable publication creates new stable tags for the already verified multi-architecture manifests and fails unless their digests remain identical. It never rebuilds production images during promotion.

Before authorizing publication:

1. run the source, Docker acceptance, and image gates from the exact candidate source;
2. review all HIGH scan findings and refresh pinned bases when an acceptable upstream fix exists;
3. prepare release notes using the RC checklist below;
4. dispatch the workflow only with an RC version and explicit authorization;
5. retain the generated image digest file and the final acceptance backup outside the Docker host;
6. repeat fresh install, update, rollback, backup, and clean-host restore against the published RC digests;
7. fix failures in a later RC without bypassing any gate;
8. promote the already verified RC source only after every required automated and manual check passes.

Stable promotion uses the matching RC tag as both workflow source and release source. For example, dispatch the stable workflow from `v1.0.0-rc.2`, set `version` to `1.0.0`, set `rc_version` to `1.0.0-rc.2`, and provide the exact confirmation only after the acceptance evidence and off-host backup are retained.

`v1.0.0-rc.1` was published as a GitHub pre-release from commit `62ebae12f97b2b11955c04bd71008942ac269bd8` after the source gate, isolated Docker acceptance, and all four architecture-specific image scans passed. Its manager archive checksum, embedded version, release target, and attached digest manifest were verified independently. No stable tag or promotion was performed.

RC.1 exposed a production-only portability failure: development and CI installed PHP ZIP, but the application container did not. Archive download therefore raised a server error when it reached `ZipArchive`. The next RC declares ZIP as an application requirement, installs it in both production PHP stages, and exercises a real exported download in isolated Docker acceptance before publication.

Anonymous installation remains a separate acceptance gate. The source repository and both GHCR packages must be public before the documented installer path can be tested without credentials. Do not check the published-RC installation or public multi-architecture-image roadmap items until anonymous release downloads, image pulls, fresh install, update, backup, restore, failure recovery, and persistence all pass.

## Open-source publication gate

Achelife is distributed under the MIT License. The repository includes the license text, user and self-hosting documentation, contribution guidance, a security policy, issue forms, pull-request guidance, public pull-request CI, and automated dependency update configuration.

The manager release bundle includes its own copy of `LICENSE`. Application and web images publish `org.opencontainers.image.source`, documentation, revision, version, description, and MIT license annotations. The source annotation also links GHCR packages to the public repository.

Before changing repository visibility, the complete Git history was reviewed for sensitive path names, credential signatures, private keys, tracked databases, archives, and oversized hidden blobs. A redacted Gitleaks v8.30.1 scan of all 23 commits reported zero findings. Local `.env` and production environment files remain ignored and outside Git.

Repository and GHCR visibility are owner-controlled GitHub settings. After changing them manually, enable private vulnerability reporting, confirm anonymous access to the release API and both image manifests, and repeat the published-RC acceptance matrix before preparing `v1.0.0-rc.2` or considering stable promotion.

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
