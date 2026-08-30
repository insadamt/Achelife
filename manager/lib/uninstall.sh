command_uninstall()
{
    ensure_installed
    purge_data=false
    purge_confirmation=""
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --purge) purge_data=true; shift ;;
            --confirm-purge)
                require_option_value "$1" "${2:-}"
                purge_confirmation="$2"
                shift 2
                ;;
            *) fail "Unknown uninstall option: $1" ;;
        esac
    done

    acquire_management_lock
    verify_docker_requirements
    configured_bin_dir="$(read_configuration_value ACHELIFE_BIN_DIR)"

    if [ "$purge_data" = true ]; then
        [ "$purge_confirmation" = PURGE ] \
            || confirm_literal PURGE "Purge permanently deletes both Docker volumes after creating a verified safety backup."
        purge_backup="$(create_full_backup_internal true)"
        verify_full_backup_archive "$purge_backup" || fail "Safety backup verification failed; data was not purged."
        preserved_backup="$(preserve_purge_backup_outside_installation "$purge_backup")"
        docker_compose down --volumes
        remove_manager_link "$configured_bin_dir"
        pointer_file="$(manager_pointer_file)"
        rm -f "$pointer_file"
        release_management_lock
        rm -rf "$INSTALL_DIR"
        printf 'Achelife and its persistent volumes were removed.\nRecovery backup: %s\n' "$preserved_backup"
        return
    fi

    docker_compose down
    recovery_path="$(recoverable_uninstall_path)"
    remove_manager_link "$configured_bin_dir"
    pointer_file="$(manager_pointer_file)"
    rm -f "$pointer_file"
    release_management_lock
    mv "$INSTALL_DIR" "$recovery_path"
    printf 'Achelife containers were removed; persistent volumes were retained.\n'
    printf 'Recoverable installation configuration: %s\n' "$recovery_path"
}

remove_manager_link()
{
    configured_bin_dir="$1"
    command_path="${configured_bin_dir}/achelife"
    [ ! -L "$command_path" ] || rm "$command_path"
}

recoverable_uninstall_path()
{
    install_parent="$(dirname "$INSTALL_DIR")"
    install_name="$(basename "$INSTALL_DIR")"
    recovery_path="${install_parent}/.${install_name}-uninstalled-$(utc_timestamp)"
    [ ! -e "$recovery_path" ] || fail "Recovery path already exists: $recovery_path"
    printf '%s\n' "$recovery_path"
}

preserve_purge_backup_outside_installation()
{
    purge_backup="$1"
    install_parent="$(dirname "$INSTALL_DIR")"
    preserved_backup="${install_parent}/$(basename "$purge_backup")"
    if [ -e "$preserved_backup" ]; then
        preserved_backup="${install_parent}/achelife-purge-safety-$(utc_timestamp).tar.gz"
    fi
    cp "$purge_backup" "$preserved_backup"
    chmod 600 "$preserved_backup"
    verify_full_backup_archive "$preserved_backup" || fail "Could not preserve the purge safety backup outside the installation."
    printf '%s\n' "$preserved_backup"
}
