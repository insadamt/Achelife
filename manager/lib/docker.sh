verify_docker_requirements()
{
    require_command docker
    docker compose version >/dev/null 2>&1 \
        || fail "Docker Compose v2 is required. Install the Docker Compose plugin."
    docker info >/dev/null 2>&1 \
        || fail "Docker is installed, but the Docker daemon is unavailable."
}

load_compose_identity()
{
    COMPOSE_PROJECT="$(read_configuration_value COMPOSE_PROJECT_NAME)"
    [ -n "$COMPOSE_PROJECT" ] || fail "Compose project identity is missing from the installation configuration."
}

docker_compose()
{
    load_compose_identity
    docker compose \
        --project-name "$COMPOSE_PROJECT" \
        --env-file "$CONFIG_FILE" \
        --file "$COMPOSE_FILE" \
        "$@"
}

service_container_id()
{
    docker_compose ps --all --quiet "$1" 2>/dev/null | sed -n '1p'
}

stack_is_running()
{
    web_container="$(service_container_id web)"
    [ -n "$web_container" ] || return 1
    [ "$(docker inspect --format '{{.State.Running}}' "$web_container" 2>/dev/null || true)" = true ]
}

web_health_status()
{
    web_container="$(service_container_id web)"
    [ -n "$web_container" ] || {
        printf 'stopped\n'
        return
    }
    docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{if .State.Running}}running{{else}}stopped{{end}}{{end}}' "$web_container" 2>/dev/null \
        || printf 'unknown\n'
}

wait_for_application_health()
{
    timeout_seconds="${1:-$DEFAULT_HEALTH_TIMEOUT}"
    health_url="$(application_url)/up"
    elapsed_seconds=0

    printf 'Waiting for Achelife health'
    while [ "$elapsed_seconds" -lt "$timeout_seconds" ]; do
        if curl --fail --silent --show-error --max-time 5 "$health_url" >/dev/null 2>&1 \
            && [ "$(web_health_status)" = healthy ]; then
            printf ' ready.\n'
            return 0
        fi
        printf '.'
        sleep 3
        elapsed_seconds=$((elapsed_seconds + 3))
    done
    printf '\n' >&2
    return 1
}

print_health_recovery_instructions()
{
    warn "Achelife did not become healthy. Configuration and persistent data were retained."
    docker_compose ps >&2 || true
    docker_compose logs --tail 100 app web >&2 || true
    printf 'Recovery: run `achelife doctor`, then `achelife logs`.\n' >&2
}

pull_exact_images()
{
    exact_version="$1"
    image_repository="${ACHELIFE_IMAGE_REPOSITORY:-$DEFAULT_IMAGE_REPOSITORY}"
    app_tag="${image_repository}:${exact_version}"
    web_tag="${image_repository}-web:${exact_version}"

    info "Pulling exact Achelife images for $exact_version..."
    docker pull "$app_tag" >/dev/null \
        || fail "Failed to pull exact application image $app_tag."
    docker pull "$web_tag" >/dev/null \
        || fail "Failed to pull exact web image $web_tag."

    APP_IMAGE_DIGEST="$(resolve_image_digest "$app_tag")"
    WEB_IMAGE_DIGEST="$(resolve_image_digest "$web_tag")"
    [ -n "$APP_IMAGE_DIGEST" ] || fail "Docker did not report an immutable digest for $app_tag."
    [ -n "$WEB_IMAGE_DIGEST" ] || fail "Docker did not report an immutable digest for $web_tag."
    APP_IMAGE_REFERENCE="${app_tag}@${APP_IMAGE_DIGEST}"
    WEB_IMAGE_REFERENCE="${web_tag}@${WEB_IMAGE_DIGEST}"
}

resolve_image_digest()
{
    image_tag="$1"
    repository_digest="$(docker image inspect --format '{{index .RepoDigests 0}}' "$image_tag" 2>/dev/null || true)"
    case "$repository_digest" in
        *@sha256:*) printf 'sha256:%s\n' "${repository_digest##*@sha256:}" ;;
    esac
}

port_is_in_use()
{
    requested_port="$1"

    if command -v ss >/dev/null 2>&1; then
        ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)$requested_port$" && return 0
    elif command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$requested_port" -sTCP:LISTEN >/dev/null 2>&1 && return 0
    elif command -v netstat >/dev/null 2>&1; then
        netstat -an 2>/dev/null | grep -E "[.:]$requested_port[[:space:]].*LISTEN" >/dev/null && return 0
    fi

    return 1
}

find_available_port()
{
    candidate_port="$1"

    while [ "$candidate_port" -le 65535 ]; do
        if ! port_is_in_use "$candidate_port"; then
            printf '%s\n' "$candidate_port"
            return 0
        fi
        candidate_port=$((candidate_port + 1))
    done

    candidate_port=1024
    while [ "$candidate_port" -lt "$1" ]; do
        if ! port_is_in_use "$candidate_port"; then
            printf '%s\n' "$candidate_port"
            return 0
        fi
        candidate_port=$((candidate_port + 1))
    done

    return 1
}

installation_owns_port()
{
    [ -r "$CONFIG_FILE" ] || return 1
    [ "$(read_configuration_value ACHELIFE_PORT)" = "$1" ] || return 1
    stack_is_running
}

verify_single_user_readiness()
{
    verification_json="$(docker_compose exec -T app php artisan achelife:verify --json 2>/dev/null)" \
        || return 1
    printf '%s' "$verification_json" | grep -Eq '"ready":true'
}

verify_migration_state()
{
    docker_compose exec -T app php artisan migrate:status --no-ansi 2>/dev/null \
        | grep -Eq 'Pending' && return 1
    return 0
}

database_size_bytes()
{
    app_container="$(service_container_id app)"
    [ -n "$app_container" ] || {
        printf '0\n'
        return
    }
    database_bytes="$(docker exec "$app_container" sh -c 'wc -c </data/achelife.sqlite 2>/dev/null || printf 0' 2>/dev/null || printf 0)"
    database_bytes="$(printf '%s' "$database_bytes" | tr -d '[:space:]')"
    case "$database_bytes" in ''|*[!0-9]*) database_bytes=0 ;; esac
    printf '%s\n' "$database_bytes"
}
