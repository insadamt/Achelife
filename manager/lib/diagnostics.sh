command_status()
{
    ensure_installed
    status_json=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --json) status_json=true; shift ;;
            *) fail "Unknown status option: $1" ;;
        esac
    done

    STATUS_VERSION="$(read_configuration_value ACHELIFE_VERSION)"
    STATUS_URL="$(application_url)"
    STATUS_ENABLED="$(installation_is_enabled)"
    STATUS_RUNNING=false
    STATUS_HEALTH=unavailable
    STATUS_CONTAINER_COUNT=0
    STATUS_DATABASE_SIZE=0

    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        stack_is_running && STATUS_RUNNING=true
        STATUS_HEALTH="$(web_health_status)"
        STATUS_CONTAINER_COUNT="$(docker_compose ps --all --quiet 2>/dev/null | sed '/^$/d' | wc -l | tr -d '[:space:]')"
        STATUS_DATABASE_SIZE="$(database_size_bytes)"
    fi

    STATUS_LAST_BACKUP="$(latest_backup_name)"
    STATUS_UPDATE_STATE="$(read_configuration_value UPDATE_STATE "$STATE_DIR/update-check.env" 2>/dev/null || true)"
    STATUS_UPDATE_STATE="${STATUS_UPDATE_STATE:-unchecked}"
    STATUS_UPDATE_VERSION="$(read_configuration_value UPDATE_VERSION "$STATE_DIR/update-check.env" 2>/dev/null || true)"

    if [ "$status_json" = true ]; then
        print_status_json
    else
        print_status_text
    fi
}

latest_backup_name()
{
    [ -d "$BACKUP_DIR" ] || {
        printf 'none\n'
        return
    }
    latest_backup="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'achelife-full-*.tar.gz' -print 2>/dev/null | sort | tail -n 1)"
    [ -n "$latest_backup" ] && basename "$latest_backup" || printf 'none\n'
}

print_status_json()
{
    printf '{'
    printf '"version":"%s",' "$(json_escape "$STATUS_VERSION")"
    printf '"url":"%s",' "$(json_escape "$STATUS_URL")"
    printf '"running":%s,' "$(boolean_json "$STATUS_RUNNING")"
    printf '"health":"%s",' "$(json_escape "$STATUS_HEALTH")"
    printf '"containers":%s,' "$STATUS_CONTAINER_COUNT"
    printf '"database_size_bytes":%s,' "${STATUS_DATABASE_SIZE:-0}"
    printf '"last_backup":"%s",' "$(json_escape "$STATUS_LAST_BACKUP")"
    printf '"auto_start":%s,' "$(boolean_json "$STATUS_ENABLED")"
    printf '"update":{"state":"%s","version":"%s"}' \
        "$(json_escape "$STATUS_UPDATE_STATE")" "$(json_escape "$STATUS_UPDATE_VERSION")"
    printf '}\n'
}

print_status_text()
{
    printf 'Version: %s\n' "$STATUS_VERSION"
    printf 'URL: %s\n' "$STATUS_URL"
    printf 'Running: %s\n' "$STATUS_RUNNING"
    printf 'Health: %s\n' "$STATUS_HEALTH"
    printf 'Containers: %s\n' "$STATUS_CONTAINER_COUNT"
    printf 'Database size: %s bytes\n' "${STATUS_DATABASE_SIZE:-0}"
    printf 'Last full backup: %s\n' "$STATUS_LAST_BACKUP"
    printf 'Boot auto-start: %s\n' "$STATUS_ENABLED"
    printf 'Update state: %s' "$STATUS_UPDATE_STATE"
    [ -z "$STATUS_UPDATE_VERSION" ] || printf ' (%s)' "$STATUS_UPDATE_VERSION"
    printf '\n'
}

command_doctor()
{
    doctor_json=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --json) doctor_json=true; shift ;;
            *) fail "Unknown doctor option: $1" ;;
        esac
    done

    DOCTOR_DOCKER=fail
    DOCTOR_COMPOSE=fail
    DOCTOR_CONFIGURATION=fail
    DOCTOR_HEALTH=not_checked
    DOCTOR_MIGRATIONS=not_checked
    DOCTOR_SINGLE_USER=not_checked
    DOCTOR_ISSUES=0

    command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 \
        && DOCTOR_DOCKER=pass || DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
    if [ "$DOCTOR_DOCKER" = pass ] && docker compose version >/dev/null 2>&1; then
        DOCTOR_COMPOSE=pass
    else
        DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
    fi
    if [ -r "$CONFIG_FILE" ] && [ -r "$COMPOSE_FILE" ] && [ "$(stat_mode "$CONFIG_FILE")" != insecure ]; then
        DOCTOR_CONFIGURATION=pass
    else
        DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
    fi

    if [ "$DOCTOR_CONFIGURATION" = pass ] && [ "$DOCTOR_COMPOSE" = pass ]; then
        if stack_is_running; then
            DOCTOR_HEALTH="$(web_health_status)"
            [ "$DOCTOR_HEALTH" = healthy ] || DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
            verify_migration_state && DOCTOR_MIGRATIONS=pass || {
                DOCTOR_MIGRATIONS=fail
                DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
            }
            verify_single_user_readiness && DOCTOR_SINGLE_USER=pass || {
                DOCTOR_SINGLE_USER=fail
                DOCTOR_ISSUES=$((DOCTOR_ISSUES + 1))
            }
        else
            DOCTOR_HEALTH=stopped
        fi
    fi

    if [ "$doctor_json" = true ]; then
        printf '{"ok":%s,"issues":%s,"checks":{' "$( [ "$DOCTOR_ISSUES" -eq 0 ] && printf true || printf false )" "$DOCTOR_ISSUES"
        printf '"docker":"%s","compose":"%s","configuration":"%s",' "$DOCTOR_DOCKER" "$DOCTOR_COMPOSE" "$DOCTOR_CONFIGURATION"
        printf '"health":"%s","migrations":"%s","single_user":"%s"}}\n' "$DOCTOR_HEALTH" "$DOCTOR_MIGRATIONS" "$DOCTOR_SINGLE_USER"
    else
        printf 'Docker: %s\nCompose v2: %s\nConfiguration: %s\n' "$DOCTOR_DOCKER" "$DOCTOR_COMPOSE" "$DOCTOR_CONFIGURATION"
        printf 'Health: %s\nMigrations: %s\nSingle-user readiness: %s\n' "$DOCTOR_HEALTH" "$DOCTOR_MIGRATIONS" "$DOCTOR_SINGLE_USER"
        printf 'Issues: %s\n' "$DOCTOR_ISSUES"
    fi

    [ "$DOCTOR_ISSUES" -eq 0 ]
}

stat_mode()
{
    protected_file="$1"
    file_mode="$(stat -c '%a' "$protected_file" 2>/dev/null || stat -f '%Lp' "$protected_file" 2>/dev/null || true)"
    case "$file_mode" in
        600|400) printf secure\n ;;
        *) printf insecure\n ;;
    esac
}

command_version()
{
    version_json=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --json) version_json=true; shift ;;
            *) fail "Unknown version option: $1" ;;
        esac
    done

    installed_version=""
    installed_digest=""
    installed_channel=""
    if [ -r "$CONFIG_FILE" ]; then
        installed_version="$(read_configuration_value ACHELIFE_VERSION)"
        installed_digest="$(read_configuration_value ACHELIFE_APP_DIGEST)"
        installed_channel="$(read_configuration_value ACHELIFE_CHANNEL)"
    fi

    if [ "$version_json" = true ]; then
        printf '{"manager_version":"%s","installed_version":"%s","channel":"%s","app_digest":"%s"}\n' \
            "$(json_escape "$MANAGER_VERSION")" "$(json_escape "$installed_version")" \
            "$(json_escape "$installed_channel")" "$(json_escape "$installed_digest")"
    else
        printf 'Achelife Manager %s\n' "$MANAGER_VERSION"
        if [ -n "$installed_version" ]; then
            printf 'Achelife %s (%s)\nApp digest: %s\n' "$installed_version" "$installed_channel" "$installed_digest"
        else
            printf 'Achelife is not installed at %s.\n' "$INSTALL_DIR"
        fi
    fi
}
