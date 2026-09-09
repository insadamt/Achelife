#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/achelife-release-notes.XXXXXX")"
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

digest='sha256:0000000000000000000000000000000000000000000000000000000000000000'
cat >"$temporary_directory/image-digests.txt" <<EOF
APP_IMAGE=ghcr.io/insadamt/achelife:1.0.1-rc.1@${digest}
WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.1-rc.1@${digest}
EOF

sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.1-rc.1 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/release-notes.md"

grep -Fq 'Achelife 1.0.1-rc.1 is a v1 release candidate.' "$temporary_directory/release-notes.md"
grep -Fq 'achelife update --to 1.0.1-rc.1 --channel rc' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife:1.0.1-rc.1@sha256:' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife-web:1.0.1-rc.1@sha256:' "$temporary_directory/release-notes.md"
grep -Fq 'contains no database migrations, Statistics features, theme changes, or redesign work.' "$temporary_directory/release-notes.md"
grep -Fq "scripts/install.sh | sh -s -- --channel rc" "$temporary_directory/release-notes.md"

if sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.0 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/stable-notes.md" >/dev/null 2>&1; then
    printf 'Stable release notes must be rejected by the RC generator.\n' >&2
    exit 1
fi

cat >"$temporary_directory/stable-image-digests.txt" <<EOF
APP_IMAGE=ghcr.io/insadamt/achelife:1.0.1@${digest}
WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.1@${digest}
EOF

sh "$repository_root/scripts/release/write-stable-notes.sh" \
    1.0.1 \
    1.0.1-rc.1 \
    "$temporary_directory/stable-image-digests.txt" \
    "$temporary_directory/stable-release-notes.md"

grep -Fq 'Achelife v1.0.1 improves account archive safety and Season SP integrity' "$temporary_directory/stable-release-notes.md"
grep -Fq '## Added' "$temporary_directory/stable-release-notes.md"
grep -Fq '## Changed' "$temporary_directory/stable-release-notes.md"
grep -Fq '## Fixed' "$temporary_directory/stable-release-notes.md"
grep -Fq 'Added full import-grade integrity validation' "$temporary_directory/stable-release-notes.md"
grep -Fq 'Changed Task and Habit SP reversals' "$temporary_directory/stable-release-notes.md"
grep -Fq 'Fixed clearing a completed Flexible Habit extra' "$temporary_directory/stable-release-notes.md"
grep -Fq 'Updated `js-yaml` to 4.3.2' "$temporary_directory/stable-release-notes.md"

if sh "$repository_root/scripts/release/write-stable-notes.sh" \
    1.0.1-rc.1 \
    1.0.1-rc.1 \
    "$temporary_directory/stable-image-digests.txt" \
    "$temporary_directory/invalid-stable-notes.md" >/dev/null 2>&1; then
    printf 'RC versions must be rejected by the stable generator.\n' >&2
    exit 1
fi

printf 'RC and stable release notes tests passed.\n'
