#!/bin/sh
set -eu

[ "$#" -eq 3 ] || {
    printf 'Usage: %s VERSION IMAGE_DIGESTS OUTPUT\n' "$0" >&2
    exit 1
}

version="$1"
image_digests="$2"
output_file="$3"

printf '%s\n' "$version" | grep -Eq '^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})-rc\.(0|[1-9][0-9]{0,8})$'
[ -f "$image_digests" ]

app_image="$(sed -n 's/^APP_IMAGE=//p' "$image_digests")"
web_image="$(sed -n 's/^WEB_IMAGE=//p' "$image_digests")"
printf '%s\n' "$app_image" | grep -Eq "^ghcr\.io/insadamt/achelife:${version}@sha256:[a-f0-9]{64}$"
printf '%s\n' "$web_image" | grep -Eq "^ghcr\.io/insadamt/achelife-web:${version}@sha256:[a-f0-9]{64}$"

cat >"$output_file" <<EOF
# Achelife ${version}

Achelife ${version} is a v1 release candidate. It is a pre-release, not a stable release. Stable updates remain the default and never select this candidate unless the RC channel is explicitly requested.

## Included

- clearing a completed Flexible Habit extra now reverses its exact reward before removing the occurrence, preventing orphaned Season SP and invalid account archives;
- every generated account archive now passes the complete import-grade integrity validator before download or safety retention, with a clear Settings error when source data is inconsistent;
- Task undo and Habit archive/delete now reverse exact rewards correctly when Constitution penalties have made the signed Season SP total negative;
- regression coverage for each repaired SP and archive-integrity path.

This maintenance candidate contains no database migrations, Statistics features, theme changes, or redesign work.

## Verified images

- Application: \`${app_image}\`
- Web: \`${web_image}\`

The attached \`image-digests.txt\` is the machine-readable source of these references.

## Install this RC

Docker Engine with Docker Compose v2, \`curl\`, \`tar\`, and a SHA-256 utility are required.

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/v${version}/scripts/install.sh | sh -s -- --channel rc
\`\`\`

The default bind is \`127.0.0.1:8080\`. A trusted-LAN bind requires \`--acknowledge-network-risk\`. Never expose Achelife directly to the public internet.

## Upgrade from Achelife 1.0.0

Create and copy a verified backup off the Docker host before updating:

\`\`\`bash
achelife backup
achelife update --to ${version} --channel rc
achelife status
achelife doctor
\`\`\`

The manager creates another verified full-instance backup before migrations. A failed migration, startup, persistence, or health check restores the matched snapshot before prior code restarts.

## Restore and rollback

Rollback is a matched full-instance restore, not an image-only downgrade:

\`\`\`bash
achelife restore /off-host/achelife-full-TIMESTAMP.tar.gz --bin-dir "\$HOME/.local/bin"
\`\`\`

Backups contain the application key, database, Diary, Money, and persistent storage. Protect them like a password vault and test recovery on a clean host.

## Known limitations and security boundary

- Achelife is passwordless and single-user. Anyone who can reach it can read and change all data.
- Public-internet exposure is unsupported; use localhost, a trusted private network, or a private VPN.
- This RC supports \`linux/amd64\` and \`linux/arm64\`.
- The application image must pass with no HIGH or CRITICAL findings. The web image uses the pinned Caddy 2.11.4 source with patched Go security dependencies because the official image has no fixed build; publication re-scans exact digests, keeps HIGH findings visible in workflow logs, and blocks fixable CRITICAL findings.
- Divergent account archives are not merged, and independent servers do not synchronize continuously.
- Subscriptions do not execute bank transactions, and cross-currency Transfers are unsupported.

See \`SELF_HOSTING.md\` and the Phase 16/17 documentation in the repository for the complete operational and release procedures.
EOF
