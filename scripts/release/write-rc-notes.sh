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
## Summary

Achelife ${version} is a v1 release candidate. This pre-release is for testing and requires explicit RC opt-in.

## What's New

**Daily planning:** Today, Tasks, recurring routines, Habits, and streaks.

**Seasons:** 30-day Seasons, Objectives, Rank, and end-of-Season reviews.

**Personal records:** Diary, People, Constitution, and Money tracking.

**Setup and recovery:** Resumable setup, portable account exports, full-instance backups, and failed-update recovery.

Free and open-source under the MIT License.

## Install

Requires Linux, Docker Engine, Docker Compose v2, \`curl\`, \`tar\`, and a SHA-256 utility.

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/insadamt/Achelife/v${version}/scripts/install.sh | sh -s -- --channel rc
\`\`\`

Open **http://127.0.0.1:8080** to complete setup.

**Privacy:** Achelife has no login. Anyone who can reach it can access all data. Keep it on localhost, a trusted private network, or a private VPN.

## Update

\`\`\`bash
achelife backup
\`\`\`

Copy the backup outside the Docker host, then run:

\`\`\`bash
achelife update --to ${version} --channel rc
achelife doctor
\`\`\`
EOF

cat >>"$output_file" <<EOF

## Testing Notes

Check the candidate's acceptance evidence before upgrading. The image scan gate blocks fixable CRITICAL findings; HIGH findings require release review.
EOF

cat >>"$output_file" <<EOF

[Documentation](https://github.com/insadamt/Achelife/blob/master/docs/README.md) · [Backup and restore](https://github.com/insadamt/Achelife/blob/master/SELF_HOSTING.md) · [Report a bug](https://github.com/insadamt/Achelife/issues)

<details>
<summary>Release verification</summary>

Both images support \`linux/amd64\` and \`linux/arm64\`.

\`\`\`text
${app_image}
${web_image}
\`\`\`

Downloads below include the manager bundle, its SHA-256 checksum, and \`image-digests.txt\`.

</details>
EOF
