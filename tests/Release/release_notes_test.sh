#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/achelife-release-notes.XXXXXX")"
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

digest='sha256:0000000000000000000000000000000000000000000000000000000000000000'
cat >"$temporary_directory/image-digests.txt" <<EOF
APP_IMAGE=ghcr.io/insadamt/achelife:1.0.0-rc.2@${digest}
WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.0-rc.2@${digest}
EOF

sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.0-rc.2 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/release-notes.md"

grep -Fq 'Achelife 1.0.0-rc.2 is a v1 release candidate.' "$temporary_directory/release-notes.md"
grep -Fq 'achelife update --to 1.0.0-rc.2 --channel rc' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife:1.0.0-rc.2@sha256:' "$temporary_directory/release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife-web:1.0.0-rc.2@sha256:' "$temporary_directory/release-notes.md"
grep -Fq 'under the MIT License' "$temporary_directory/release-notes.md"
grep -Fq "scripts/install.sh | sh -s -- --channel rc" "$temporary_directory/release-notes.md"

if sh "$repository_root/scripts/release/write-rc-notes.sh" \
    1.0.0 \
    "$temporary_directory/image-digests.txt" \
    "$temporary_directory/stable-notes.md" >/dev/null 2>&1; then
    printf 'Stable release notes must be rejected by the RC generator.\n' >&2
    exit 1
fi

cat >"$temporary_directory/stable-image-digests.txt" <<EOF
APP_IMAGE=ghcr.io/insadamt/achelife:1.0.0@${digest}
WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.0@${digest}
EOF

sh "$repository_root/scripts/release/write-stable-notes.sh" \
    1.0.0 \
    1.0.0-rc.2 \
    "$temporary_directory/stable-image-digests.txt" \
    "$temporary_directory/stable-release-notes.md"

grep -Fq 'Achelife 1.0.0 is the first stable v1 release.' "$temporary_directory/stable-release-notes.md"
grep -Fq 'verified as 1.0.0-rc.2' "$temporary_directory/stable-release-notes.md"
grep -Fq 'production images were not rebuilt' "$temporary_directory/stable-release-notes.md"
grep -Fq 'achelife update --to 1.0.0' "$temporary_directory/stable-release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife:1.0.0@sha256:' "$temporary_directory/stable-release-notes.md"
grep -Fq 'ghcr.io/insadamt/achelife-web:1.0.0@sha256:' "$temporary_directory/stable-release-notes.md"
grep -Fq 'scripts/install.sh | sh' "$temporary_directory/stable-release-notes.md"

if sh "$repository_root/scripts/release/write-stable-notes.sh" \
    1.0.0-rc.2 \
    1.0.0-rc.2 \
    "$temporary_directory/stable-image-digests.txt" \
    "$temporary_directory/invalid-stable-notes.md" >/dev/null 2>&1; then
    printf 'RC versions must be rejected by the stable generator.\n' >&2
    exit 1
fi

printf 'RC and stable release notes tests passed.\n'
