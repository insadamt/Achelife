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
Achelife v${version} improves account archive safety and Season SP integrity, making reward reversals more reliable and strengthening release security.

## Added

- Added full import-grade integrity validation before generated account archives can be downloaded or retained as safety exports.
- Added a clear Settings error when inconsistent source data prevents a safe account archive from being created.

## Changed

- Changed Task and Habit SP reversals to preserve the exact signed reward that was originally recorded, including negative totals caused by Constitution penalties.
- Updated \`js-yaml\` to 4.3.2 for the release security audit.

## Fixed

- Fixed clearing a completed Flexible Habit extra leaving orphaned Season SP and invalidating account archive integrity.
- Fixed Task undo and Habit archive/delete applying incorrect SP reversals when the signed Season SP total is negative.
- Fixed generated account archives not receiving complete import-grade integrity validation before export or safety retention.
EOF
