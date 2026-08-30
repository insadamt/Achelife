command_install()
{
    INSTALL_PORT=""
    INSTALL_BIND_ADDRESS=""
    INSTALL_PROJECT=""
    INSTALL_VERSION=""
    INSTALL_CHANNEL=""
    INSTALL_BIN_DIR=""
    INSTALL_ASSUME_YES=false
    INSTALL_NETWORK_ACKNOWLEDGED=false
    INSTALL_START=true

    parse_install_arguments "$@"
    acquire_management_lock
    verify_install_requirements
    resolve_install_configuration
    confirm_install_security_boundary
    verify_install_port
    require_available_disk_space 524288
    pull_exact_images "$RESOLVED_VERSION"
    create_installation_layout
    preserve_or_create_application_key
    write_installation_configuration
    install_manager_command
    write_manager_pointer

    if [ "$INSTALL_START" = true ]; then
        start_stack_and_verify || {
            print_health_recovery_instructions
            fail "Installation did not pass its health checks."
        }
    fi

    print_install_completion
}

parse_install_arguments()
{
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --dir)
                require_option_value "$1" "${2:-}"
                set_installation_paths "$(expand_home_path "$2")"
                shift 2
                ;;
            --bin-dir)
                require_option_value "$1" "${2:-}"
                INSTALL_BIN_DIR="$(expand_home_path "$2")"
                shift 2
                ;;
            --port)
                require_option_value "$1" "${2:-}"
                INSTALL_PORT="$2"
                shift 2
                ;;
            --bind)
                require_option_value "$1" "${2:-}"
                INSTALL_BIND_ADDRESS="$2"
                shift 2
                ;;
            --project)
                require_option_value "$1" "${2:-}"
                INSTALL_PROJECT="$2"
                shift 2
                ;;
            --version)
                require_option_value "$1" "${2:-}"
                INSTALL_VERSION="$2"
                shift 2
                ;;
            --channel)
                require_option_value "$1" "${2:-}"
                INSTALL_CHANNEL="$2"
                shift 2
                ;;
            --yes) INSTALL_ASSUME_YES=true; shift ;;
            --acknowledge-network-risk) INSTALL_NETWORK_ACKNOWLEDGED=true; shift ;;
            --no-start) INSTALL_START=false; shift ;;
            *) fail "Unknown install option: $1" ;;
        esac
    done
}

verify_install_requirements()
{
    verify_docker_requirements
    require_command curl
    require_command dd
    require_command base64
    validate_absolute_path "${INSTALL_BIN_DIR:-$DEFAULT_BIN_DIR}" "Executable directory"

    if [ -e "$INSTALL_DIR" ] && [ ! -d "$INSTALL_DIR" ]; then
        fail "Installation path exists and is not a directory: $INSTALL_DIR"
    fi
    if [ -d "$INSTALL_DIR" ] && [ ! -w "$INSTALL_DIR" ]; then
        fail "Installation directory is not writable: $INSTALL_DIR"
    fi
}

resolve_install_configuration()
{
    existing_install=false
    [ -r "$CONFIG_FILE" ] && existing_install=true

    RESOLVED_PORT="${INSTALL_PORT:-$(read_configuration_value ACHELIFE_PORT 2>/dev/null || true)}"
    RESOLVED_PORT="${RESOLVED_PORT:-8080}"
    RESOLVED_BIND_ADDRESS="${INSTALL_BIND_ADDRESS:-$(read_configuration_value ACHELIFE_BIND_ADDRESS 2>/dev/null || true)}"
    RESOLVED_BIND_ADDRESS="${RESOLVED_BIND_ADDRESS:-127.0.0.1}"
    RESOLVED_PROJECT="${INSTALL_PROJECT:-$(read_configuration_value COMPOSE_PROJECT_NAME 2>/dev/null || true)}"
    RESOLVED_PROJECT="${RESOLVED_PROJECT:-achelife-${RESOLVED_PORT}}"
    RESOLVED_CHANNEL="${INSTALL_CHANNEL:-$(read_configuration_value ACHELIFE_CHANNEL 2>/dev/null || true)}"
    RESOLVED_CHANNEL="${RESOLVED_CHANNEL:-stable}"
    RESOLVED_BIN_DIR="${INSTALL_BIN_DIR:-$(read_configuration_value ACHELIFE_BIN_DIR 2>/dev/null || true)}"
    RESOLVED_BIN_DIR="${RESOLVED_BIN_DIR:-$DEFAULT_BIN_DIR}"

    if [ -n "$INSTALL_VERSION" ]; then
        RESOLVED_VERSION="$INSTALL_VERSION"
        [ -n "$INSTALL_CHANNEL" ] || RESOLVED_CHANNEL="$(channel_for_version "$RESOLVED_VERSION")"
    elif [ "$existing_install" = true ]; then
        RESOLVED_VERSION="$(read_configuration_value ACHELIFE_VERSION)"
    else
        RESOLVED_VERSION="$(resolve_channel_version "$RESOLVED_CHANNEL")"
    fi

    validate_port "$RESOLVED_PORT"
    validate_bind_address "$RESOLVED_BIND_ADDRESS"
    validate_project_name "$RESOLVED_PROJECT"
    validate_channel "$RESOLVED_CHANNEL"
    validate_version "$RESOLVED_VERSION"
    validate_version_channel_pair "$RESOLVED_VERSION" "$RESOLVED_CHANNEL"
    validate_absolute_path "$RESOLVED_BIN_DIR" "Executable directory"
}

confirm_install_security_boundary()
{
    cat <<EOF

Achelife has no login boundary. Anyone who can reach the HTTP service can read
and change the private instance, including Diary and financial data.

Bind address: $RESOLVED_BIND_ADDRESS
Install path: $INSTALL_DIR
EOF

    if [ "$RESOLVED_BIND_ADDRESS" != 127.0.0.1 ] && [ "$RESOLVED_BIND_ADDRESS" != ::1 ]; then
        [ "$INSTALL_NETWORK_ACKNOWLEDGED" = true ] \
            || fail "Trusted-LAN/private-VPN binding requires --acknowledge-network-risk."
        warn "This bind address is safe only on a trusted private network or private VPN. Never expose it directly to the public internet."
    fi

    [ "$INSTALL_ASSUME_YES" = true ] && return
    confirm_literal INSTALL "Install exact Achelife version $RESOLVED_VERSION?"
}

verify_install_port()
{
    if port_is_in_use "$RESOLVED_PORT" && ! installation_owns_port "$RESOLVED_PORT"; then
        fail "Port $RESOLVED_PORT is already in use. Choose another port with --port."
    fi
}

require_available_disk_space()
{
    required_kilobytes="$1"
    disk_probe="$INSTALL_DIR"
    [ -d "$disk_probe" ] || disk_probe="$(dirname "$disk_probe")"
    while [ ! -d "$disk_probe" ] && [ "$disk_probe" != / ]; do
        disk_probe="$(dirname "$disk_probe")"
    done
    available_kilobytes="$(df -Pk "$disk_probe" | awk 'NR == 2 {print $4}')"
    case "$available_kilobytes" in
        ''|*[!0-9]*) fail "Could not determine available disk space." ;;
    esac
    [ "$available_kilobytes" -ge "$required_kilobytes" ] \
        || fail "Insufficient disk space. At least ${required_kilobytes} KiB must be available."
}

create_installation_layout()
{
    mkdir -p "$INSTALL_DIR/config" "$STATE_DIR" "$BACKUP_DIR" "$INSTALL_DIR/runtime"
    umask 077
    cp "${MANAGER_ROOT}/manager/templates/compose.yaml" "$COMPOSE_FILE"
    chmod 600 "$COMPOSE_FILE"
}

preserve_or_create_application_key()
{
    RESOLVED_APP_KEY="$(read_configuration_value ACHELIFE_APP_KEY 2>/dev/null || true)"
    DATA_VOLUME_NAME="$(read_configuration_value ACHELIFE_DATA_VOLUME 2>/dev/null || true)"
    DATA_VOLUME_NAME="${DATA_VOLUME_NAME:-${RESOLVED_PROJECT}_achelife-data}"
    STORAGE_VOLUME_NAME="$(read_configuration_value ACHELIFE_STORAGE_VOLUME 2>/dev/null || true)"
    STORAGE_VOLUME_NAME="${STORAGE_VOLUME_NAME:-${RESOLVED_PROJECT}_achelife-storage}"

    if [ -z "$RESOLVED_APP_KEY" ] && docker volume inspect "$DATA_VOLUME_NAME" >/dev/null 2>&1; then
        RESOLVED_APP_KEY="$(docker run --rm --entrypoint sh \
            --volume "${DATA_VOLUME_NAME}:/data:ro" \
            "$APP_IMAGE_REFERENCE" -c 'test ! -s /data/app-key || cat /data/app-key' 2>/dev/null || true)"
    fi

    [ -n "$RESOLVED_APP_KEY" ] || RESOLVED_APP_KEY="$(generate_application_key)"
}

write_installation_configuration()
{
    restart_policy="$(read_configuration_value ACHELIFE_RESTART_POLICY 2>/dev/null || true)"
    restart_policy="${restart_policy:-unless-stopped}"
    case "$RESOLVED_BIND_ADDRESS" in
        *:*) install_url="http://[$RESOLVED_BIND_ADDRESS]:$RESOLVED_PORT" ;;
        *) install_url="http://$RESOLVED_BIND_ADDRESS:$RESOLVED_PORT" ;;
    esac

    set_configuration_value COMPOSE_PROJECT_NAME "$RESOLVED_PROJECT"
    set_configuration_value ACHELIFE_VERSION "$RESOLVED_VERSION"
    set_configuration_value ACHELIFE_CHANNEL "$RESOLVED_CHANNEL"
    set_configuration_value ACHELIFE_PORT "$RESOLVED_PORT"
    set_configuration_value ACHELIFE_BIND_ADDRESS "$RESOLVED_BIND_ADDRESS"
    set_configuration_value ACHELIFE_URL "$install_url"
    set_configuration_value ACHELIFE_APP_KEY "$RESOLVED_APP_KEY"
    set_configuration_value ACHELIFE_RESTART_POLICY "$restart_policy"
    set_configuration_value ACHELIFE_DATA_VOLUME "$DATA_VOLUME_NAME"
    set_configuration_value ACHELIFE_STORAGE_VOLUME "$STORAGE_VOLUME_NAME"
    set_configuration_value ACHELIFE_APP_IMAGE "$APP_IMAGE_REFERENCE"
    set_configuration_value ACHELIFE_APP_DIGEST "$APP_IMAGE_DIGEST"
    set_configuration_value ACHELIFE_WEB_IMAGE "$WEB_IMAGE_REFERENCE"
    set_configuration_value ACHELIFE_WEB_DIGEST "$WEB_IMAGE_DIGEST"
    set_configuration_value ACHELIFE_BIN_DIR "$RESOLVED_BIN_DIR"
}

install_manager_command()
{
    runtime_directory="${INSTALL_DIR}/runtime"
    manager_destination="${runtime_directory}/manager"
    current_root="$(CDPATH= cd -- "$MANAGER_ROOT" && pwd)"

    if [ "$current_root" != "$runtime_directory" ]; then
        rm -rf "${manager_destination}.new"
        mkdir -p "${manager_destination}.new"
        cp -R "${MANAGER_ROOT}/manager/." "${manager_destination}.new/"
        cp "${MANAGER_ROOT}/achelife" "${runtime_directory}/achelife.new"
        chmod 755 "${runtime_directory}/achelife.new"
        rm -rf "$manager_destination"
        mv "${manager_destination}.new" "$manager_destination"
        mv "${runtime_directory}/achelife.new" "${runtime_directory}/achelife"
    fi

    mkdir -p "$RESOLVED_BIN_DIR"
    command_path="${RESOLVED_BIN_DIR}/achelife"
    expected_target="${runtime_directory}/achelife"
    if [ -e "$command_path" ] && [ ! -L "$command_path" ]; then
        fail "Cannot install command over existing file: $command_path"
    fi
    ln -sfn "$expected_target" "$command_path"
}

print_install_completion()
{
    printf '\nAchelife %s is installed.\n' "$RESOLVED_VERSION"
    printf 'URL: %s\n' "$(application_url)"
    printf 'Command: %s/achelife\n' "$RESOLVED_BIN_DIR"
    printf 'Configuration: %s\n' "$CONFIG_FILE"
    printf 'Data volumes: %s, %s\n' "$DATA_VOLUME_NAME" "$STORAGE_VOLUME_NAME"
    [ "$INSTALL_START" = false ] || printf 'Complete passwordless setup at /setup if this is a fresh database.\n'
}
