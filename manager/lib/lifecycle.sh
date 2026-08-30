start_stack_and_verify()
{
    require_command curl
    docker_compose up -d app || return 1
    wait_for_service_health app "$DEFAULT_HEALTH_TIMEOUT" || return 1
    docker_compose exec -T app php artisan up >/dev/null 2>&1 || true
    docker_compose up -d scheduler web || return 1
    wait_for_application_health "$DEFAULT_HEALTH_TIMEOUT" || return 1
    verify_migration_state || return 1
    verify_single_user_readiness || return 1
}

wait_for_service_health()
{
    service_name="$1"
    timeout_seconds="$2"
    elapsed_seconds=0

    while [ "$elapsed_seconds" -lt "$timeout_seconds" ]; do
        container_id="$(service_container_id "$service_name")"
        if [ -n "$container_id" ] && [ "$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$container_id" 2>/dev/null || true)" = healthy ]; then
            return 0
        fi
        sleep 3
        elapsed_seconds=$((elapsed_seconds + 3))
    done
    return 1
}

command_start()
{
    validate_no_arguments "$@"
    ensure_installed
    acquire_management_lock
    verify_docker_requirements
    info "Starting Achelife..."
    start_stack_and_verify || {
        print_health_recovery_instructions
        fail "Achelife failed to start cleanly."
    }
    printf 'Achelife is ready at %s\n' "$(application_url)"
}

command_stop()
{
    validate_no_arguments "$@"
    ensure_installed
    acquire_management_lock
    verify_docker_requirements
    info "Stopping Achelife while preserving containers and data..."
    docker_compose stop
}

command_restart()
{
    validate_no_arguments "$@"
    ensure_installed
    acquire_management_lock
    verify_docker_requirements
    info "Restarting Achelife..."
    docker_compose stop
    start_stack_and_verify || {
        print_health_recovery_instructions
        fail "Achelife failed to restart cleanly."
    }
}

command_enable()
{
    command_set_enabled_state true "$@"
}

command_disable()
{
    command_set_enabled_state false "$@"
}

command_set_enabled_state()
{
    desired_enabled="$1"
    shift
    apply_now=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --now) apply_now=true; shift ;;
            *) fail "Unknown enable/disable option: $1" ;;
        esac
    done

    ensure_installed
    acquire_management_lock
    verify_docker_requirements

    if [ "$desired_enabled" = true ]; then
        restart_policy=unless-stopped
    else
        restart_policy=no
    fi
    set_configuration_value ACHELIFE_RESTART_POLICY "$restart_policy"
    update_existing_container_restart_policies "$restart_policy"

    if [ "$apply_now" = true ] && [ "$desired_enabled" = true ]; then
        start_stack_and_verify || fail "Auto-start was enabled, but Achelife failed to start."
    elif [ "$apply_now" = true ]; then
        docker_compose stop
    fi

    info "Achelife boot auto-start is $(enabled_label "$desired_enabled")."
}

update_existing_container_restart_policies()
{
    restart_policy="$1"
    container_ids="$(docker_compose ps --all --quiet 2>/dev/null || true)"
    for container_id in $container_ids; do
        docker update --restart "$restart_policy" "$container_id" >/dev/null
    done
}

enabled_label()
{
    [ "$1" = true ] && printf 'enabled\n' || printf 'disabled\n'
}

command_logs()
{
    ensure_installed
    verify_docker_requirements
    follow_logs=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --follow|-f) follow_logs=true; shift ;;
            *) fail "Unknown logs option: $1" ;;
        esac
    done
    if [ "$follow_logs" = true ]; then
        docker_compose logs --follow app scheduler web
    else
        docker_compose logs --tail 200 app scheduler web
    fi
}

command_open()
{
    validate_no_arguments "$@"
    ensure_installed
    target_url="$(application_url)"
    case "$(uname -s 2>/dev/null || printf unknown)" in
        Darwin*) command -v open >/dev/null 2>&1 || fail "The 'open' command is unavailable."; open "$target_url" ;;
        MINGW*|MSYS*|CYGWIN*) command -v cmd.exe >/dev/null 2>&1 || fail "cmd.exe is unavailable."; cmd.exe /c start "" "$target_url" ;;
        *) command -v xdg-open >/dev/null 2>&1 || fail "xdg-open is unavailable."; xdg-open "$target_url" ;;
    esac
}
