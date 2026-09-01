MANAGER_VERSION="1.0.0-rc.1-dev"
DEFAULT_INSTALL_DIR="${HOME}/.local/share/achelife"
DEFAULT_BIN_DIR="${HOME}/.local/bin"
DEFAULT_IMAGE_REPOSITORY="ghcr.io/insadamt/achelife"
DEFAULT_HEALTH_TIMEOUT="${ACHELIFE_HEALTH_TIMEOUT:-180}"

info()
{
    printf '%s\n' "$1"
}

warn()
{
    printf 'Warning: %s\n' "$1" >&2
}

fail()
{
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

require_option_value()
{
    [ -n "${2:-}" ] || fail "$1 requires a value."
}

require_command()
{
    command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

expand_home_path()
{
    candidate_path="$1"
    case "$candidate_path" in
        "~") printf '%s\n' "$HOME" ;;
        "~/"*) printf '%s/%s\n' "$HOME" "${candidate_path#~/}" ;;
        *) printf '%s\n' "$candidate_path" ;;
    esac
}

validate_absolute_path()
{
    candidate_path="$1"
    path_label="$2"

    case "$candidate_path" in
        /*) ;;
        *) fail "$path_label must be an absolute path." ;;
    esac

    case "$candidate_path" in
        *":"*) fail "$path_label contains unsupported characters." ;;
    esac
    contains_control_characters "$candidate_path" \
        && fail "$path_label contains unsupported control characters."
    return 0
}

contains_control_characters()
{
    LC_ALL=C awk -v value="$1" 'BEGIN { exit(value ~ /[[:cntrl:]]/ ? 0 : 1) }'
}

manager_pointer_file()
{
    pointer_root="${XDG_CONFIG_HOME:-${HOME}/.config}/achelife"
    printf '%s/install-dir\n' "$pointer_root"
}

set_installation_paths()
{
    requested_path="$1"
    pointer_file="$(manager_pointer_file)"

    if [ -n "$requested_path" ]; then
        INSTALL_DIR="$(expand_home_path "$requested_path")"
    elif [ -n "${ACHELIFE_INSTALL_DIR:-}" ]; then
        INSTALL_DIR="$(expand_home_path "$ACHELIFE_INSTALL_DIR")"
    elif [ -r "$pointer_file" ]; then
        INSTALL_DIR="$(sed -n '1p' "$pointer_file")"
    else
        INSTALL_DIR="$DEFAULT_INSTALL_DIR"
    fi

    validate_absolute_path "$INSTALL_DIR" "Installation directory"
    CONFIG_FILE="${INSTALL_DIR}/config/installation.env"
    COMPOSE_FILE="${INSTALL_DIR}/compose.yaml"
    STATE_DIR="${INSTALL_DIR}/state"
    BACKUP_DIR="${INSTALL_DIR}/backups"
    LOCK_DIR="${STATE_DIR}/manager.lock"
}

write_manager_pointer()
{
    pointer_file="$(manager_pointer_file)"
    pointer_directory="$(dirname "$pointer_file")"
    mkdir -p "$pointer_directory"
    umask 077
    printf '%s\n' "$INSTALL_DIR" >"${pointer_file}.tmp.$$"
    mv "${pointer_file}.tmp.$$" "$pointer_file"
}

ensure_installed()
{
    [ -r "$CONFIG_FILE" ] && [ -r "$COMPOSE_FILE" ] \
        || fail "Achelife is not installed at $INSTALL_DIR. Run 'achelife install'."
}

acquire_management_lock()
{
    mkdir -p "$STATE_DIR"

    if mkdir "$LOCK_DIR" 2>/dev/null; then
        printf '%s\n' "$$" >"${LOCK_DIR}/pid"
        trap release_management_lock EXIT HUP INT TERM
        return
    fi

    lock_pid="$(sed -n '1p' "${LOCK_DIR}/pid" 2>/dev/null || true)"
    case "$lock_pid" in
        ''|*[!0-9]*) ;;
        *)
            if kill -0 "$lock_pid" 2>/dev/null; then
                fail "Another Achelife management operation is running (PID $lock_pid)."
            fi
            ;;
    esac

    stale_lock="${LOCK_DIR}.stale.$$"
    if mv "$LOCK_DIR" "$stale_lock" 2>/dev/null && mkdir "$LOCK_DIR" 2>/dev/null; then
        printf '%s\n' "$$" >"${LOCK_DIR}/pid"
        trap release_management_lock EXIT HUP INT TERM
        return
    fi

    fail "Could not acquire the Achelife management lock."
}

release_management_lock()
{
    if [ -d "${LOCK_DIR:-}" ]; then
        lock_pid="$(sed -n '1p' "${LOCK_DIR}/pid" 2>/dev/null || true)"
        [ "$lock_pid" != "$$" ] || rm -rf "$LOCK_DIR"
    fi
}

confirm_literal()
{
    expected_literal="$1"
    prompt_text="$2"

    [ -r /dev/tty ] && [ -w /dev/tty ] \
        || fail "Interactive confirmation is unavailable. Use the documented explicit confirmation option."

    printf '%s\nType %s to continue: ' "$prompt_text" "$expected_literal" >/dev/tty
    read -r confirmation </dev/tty || confirmation=""
    [ "$confirmation" = "$expected_literal" ] || fail "Confirmation did not match $expected_literal."
}

request_yes_no_confirmation()
{
    prompt_text="$1"

    [ -r /dev/tty ] && [ -w /dev/tty ] \
        || fail "Interactive confirmation is unavailable. Use --yes for a non-interactive installation."

    while true; do
        printf '%s [Y/n] ' "$prompt_text" >/dev/tty
        IFS= read -r confirmation </dev/tty \
            || fail "Could not read the installation confirmation."
        normalized_confirmation="$(printf '%s' "$confirmation" | tr '[:upper:]' '[:lower:]')"
        case "$normalized_confirmation" in
            ''|y|yes) return 0 ;;
            n|no) return 1 ;;
            *) printf 'Please answer yes or no. Press Enter for yes.\n' >/dev/tty ;;
        esac
    done
}

utc_timestamp()
{
    date -u '+%Y%m%dT%H%M%SZ'
}

make_temporary_directory()
{
    temporary_root="${TMPDIR:-/tmp}"
    mktemp -d "${temporary_root%/}/achelife.XXXXXX"
}

json_escape()
{
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'
}

boolean_json()
{
    [ "$1" = true ] && printf true || printf false
}

validate_no_arguments()
{
    [ "$#" -eq 0 ] || fail "This command does not accept arguments."
}
