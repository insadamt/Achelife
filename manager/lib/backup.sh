command_backup()
{
    validate_no_arguments "$@"
    ensure_installed
    acquire_management_lock
    verify_docker_requirements
    backup_archive="$(create_full_backup_internal false)"
    printf 'Verified full-instance backup: %s\n' "$backup_archive"
}

create_full_backup_internal()
{
    keep_stopped="$1"
    require_command tar
    require_checksum_command
    mkdir -p "$BACKUP_DIR"
    snapshot_running=false
    stack_is_running && snapshot_running=true
    snapshot_enabled="$(installation_is_enabled)"

    if [ "$snapshot_running" = true ]; then
        docker_compose exec -T app php artisan down >/dev/null 2>&1 || true
    fi
    docker_compose stop >/dev/null 2>&1 || true

    staging_directory="$(make_temporary_directory)"
    backup_timestamp="$(utc_timestamp)"
    backup_archive="${BACKUP_DIR}/achelife-full-${backup_timestamp}.tar.gz"
    if [ -e "$backup_archive" ]; then
        backup_archive="${BACKUP_DIR}/achelife-full-${backup_timestamp}-$$.tar.gz"
    fi
    if ! write_full_backup_payload "$staging_directory" "$snapshot_running" "$snapshot_enabled"; then
        rm -rf "$staging_directory"
        restore_stack_after_snapshot "$snapshot_running"
        fail "Could not create the full-instance backup payload."
    fi
    if ! tar -czf "${backup_archive}.tmp" -C "$staging_directory" .; then
        rm -rf "$staging_directory" "${backup_archive}.tmp"
        restore_stack_after_snapshot "$snapshot_running"
        fail "Could not package the full-instance backup."
    fi
    chmod 600 "${backup_archive}.tmp"
    mv "${backup_archive}.tmp" "$backup_archive"
    rm -rf "$staging_directory"

    if ! verify_full_backup_archive "$backup_archive"; then
        restore_stack_after_snapshot "$snapshot_running"
        fail "Backup verification failed; the snapshot was not accepted."
    fi

    if [ "$keep_stopped" != true ]; then
        restore_stack_after_snapshot "$snapshot_running"
    fi
    printf '%s\n' "$backup_archive"
}

write_full_backup_payload()
{
    staging_directory="$1"
    snapshot_running="$2"
    snapshot_enabled="$3"
    mkdir -p "$staging_directory/config" "$staging_directory/volumes"
    cp "$CONFIG_FILE" "$staging_directory/config/installation.env"
    cp "$COMPOSE_FILE" "$staging_directory/config/compose.yaml"
    chmod 600 "$staging_directory/config/installation.env" "$staging_directory/config/compose.yaml"

    snapshot_volume "$(read_configuration_value ACHELIFE_DATA_VOLUME)" \
        "$staging_directory/volumes/data.tar" || return 1
    snapshot_volume "$(read_configuration_value ACHELIFE_STORAGE_VOLUME)" \
        "$staging_directory/volumes/storage.tar" || return 1

    cat >"$staging_directory/manifest.env" <<EOF
ACHELIFE_FULL_BACKUP_FORMAT=1
CREATED_AT=$(utc_timestamp)
ACHELIFE_VERSION=$(read_configuration_value ACHELIFE_VERSION)
COMPOSE_PROJECT_NAME=$(read_configuration_value COMPOSE_PROJECT_NAME)
BACKUP_RUNNING=$snapshot_running
BACKUP_ENABLED=$snapshot_enabled
EOF
    write_payload_checksums "$staging_directory"
}

snapshot_volume()
{
    volume_name="$1"
    destination_file="$2"
    destination_directory="$(dirname "$destination_file")"
    destination_name="$(basename "$destination_file")"
    app_image="$(read_configuration_value ACHELIFE_APP_IMAGE)"

    docker volume inspect "$volume_name" >/dev/null 2>&1 || return 1
    docker run --rm --entrypoint sh \
        --volume "${volume_name}:/source:ro" \
        --volume "${destination_directory}:/backup" \
        "$app_image" -c "tar -cf /backup/${destination_name} -C /source ." >/dev/null
}

write_payload_checksums()
{
    staging_directory="$1"
    (
        cd "$staging_directory"
        : >checksums.sha256
        for payload_file in manifest.env config/installation.env config/compose.yaml volumes/data.tar volumes/storage.tar; do
            checksum_value="$(calculate_checksum "$payload_file")"
            printf '%s  %s\n' "$checksum_value" "$payload_file" >>checksums.sha256
        done
    )
}

require_checksum_command()
{
    command -v sha256sum >/dev/null 2>&1 && return
    command -v shasum >/dev/null 2>&1 && return
    fail "A SHA-256 utility (sha256sum or shasum) is required."
}

calculate_checksum()
{
    checksum_file="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$checksum_file" | awk '{print $1}'
    else
        shasum -a 256 "$checksum_file" | awk '{print $1}'
    fi
}

verify_checksum_manifest()
{
    payload_directory="$1"
    checksum_paths="$(awk '{print $2}' "$payload_directory/checksums.sha256" | sort)"
    expected_paths="$(printf '%s\n' config/compose.yaml config/installation.env manifest.env volumes/data.tar volumes/storage.tar | sort)"
    [ "$checksum_paths" = "$expected_paths" ] || return 1
    checksum_count=0
    while read -r expected_checksum payload_path; do
        [ -n "$expected_checksum" ] && [ -n "$payload_path" ] || return 1
        case "$payload_path" in
            manifest.env|config/installation.env|config/compose.yaml|volumes/data.tar|volumes/storage.tar) ;;
            *) return 1 ;;
        esac
        [ -f "$payload_directory/$payload_path" ] || return 1
        [ "$(calculate_checksum "$payload_directory/$payload_path")" = "$expected_checksum" ] || return 1
        checksum_count=$((checksum_count + 1))
    done <"$payload_directory/checksums.sha256"
    [ "$checksum_count" -eq 5 ]
}

verify_full_backup_archive()
{
    backup_archive="$1"
    [ -f "$backup_archive" ] || return 1
    require_checksum_command
    validate_outer_archive_paths "$backup_archive" || return 1
    verification_directory="$(make_temporary_directory)"
    if ! tar -xzf "$backup_archive" -C "$verification_directory"; then
        rm -rf "$verification_directory"
        return 1
    fi
    verification_result=0
    verify_extracted_backup "$verification_directory" || verification_result=1
    rm -rf "$verification_directory"
    [ "$verification_result" -eq 0 ]
}

validate_outer_archive_paths()
{
    backup_archive="$1"
    tar -tvzf "$backup_archive" | awk '{type = substr($1, 1, 1); if (type != "-" && type != "d") exit 1}' \
        || return 1
    archive_files="$(tar -tzf "$backup_archive" | sed 's#^\./##; /\/$/d; /^$/d' | sort)"
    expected_files="$(printf '%s\n' checksums.sha256 config/compose.yaml config/installation.env manifest.env volumes/data.tar volumes/storage.tar | sort)"
    [ "$archive_files" = "$expected_files" ]
}

verify_extracted_backup()
{
    extracted_directory="$1"
    for required_file in manifest.env checksums.sha256 config/installation.env config/compose.yaml volumes/data.tar volumes/storage.tar; do
        [ -f "$extracted_directory/$required_file" ] || return 1
    done
    [ "$(read_configuration_value ACHELIFE_FULL_BACKUP_FORMAT "$extracted_directory/manifest.env")" = 1 ] || return 1
    validate_backup_configuration "$extracted_directory/config/installation.env" || return 1
    verify_checksum_manifest "$extracted_directory" || return 1
    validate_volume_archive "$extracted_directory/volumes/data.tar" || return 1
    validate_volume_archive "$extracted_directory/volumes/storage.tar" || return 1
}

validate_backup_configuration()
{
    backup_configuration="$1"
    validate_backup_configuration_shape "$backup_configuration" || return 1
    backup_version="$(read_configuration_value ACHELIFE_VERSION "$backup_configuration")"
    backup_project="$(read_configuration_value COMPOSE_PROJECT_NAME "$backup_configuration")"
    backup_port="$(read_configuration_value ACHELIFE_PORT "$backup_configuration")"
    backup_key="$(read_configuration_value ACHELIFE_APP_KEY "$backup_configuration")"
    backup_channel="$(read_configuration_value ACHELIFE_CHANNEL "$backup_configuration")"
    backup_restart_policy="$(read_configuration_value ACHELIFE_RESTART_POLICY "$backup_configuration")"
    backup_data_volume="$(read_configuration_value ACHELIFE_DATA_VOLUME "$backup_configuration")"
    backup_storage_volume="$(read_configuration_value ACHELIFE_STORAGE_VOLUME "$backup_configuration")"
    backup_app_image="$(read_configuration_value ACHELIFE_APP_IMAGE "$backup_configuration")"
    backup_web_image="$(read_configuration_value ACHELIFE_WEB_IMAGE "$backup_configuration")"
    backup_app_digest="$(read_configuration_value ACHELIFE_APP_DIGEST "$backup_configuration")"
    backup_web_digest="$(read_configuration_value ACHELIFE_WEB_DIGEST "$backup_configuration")"
    validate_version "$backup_version"
    validate_project_name "$backup_project"
    validate_port "$backup_port"
    backup_bind_address="$(read_configuration_value ACHELIFE_BIND_ADDRESS "$backup_configuration")"
    validate_bind_address "$backup_bind_address"
    case "$backup_bind_address" in
        *:*) expected_backup_url="http://[$backup_bind_address]:$backup_port" ;;
        *) expected_backup_url="http://$backup_bind_address:$backup_port" ;;
    esac
    [ "$(read_configuration_value ACHELIFE_URL "$backup_configuration")" = "$expected_backup_url" ] || return 1
    validate_channel "$backup_channel"
    validate_version_channel_pair "$backup_version" "$backup_channel"
    case "$backup_restart_policy" in unless-stopped|no) ;; *) return 1 ;; esac
    validate_volume_name "$backup_data_volume" || return 1
    validate_volume_name "$backup_storage_volume" || return 1
    expected_image_repository="${ACHELIFE_IMAGE_REPOSITORY:-$DEFAULT_IMAGE_REPOSITORY}"
    validate_pinned_image_reference "$backup_app_image" "$backup_version" "$expected_image_repository" || return 1
    validate_pinned_image_reference "$backup_web_image" "$backup_version" "${expected_image_repository}-web" || return 1
    printf '%s\n' "$backup_key" | grep -Eq '^base64:[A-Za-z0-9+/=]+$' || return 1
    printf '%s\n' "$backup_app_digest" | grep -Eq '^sha256:[a-f0-9]{64}$' || return 1
    printf '%s\n' "$backup_web_digest" | grep -Eq '^sha256:[a-f0-9]{64}$' || return 1
    [ "${backup_app_image##*@}" = "$backup_app_digest" ] || return 1
    [ "${backup_web_image##*@}" = "$backup_web_digest" ] || return 1
    validate_absolute_path "$(read_configuration_value ACHELIFE_BIN_DIR "$backup_configuration")" "Executable directory"
}

validate_backup_configuration_shape()
{
    backup_configuration="$1"
    LC_ALL=C grep -q '[[:cntrl:]]' "$backup_configuration" && return 1
    awk 'index($0, "=") == 0 { exit 1 }' "$backup_configuration" >/dev/null || return 1
    configuration_keys="$(awk '{ sub(/=.*/, ""); print }' "$backup_configuration" | sort)"
    expected_keys="$(printf '%s\n' \
        ACHELIFE_APP_DIGEST \
        ACHELIFE_APP_IMAGE \
        ACHELIFE_APP_KEY \
        ACHELIFE_BIND_ADDRESS \
        ACHELIFE_BIN_DIR \
        ACHELIFE_CHANNEL \
        ACHELIFE_DATA_VOLUME \
        ACHELIFE_PORT \
        ACHELIFE_RESTART_POLICY \
        ACHELIFE_STORAGE_VOLUME \
        ACHELIFE_URL \
        ACHELIFE_VERSION \
        ACHELIFE_WEB_DIGEST \
        ACHELIFE_WEB_IMAGE \
        COMPOSE_PROJECT_NAME | sort)"
    [ "$configuration_keys" = "$expected_keys" ]
}

validate_volume_name()
{
    printf '%s\n' "$1" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9_.-]*$'
}

validate_pinned_image_reference()
{
    image_reference="$1"
    expected_version="$2"
    expected_repository="$3"
    case "$image_reference" in
        "${expected_repository}:${expected_version}@sha256:"*) ;;
        *) return 1 ;;
    esac
    printf '%s\n' "${image_reference##*@}" | grep -Eq '^sha256:[a-f0-9]{64}$'
}

validate_volume_archive()
{
    volume_archive="$1"
    tar -tvf "$volume_archive" | awk '{type = substr($1, 1, 1); if (type != "-" && type != "d") exit 1}' \
        || return 1
    tar -tf "$volume_archive" | while IFS= read -r volume_path; do
        normalized_path="${volume_path#./}"
        case "$normalized_path" in
            /*|../*|*/../*|*\\*) exit 1 ;;
        esac
    done
    duplicate_paths="$(tar -tf "$volume_archive" | sed 's#^\./##; /^$/d' | sort | uniq -d)"
    [ -z "$duplicate_paths" ]
}

restore_stack_after_snapshot()
{
    was_running="$1"
    [ "$was_running" = true ] || return 0
    start_stack_and_verify >&2 || fail "The backup exists, but Achelife did not return to its prior running state."
}

installation_is_enabled()
{
    [ "$(read_configuration_value ACHELIFE_RESTART_POLICY 2>/dev/null || true)" = unless-stopped ] \
        && printf true || printf false
}

command_restore()
{
    restore_archive="${1:-}"
    [ -n "$restore_archive" ] || fail "Usage: achelife restore FILE [--confirm RESTORE]"
    shift
    restore_confirmation=""
    RESTORE_BIN_DIR=""
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --confirm)
                require_option_value "$1" "${2:-}"
                restore_confirmation="$2"
                shift 2
                ;;
            --bin-dir)
                require_option_value "$1" "${2:-}"
                RESTORE_BIN_DIR="$(expand_home_path "$2")"
                validate_absolute_path "$RESTORE_BIN_DIR" "Executable directory"
                shift 2
                ;;
            *) fail "Unknown restore option: $1" ;;
        esac
    done
    restore_archive="$(expand_home_path "$restore_archive")"
    validate_absolute_path "$restore_archive" "Restore archive"
    [ -f "$restore_archive" ] || fail "Restore archive does not exist: $restore_archive"

    acquire_management_lock
    verify_docker_requirements
    require_checksum_command
    [ "$restore_confirmation" = RESTORE ] \
        || confirm_literal RESTORE "Full-instance restore replaces the database, configuration, and persistent storage."

    extracted_restore="$(make_temporary_directory)"
    extract_and_verify_backup "$restore_archive" "$extracted_restore" \
        || fail "The full-instance backup failed validation."

    safety_archive=""
    if [ -r "$CONFIG_FILE" ]; then
        safety_archive="$(create_full_backup_internal true)"
    fi

    if apply_extracted_backup "$extracted_restore"; then
        rm -rf "$extracted_restore"
        [ -z "$safety_archive" ] || printf 'Safety backup retained: %s\n' "$safety_archive"
        info "Full-instance restore completed and verified."
        return
    fi

    warn "Restore verification failed. Attempting recovery from the safety backup."
    rm -rf "$extracted_restore"
    if [ -n "$safety_archive" ]; then
        recovery_directory="$(make_temporary_directory)"
        extract_and_verify_backup "$safety_archive" "$recovery_directory" \
            && apply_extracted_backup "$recovery_directory" \
            || fail "Automatic recovery failed. Keep both backup files and run 'achelife doctor'."
        rm -rf "$recovery_directory"
    fi
    fail "The requested restore failed; the previous full-instance state was recovered."
}

extract_and_verify_backup()
{
    backup_archive="$1"
    extraction_directory="$2"
    validate_outer_archive_paths "$backup_archive" || return 1
    tar -xzf "$backup_archive" -C "$extraction_directory" || return 1
    verify_extracted_backup "$extraction_directory"
}

apply_extracted_backup()
{
    extracted_directory="$1"
    backup_configuration="$extracted_directory/config/installation.env"
    backup_was_running="$(read_configuration_value BACKUP_RUNNING "$extracted_directory/manifest.env")"
    app_image="$(read_configuration_value ACHELIFE_APP_IMAGE "$backup_configuration")"
    data_volume="$(read_configuration_value ACHELIFE_DATA_VOLUME "$backup_configuration")"
    storage_volume="$(read_configuration_value ACHELIFE_STORAGE_VOLUME "$backup_configuration")"
    current_bin_directory="$(read_configuration_value ACHELIFE_BIN_DIR 2>/dev/null || true)"

    if [ -r "$CONFIG_FILE" ]; then
        docker_compose stop >/dev/null 2>&1 || true
    fi
    docker pull "$app_image" >/dev/null 2>&1 || return 1
    restore_volume "$data_volume" "$extracted_directory/volumes/data.tar" "$app_image" || return 1
    restore_volume "$storage_volume" "$extracted_directory/volumes/storage.tar" "$app_image" || return 1

    mkdir -p "$INSTALL_DIR/config" "$STATE_DIR" "$BACKUP_DIR"
    cp "$backup_configuration" "$CONFIG_FILE"
    cp "${MANAGER_ROOT}/manager/templates/compose.yaml" "$COMPOSE_FILE"
    chmod 600 "$CONFIG_FILE" "$COMPOSE_FILE"
    RESOLVED_BIN_DIR="${RESTORE_BIN_DIR:-$current_bin_directory}"
    RESOLVED_BIN_DIR="${RESOLVED_BIN_DIR:-$DEFAULT_BIN_DIR}"
    set_configuration_value ACHELIFE_BIN_DIR "$RESOLVED_BIN_DIR"
    install_manager_command
    write_manager_pointer

    start_stack_and_verify || return 1
    if [ "$backup_was_running" != true ]; then
        docker_compose stop >/dev/null || return 1
    fi
}

restore_volume()
{
    volume_name="$1"
    volume_archive="$2"
    app_image="$3"
    archive_directory="$(dirname "$volume_archive")"
    archive_name="$(basename "$volume_archive")"
    docker volume create "$volume_name" >/dev/null || return 1
    docker run --rm --entrypoint sh \
        --volume "${volume_name}:/target" \
        --volume "${archive_directory}:/backup:ro" \
        "$app_image" -c "find /target -mindepth 1 -delete && tar -xf /backup/${archive_name} -C /target" >/dev/null
}
