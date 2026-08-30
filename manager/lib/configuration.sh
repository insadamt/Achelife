read_configuration_value()
{
    configuration_key="$1"
    configuration_file="${2:-$CONFIG_FILE}"
    [ -r "$configuration_file" ] || return 1

    awk -v key="$configuration_key" '
        index($0, key "=") == 1 {
            sub(/^[^=]*=/, "")
            sub(/\r$/, "")
            print
            exit
        }
    ' "$configuration_file"
}

set_configuration_value()
{
    configuration_key="$1"
    configuration_value="$2"
    configuration_file="${3:-$CONFIG_FILE}"
    temporary_configuration="${configuration_file}.tmp.$$"

    contains_control_characters "$configuration_value" \
        && fail "Configuration value for $configuration_key contains unsupported control characters."

    mkdir -p "$(dirname "$configuration_file")"
    [ -f "$configuration_file" ] || : >"$configuration_file"
    umask 077

    awk -v key="$configuration_key" -v value="$configuration_value" '
        BEGIN { found = 0 }
        index($0, key "=") == 1 {
            if (!found) {
                print key "=" value
                found = 1
            }
            next
        }
        { print }
        END {
            if (!found) print key "=" value
        }
    ' "$configuration_file" >"$temporary_configuration"

    chmod 600 "$temporary_configuration"
    mv "$temporary_configuration" "$configuration_file"
}

validate_version()
{
    printf '%s\n' "$1" | grep -Eq '^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})(-rc\.(0|[1-9][0-9]{0,8}))?$' \
        || fail "Version must match MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-rc.N."
}

validate_channel()
{
    case "$1" in
        stable|rc) ;;
        *) fail "Release channel must be stable or rc." ;;
    esac
}

channel_for_version()
{
    case "$1" in
        *-rc.*) printf 'rc\n' ;;
        *) printf 'stable\n' ;;
    esac
}

validate_version_channel_pair()
{
    version_value="$1"
    channel_value="$2"
    inferred_channel="$(channel_for_version "$version_value")"
    [ "$inferred_channel" = "$channel_value" ] \
        || fail "Version $version_value belongs to the $inferred_channel channel, not $channel_value."
}

resolve_channel_version()
{
    release_channel="$1"
    require_command curl
    releases_url="${ACHELIFE_RELEASES_API_URL:-https://api.github.com/repos/insadamt/Achelife/releases?per_page=100}"
    release_payload="$(curl -fsSL "$releases_url")" \
        || fail "Could not query the $release_channel release channel."

    tag_names="$(printf '%s' "$release_payload" \
        | sed 's/"tag_name"[[:space:]]*:[[:space:]]*"/\n/g' \
        | sed -n '2,$s/".*//p')"

    if [ "$release_channel" = stable ]; then
        resolved_tag="$(printf '%s\n' "$tag_names" | sed -n '/^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$/p' | sed -n '1p')"
    else
        resolved_tag="$(printf '%s\n' "$tag_names" | sed -n '/^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*-rc\.[0-9][0-9]*$/p' | sed -n '1p')"
    fi

    [ -n "$resolved_tag" ] || fail "No published $release_channel release is available."
    printf '%s\n' "${resolved_tag#v}"
}

generate_application_key()
{
    require_command base64
    random_key="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null | base64 | tr -d '\r\n')"
    [ -n "$random_key" ] || fail "Could not generate the application key."
    printf 'base64:%s\n' "$random_key"
}

validate_port()
{
    case "$1" in
        ''|*[!0-9]*) fail "Port must be a number between 1 and 65535." ;;
    esac
    [ "$1" -ge 1 ] && [ "$1" -le 65535 ] \
        || fail "Port must be a number between 1 and 65535."
}

validate_bind_address()
{
    bind_value="$1"
    [ -n "$bind_value" ] || fail "Bind address cannot be empty."
    case "$bind_value" in
        *:*) validate_ipv6_address "$bind_value" || fail "Bind address must be a valid IPv4 or IPv6 address." ;;
        *) validate_ipv4_address "$bind_value" || fail "Bind address must be a valid IPv4 or IPv6 address." ;;
    esac
}

validate_ipv4_address()
{
    printf '%s\n' "$1" | awk -F. '
        NF != 4 { exit 1 }
        {
            for (segment_index = 1; segment_index <= 4; segment_index++) {
                if ($segment_index !~ /^[0-9]+$/ || $segment_index + 0 > 255) exit 1
            }
        }
    '
}

validate_ipv6_address()
{
    printf '%s\n' "$1" | awk '
        /[^0-9a-fA-F:]/ || /:::/ || /^:[^:]/ || /[^:]:$/ { exit 1 }
        {
            address = $0
            if (address ~ /::.*::/) exit 1
            compressed = index(address, "::") > 0
            segment_count = split(address, segments, ":")
            populated_segments = 0
            for (segment_index = 1; segment_index <= segment_count; segment_index++) {
                if (segments[segment_index] == "") continue
                if (segments[segment_index] !~ /^[0-9a-fA-F]+$/ || length(segments[segment_index]) > 4) exit 1
                populated_segments++
            }
            if (compressed && populated_segments < 8) exit 0
            if (! compressed && populated_segments == 8) exit 0
            exit 1
        }
    '
}

validate_project_name()
{
    printf '%s\n' "$1" | grep -Eq '^[a-z0-9][a-z0-9_-]*$' \
        || fail "Compose project identity must contain lowercase letters, digits, dashes, or underscores."
}

application_host()
{
    bind_value="$(read_configuration_value ACHELIFE_BIND_ADDRESS)"
    case "$bind_value" in
        0.0.0.0|::) printf '127.0.0.1\n' ;;
        *:*) printf '[%s]\n' "$bind_value" ;;
        *) printf '%s\n' "$bind_value" ;;
    esac
}

application_url()
{
    printf 'http://%s:%s\n' "$(application_host)" "$(read_configuration_value ACHELIFE_PORT)"
}
