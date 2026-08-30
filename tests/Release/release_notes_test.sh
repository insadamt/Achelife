#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/achelife-release-notes.XXXXXX")"
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

digest='sha256:0000000000000000000000000000000000000000000000000000000000000000'
cat >"$temporary_directory/image-digests.txt" <<EOF
APP_IMAGE=ghcr.io/insadamt/achelife:1.0.0-rc.1@${digest}
WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.0-rc.1@${digest}
EOF

sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.0-rc.1 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/release-notes.md"

grep -Fq 'Achelife 1.0.0-rc.1 is the first v1 release candidate.' "$temporary_directory/release-notes.md"
grep -Fq 'achelife update --to 1.0.0-rc.1 --channel rc' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife:1.0.0-rc.1@sha256:' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife-web:1.0.0-rc.1@sha256:' "$temporary_directory/release-notes.md"

if sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.0 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/stable-notes.md" >/dev/null 2>&1; then
    printf 'Stable release notes must be rejected by the RC generator.\n' >&2
    exit 1
fi

printf 'RC release notes tests passed.\n'
