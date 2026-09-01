#!/bin/sh
set -eu

[ "$#" -eq 4 ] || {
    printf 'Usage: %s VERSION RC_VERSION IMAGE_DIGESTS OUTPUT\n' "$0" >&2
    exit 1
}

version="$1"
rc_version="$2"
image_digests="$3"
output_file="$4"

printf '%s\n' "$version" | grep -Eq '^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})$'
printf '%s\n' "$rc_version" | grep -Eq "^${version}-rc\.(0|[1-9][0-9]{0,8})$"
[ -f "$image_digests" ]

app_image="$(sed -n 's/^APP_IMAGE=//p' "$image_digests")"
web_image="$(sed -n 's/^WEB_IMAGE=//p' "$image_digests")"
printf '%s\n' "$app_image" | grep -Eq "^ghcr\.io/insadamt/achelife:${version}@sha256:[a-f0-9]{64}$"
printf '%s\n' "$web_image" | grep -Eq "^ghcr\.io/insadamt/achelife-web:${version}@sha256:[a-f0-9]{64}$"

cat >"$output_file" <<EOF
# Achelife ${version}

Achelife ${version} is the first stable v1 release. It promotes the exact application and web image manifests verified as ${rc_version}; the production images were not rebuilt for stable publication.

## Included

- explicit Season rollover, holds, intermissions, and closeouts;
- Money preset categories, Transfer fees, and recurring Subscriptions;
- passwordless single-user setup and resumable onboarding;
- complete account export, validation, replacement restore, and recovery holds;
- the self-hosted installer and Achelife Manager with safe updates, verified backups, rollback, clean-host restore, diagnostics, and uninstall;
- multi-architecture container images with provenance, SBOMs, dependency audits, and vulnerability gates;
- source code and manager tooling under the MIT License.

## Verified images

- Application: \`${app_image}\`
- Web: \`${web_image}\`

The attached \`image-digests.txt\` is the machine-readable source of these references. The stable tags resolve to the same manifest digests accepted under ${rc_version}.

## Install

Docker Engine with Docker Compose v2, \`curl\`, \`tar\`, and a SHA-256 utility are required.

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/v${version}/scripts/install.sh | sh
\`\`\`

The default bind is \`127.0.0.1:8080\`. A trusted-LAN bind requires \`--acknowledge-network-risk\`. Never expose Achelife directly to the public internet.

## Upgrade from a release candidate

Create a verified backup and copy it off the Docker host before updating:

\`\`\`bash
achelife backup
achelife update --to ${version}
achelife status
achelife doctor
\`\`\`

The manager creates another verified full-instance backup before migrations. A failed migration, startup, persistence, or health check restores the matched snapshot before prior code restarts.

## Restore and rollback

Rollback is a matched full-instance restore, not an image-only downgrade:

\`\`\`bash
achelife restore /off-host/achelife-full-TIMESTAMP.tar.gz --bin-dir "\$HOME/.local/bin"
\`\`\`

Backups contain the application key, database, Diary, Money, and persistent storage. Protect them like a password vault and periodically test recovery on a clean host.

## Security boundary and known limitations

- Achelife is passwordless and single-user. Anyone who can reach it can read and change all data.
- Public-internet exposure is unsupported; use localhost, a trusted private network, or a private VPN.
- This release supports \`linux/amd64\` and \`linux/arm64\`.
- Divergent account archives are not merged, and independent servers do not synchronize continuously.
- Subscriptions do not execute bank transactions, and cross-currency Transfers are unsupported.

See \`SELF_HOSTING.md\` and the Phase 16/17 documentation in the repository for complete operational and recovery procedures.
EOF
