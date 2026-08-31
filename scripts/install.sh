#!/bin/sh
set -eu

VERSION=""
CHANNEL=stable
CHANNEL_EXPLICIT=false

fail()
{
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

scan_bootstrap_options()
{
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --version)
                [ -n "${2:-}" ] || fail "--version requires a value."
                VERSION="$2"
                shift 2
                ;;
            --channel)
                [ -n "${2:-}" ] || fail "--channel requires a value."
                CHANNEL="$2"
                CHANNEL_EXPLICIT=true
                shift 2
                ;;
            *) shift ;;
        esac
    done
}

resolve_release_version()
{
    releases_url="${ACHELIFE_RELEASES_API_URL:-https://api.github.com/repos/insadamt/Achelife/releases?per_page=100}"
    release_payload="$(curl -fsSL "$releases_url")" || fail "Could not query Achelife releases."
    tag_names="$(printf '%s' "$release_payload" \
        | sed 's/"tag_name"[[:space:]]*:[[:space:]]*"/\n/g' \
        | sed -n '2,$s/".*//p')"
    if [ "$CHANNEL" = stable ]; then
        release_tag="$(printf '%s\n' "$tag_names" | sed -n '/^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$/p' | sed -n '1p')"
    elif [ "$CHANNEL" = rc ]; then
        release_tag="$(printf '%s\n' "$tag_names" | sed -n '/^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*-rc\.[0-9][0-9]*$/p' | sed -n '1p')"
    else
        fail "Release channel must be stable or rc."
    fi
    [ -n "$release_tag" ] || fail "No published $CHANNEL release is available."
    VERSION="${release_tag#v}"
}

verify_download_checksum()
{
    archive_path="$1"
    checksum_path="$2"
    archive_name="$(basename "$archive_path")"
    checksum_line_count="$(wc -l <"$checksum_path" | tr -d '[:space:]')"
    [ "$checksum_line_count" = 1 ] || fail "Manager bundle checksum file is malformed."
    expected_checksum="$(awk -v name="$archive_name" '
        $2 == name && $1 ~ /^[a-fA-F0-9]{64}$/ { print tolower($1) }
    ' "$checksum_path")"
    [ -n "$expected_checksum" ] || fail "Manager bundle checksum file is malformed."

    if command -v sha256sum >/dev/null 2>&1; then
        actual_checksum="$(sha256sum "$archive_path" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
        actual_checksum="$(shasum -a 256 "$archive_path" | awk '{print $1}')"
    else
        fail "A SHA-256 utility is required to verify the manager bundle."
    fi
    [ "$expected_checksum" = "$actual_checksum" ]
}

validate_manager_archive()
{
    archive_path="$1"
    archive_version="$2"
    tar -tvzf "$archive_path" | awk '{
        type = substr($1, 1, 1)
        if (type != "-" && type != "d") exit 1
    }' || return 1

    archive_files="$(tar -tzf "$archive_path" | sed '/\/$/d' | sort)"
    expected_files="$(printf '%s\n' \
        achelife-manager/LICENSE \
        achelife-manager/achelife \
        achelife-manager/manager/lib/backup.sh \
        achelife-manager/manager/lib/common.sh \
        achelife-manager/manager/lib/configuration.sh \
        achelife-manager/manager/lib/diagnostics.sh \
        achelife-manager/manager/lib/docker.sh \
        achelife-manager/manager/lib/installation.sh \
        achelife-manager/manager/lib/lifecycle.sh \
        achelife-manager/manager/lib/uninstall.sh \
        achelife-manager/manager/lib/update.sh \
        achelife-manager/manager/templates/compose.yaml | sort)"
    if [ "$archive_files" != "$expected_files" ]; then
        [ "$archive_version" = 1.0.0-rc.1 ] || return 1
        legacy_expected_files="$(printf '%s\n' "$expected_files" | grep -Fvx achelife-manager/LICENSE)"
        [ "$archive_files" = "$legacy_expected_files" ] || return 1
    fi

    duplicate_paths="$(tar -tzf "$archive_path" | sed '/\/$/d' | sort | uniq -d)"
    [ -z "$duplicate_paths" ]
}

main()
{
    command -v curl >/dev/null 2>&1 || fail "curl is required."
    command -v tar >/dev/null 2>&1 || fail "tar is required."
    scan_bootstrap_options "$@"
    if [ -n "$VERSION" ] && [ "$CHANNEL_EXPLICIT" = false ]; then
        case "$VERSION" in
            *-rc.*) CHANNEL=rc ;;
        esac
    fi
    [ -n "$VERSION" ] || resolve_release_version
    printf '%s\n' "$VERSION" | grep -Eq '^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})(-rc\.(0|[1-9][0-9]{0,8}))?$' \
        || fail "Invalid exact release version."

    temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/achelife-installer.XXXXXX")"
    trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM
    release_base="${ACHELIFE_RELEASE_DOWNLOAD_BASE:-https://github.com/insadamt/Achelife/releases/download}/v${VERSION}"
    archive_name="achelife-manager-${VERSION}.tar.gz"
    curl -fsSL "${release_base}/${archive_name}" -o "${temporary_directory}/${archive_name}"
    curl -fsSL "${release_base}/${archive_name}.sha256" -o "${temporary_directory}/${archive_name}.sha256"
    verify_download_checksum "${temporary_directory}/${archive_name}" "${temporary_directory}/${archive_name}.sha256" \
        || fail "Manager bundle checksum verification failed."
    validate_manager_archive "${temporary_directory}/${archive_name}" "$VERSION" \
        || fail "Manager bundle contains an unsafe or unexpected archive layout."
    tar -xzf "${temporary_directory}/${archive_name}" -C "$temporary_directory"
    exec "${temporary_directory}/achelife-manager/achelife" install "$@" --version "$VERSION" --channel "$CHANNEL"
}

main "$@"
