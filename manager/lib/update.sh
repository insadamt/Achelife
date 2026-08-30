command_update()
{
    ensure_installed
    UPDATE_CHECK_ONLY=false
    UPDATE_TARGET=""
    UPDATE_CHANNEL=stable
    parse_update_arguments "$@"
    acquire_management_lock
    verify_update_preflight
    resolve_update_target

    current_version="$(read_configuration_value ACHELIFE_VERSION)"
    if [ "$UPDATE_TARGET" = "$current_version" ]; then
        record_update_check current "$UPDATE_TARGET"
        info "Achelife $current_version is already current on the $UPDATE_CHANNEL channel."
        return
    fi
    version_is_newer "$UPDATE_TARGET" "$current_version" \
        || fail "Refusing downgrade from $current_version to $UPDATE_TARGET. Use a verified full-instance restore for rollback."

    verify_remote_exact_images "$UPDATE_TARGET"
    if [ "$UPDATE_CHECK_ONLY" = true ]; then
        record_update_check available "$UPDATE_TARGET"
        printf 'Update available: %s -> %s (%s)\n' "$current_version" "$UPDATE_TARGET" "$UPDATE_CHANNEL"
        return
    fi

    perform_safe_update "$UPDATE_TARGET" "$UPDATE_CHANNEL"
}

version_is_newer()
(
    candidate_version="$1"
    current_version="$2"
    candidate_key="$(version_order_key "$candidate_version")"
    current_key="$(version_order_key "$current_version")"
    [ "$candidate_key" \> "$current_key" ]
)

version_order_key()
(
    version_value="$1"
    version_base="${version_value%%-*}"
    old_ifs="$IFS"
    IFS=.
    set -- $version_base
    IFS="$old_ifs"
    major="$1"
    minor="$2"
    patch="$3"
    case "$version_value" in
        *-rc.*)
            release_rank=0
            release_sequence="${version_value##*-rc.}"
            ;;
        *)
            release_rank=1
            release_sequence=0
            ;;
    esac
    printf '%010d%010d%010d%01d%010d\n' \
        "$major" "$minor" "$patch" "$release_rank" "$release_sequence"
)

parse_update_arguments()
{
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --check) UPDATE_CHECK_ONLY=true; shift ;;
            --to)
                require_option_value "$1" "${2:-}"
                UPDATE_TARGET="$2"
                shift 2
                ;;
            --channel)
                require_option_value "$1" "${2:-}"
                UPDATE_CHANNEL="$2"
                shift 2
                ;;
            *) fail "Unknown update option: $1" ;;
        esac
    done
    validate_channel "$UPDATE_CHANNEL"
}

verify_update_preflight()
{
    verify_docker_requirements
    require_command curl
    require_available_disk_space 1048576
    [ -w "$INSTALL_DIR" ] || fail "Installation directory is not writable."
    mkdir -p "$BACKUP_DIR"
    [ -w "$BACKUP_DIR" ] || fail "Backup directory is not writable."
    configured_port="$(read_configuration_value ACHELIFE_PORT)"
    if port_is_in_use "$configured_port" && ! installation_owns_port "$configured_port"; then
        fail "Configured port $configured_port is occupied by another process."
    fi
    docker_compose config --quiet >/dev/null \
        || fail "Docker Compose rejected the installed configuration."
}

resolve_update_target()
{
    if [ -n "$UPDATE_TARGET" ]; then
        validate_version "$UPDATE_TARGET"
        validate_version_channel_pair "$UPDATE_TARGET" "$UPDATE_CHANNEL"
    else
        UPDATE_TARGET="$(resolve_channel_version "$UPDATE_CHANNEL")"
    fi
}

verify_remote_exact_images()
{
    exact_version="$1"
    image_repository="${ACHELIFE_IMAGE_REPOSITORY:-$DEFAULT_IMAGE_REPOSITORY}"
    verify_remote_image_manifest "${image_repository}:${exact_version}" \
        || fail "Exact application image ${image_repository}:${exact_version} is unavailable."
    verify_remote_image_manifest "${image_repository}-web:${exact_version}" \
        || fail "Exact web image ${image_repository}-web:${exact_version} is unavailable."
}

verify_remote_image_manifest()
{
    image_reference="$1"
    if [ "${ACHELIFE_ALLOW_INSECURE_REGISTRY:-false}" = true ]; then
        docker manifest inspect --insecure "$image_reference" >/dev/null 2>&1
    else
        docker manifest inspect "$image_reference" >/dev/null 2>&1
    fi
}

perform_safe_update()
{
    target_version="$1"
    target_channel="$2"
    prior_running=false
    stack_is_running && prior_running=true
    prior_enabled="$(installation_is_enabled)"

    pull_exact_images "$target_version"
    create_persistence_probe || fail "Could not create the pre-update persistence probe."
    if [ "$prior_running" = true ]; then
        docker_compose exec -T app php artisan down >/dev/null 2>&1 \
            || fail "Could not enter maintenance mode."
    fi

    update_backup="$(create_full_backup_internal true)"
    verify_full_backup_archive "$update_backup" \
        || fail "The pre-update backup did not pass verification."
    retain_prior_release_metadata
    apply_target_image_configuration "$target_version" "$target_channel"

    if start_stack_and_verify \
        && verify_persistence_probe \
        && verify_migration_state \
        && verify_single_user_readiness; then
        clear_persistence_probe
        [ "$prior_running" = true ] || docker_compose stop >/dev/null
        restore_enabled_configuration "$prior_enabled"
        record_update_check current "$target_version"
        printf 'Achelife updated safely to %s.\nVerified backup retained: %s\n' "$target_version" "$update_backup"
        return
    fi

    warn "Update verification failed. Restoring the verified pre-update snapshot before restarting prior code."
    rollback_directory="$(make_temporary_directory)"
    if extract_and_verify_backup "$update_backup" "$rollback_directory" \
        && apply_extracted_backup "$rollback_directory"; then
        rm -rf "$rollback_directory"
        fail "Update failed; Achelife was restored to its verified pre-update state."
    fi
    rm -rf "$rollback_directory"
    fail "Update and automatic recovery failed. Do not start an older image manually; restore $update_backup first."
}

create_persistence_probe()
{
    storage_volume="$(read_configuration_value ACHELIFE_STORAGE_VOLUME)"
    app_image="$(read_configuration_value ACHELIFE_APP_IMAGE)"
    docker volume inspect "$storage_volume" >/dev/null 2>&1 || return 1
    docker run --rm --entrypoint sh --volume "${storage_volume}:/storage" \
        "$app_image" -c 'umask 077; printf persisted >/storage/app/.achelife-manager-probe'
}

verify_persistence_probe()
{
    docker_compose exec -T app test -f storage/app/.achelife-manager-probe >/dev/null 2>&1
}

clear_persistence_probe()
{
    docker_compose exec -T app rm -f storage/app/.achelife-manager-probe >/dev/null 2>&1 || true
}

retain_prior_release_metadata()
{
    mkdir -p "$STATE_DIR"
    umask 077
    {
        printf 'ACHELIFE_VERSION=%s\n' "$(read_configuration_value ACHELIFE_VERSION)"
        printf 'ACHELIFE_APP_IMAGE=%s\n' "$(read_configuration_value ACHELIFE_APP_IMAGE)"
        printf 'ACHELIFE_APP_DIGEST=%s\n' "$(read_configuration_value ACHELIFE_APP_DIGEST)"
        printf 'ACHELIFE_WEB_IMAGE=%s\n' "$(read_configuration_value ACHELIFE_WEB_IMAGE)"
        printf 'ACHELIFE_WEB_DIGEST=%s\n' "$(read_configuration_value ACHELIFE_WEB_DIGEST)"
    } >"$STATE_DIR/previous-release.env"
    chmod 600 "$STATE_DIR/previous-release.env"
}

apply_target_image_configuration()
{
    set_configuration_value ACHELIFE_VERSION "$1"
    set_configuration_value ACHELIFE_CHANNEL "$2"
    set_configuration_value ACHELIFE_APP_IMAGE "$APP_IMAGE_REFERENCE"
    set_configuration_value ACHELIFE_APP_DIGEST "$APP_IMAGE_DIGEST"
    set_configuration_value ACHELIFE_WEB_IMAGE "$WEB_IMAGE_REFERENCE"
    set_configuration_value ACHELIFE_WEB_DIGEST "$WEB_IMAGE_DIGEST"
}

restore_enabled_configuration()
{
    was_enabled="$1"
    if [ "$was_enabled" = true ]; then
        set_configuration_value ACHELIFE_RESTART_POLICY unless-stopped
        update_existing_container_restart_policies unless-stopped
    else
        set_configuration_value ACHELIFE_RESTART_POLICY no
        update_existing_container_restart_policies no
    fi
}

record_update_check()
{
    mkdir -p "$STATE_DIR"
    umask 077
    {
        printf 'UPDATE_STATE=%s\n' "$1"
        printf 'UPDATE_VERSION=%s\n' "$2"
        printf 'CHECKED_AT=%s\n' "$(utc_timestamp)"
    } >"$STATE_DIR/update-check.env"
    chmod 600 "$STATE_DIR/update-check.env"
}
