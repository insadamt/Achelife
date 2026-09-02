#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
acceptance_root="$(mktemp -d "${TMPDIR:-/tmp}/achelife-phase17.XXXXXX")"
host_docker_config="${DOCKER_CONFIG:-${HOME}/.docker}"
resource_suffix="$$"
registry_name="achelife-phase17-registry-${resource_suffix}"
fresh_project="achelife-phase17-fresh-${resource_suffix}"
upgrade_project="achelife-phase17-upgrade-${resource_suffix}"
lan_project="achelife-phase17-lan-${resource_suffix}"
registry_image='registry:2@sha256:a3d8aaa63ed8681a604f1dea0aa03f100d5895b6a58ace528858a7b332415373'
rollback_image='busybox:1.37.0-musl@sha256:fc6dddc4c44b1bfe37f41cae8e67d1693828e8f42a91862816d7953e2c9d3f23'
rc_version=1.0.0-rc.1
phase_fifteen_version=0.15.0
broken_version=1.0.0-rc.2

fail_acceptance()
{
    printf 'Phase 17 Docker acceptance failed: %s\n' "$1" >&2
    exit 1
}

configuration_value()
{
    key="$1"
    file="$2"
    sed -n "s/^${key}=//p" "$file" | sed -n '1p'
}

compose_for_installation()
{
    install_directory="$1"
    shift
    configuration_file="${install_directory}/config/installation.env"
    project="$(configuration_value COMPOSE_PROJECT_NAME "$configuration_file")"
    docker compose --project-name "$project" --env-file "$configuration_file" --file "${install_directory}/compose.yaml" "$@"
}

remove_installation_resources()
{
    install_directory="$1"
    if [ -r "${install_directory}/config/installation.env" ]; then
        compose_for_installation "$install_directory" down --volumes --remove-orphans >/dev/null 2>&1 || true
    fi
}

cleanup_acceptance()
{
    remove_installation_resources "${acceptance_root}/fresh-install"
    remove_installation_resources "${acceptance_root}/upgrade-install"
    remove_installation_resources "${acceptance_root}/recovery-install"
    docker rm --force "$registry_name" >/dev/null 2>&1 || true
    docker volume rm \
        "${fresh_project}_achelife-data" "${fresh_project}_achelife-storage" \
        "${upgrade_project}_achelife-data" "${upgrade_project}_achelife-storage" \
        "${lan_project}_achelife-data" "${lan_project}_achelife-storage" >/dev/null 2>&1 || true
    if [ -n "${image_repository:-}" ]; then
        docker image rm \
            "${image_repository}:${rc_version}" "${image_repository}-web:${rc_version}" \
            "${image_repository}:${phase_fifteen_version}" "${image_repository}-web:${phase_fifteen_version}" \
            "${image_repository}:${broken_version}" "${image_repository}-web:${broken_version}" >/dev/null 2>&1 || true
    fi
    docker image rm \
        "achelife-phase17-app:${resource_suffix}" \
        "achelife-phase17-web:${resource_suffix}" \
        "achelife-phase15-app:${resource_suffix}" >/dev/null 2>&1 || true
    rm -rf "$acceptance_root"
}

trap cleanup_acceptance EXIT HUP INT TERM

find_available_port()
{
    candidate_port="$1"
    while ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)${candidate_port}$"; do
        candidate_port=$((candidate_port + 1))
    done
    printf '%s\n' "$candidate_port"
}

run_manager()
{
    manager_home="$1"
    shift
    mkdir -p "$manager_home"
    HOME="$manager_home" \
    XDG_CONFIG_HOME="${manager_home}/.config" \
    DOCKER_CONFIG="$host_docker_config" \
    ACHELIFE_IMAGE_REPOSITORY="$image_repository" \
    ACHELIFE_ALLOW_INSECURE_REGISTRY=true \
    ACHELIFE_HEALTH_TIMEOUT=90 \
        "$repository_root/achelife" "$@"
}

wait_for_registry()
{
    attempts=0
    until curl --fail --silent "http://${registry_address}/v2/" >/dev/null 2>&1; do
        attempts=$((attempts + 1))
        [ "$attempts" -lt 30 ] || fail_acceptance 'The isolated registry did not become ready.'
        sleep 1
    done
}

publish_acceptance_images()
{
    rc_app_local="achelife-phase17-app:${resource_suffix}"
    rc_web_local="achelife-phase17-web:${resource_suffix}"
    phase_fifteen_app_local="achelife-phase15-app:${resource_suffix}"

    docker pull "$rollback_image" >/dev/null

    docker build --target app --build-arg "ACHELIFE_VERSION=${rc_version}" --tag "$rc_app_local" "$repository_root"
    docker build --target web --build-arg "ACHELIFE_VERSION=${rc_version}" --tag "$rc_web_local" "$repository_root"
    docker build --target app --build-arg "ACHELIFE_VERSION=${phase_fifteen_version}" --tag "$phase_fifteen_app_local" "$repository_root"

    docker run --rm --entrypoint php "$rc_app_local" -r \
        'exit(extension_loaded("zip") ? 0 : 1);' \
        || fail_acceptance 'The application image does not provide the required PHP ZIP extension.'

    docker tag "$rc_app_local" "${image_repository}:${rc_version}"
    docker tag "$rc_web_local" "${image_repository}-web:${rc_version}"
    docker tag "$phase_fifteen_app_local" "${image_repository}:${phase_fifteen_version}"
    docker tag "$rc_web_local" "${image_repository}-web:${phase_fifteen_version}"
    docker tag "$rollback_image" "${image_repository}:${broken_version}"
    docker tag "$rc_web_local" "${image_repository}-web:${broken_version}"

    for image in \
        "${image_repository}:${rc_version}" \
        "${image_repository}-web:${rc_version}" \
        "${image_repository}:${phase_fifteen_version}" \
        "${image_repository}-web:${phase_fifteen_version}" \
        "${image_repository}:${broken_version}" \
        "${image_repository}-web:${broken_version}"; do
        docker push "$image" >/dev/null
    done
}

assert_security_boundary()
{
    install_directory="$1"
    web_container="$(compose_for_installation "$install_directory" ps --quiet web)"
    published_ip="$(docker inspect --format '{{(index (index .NetworkSettings.Ports "80/tcp") 0).HostIp}}' "$web_container")"
    [ "$published_ip" = 127.0.0.1 ] || fail_acceptance 'Fresh install was not bound to localhost.'
    security_options="$(docker inspect --format '{{json .HostConfig.SecurityOpt}}' "$web_container")"
    printf '%s\n' "$security_options" | grep -F 'no-new-privileges' >/dev/null \
        || fail_acceptance 'Container no-new-privileges hardening was absent.'
    network_name="$(configuration_value COMPOSE_PROJECT_NAME "${install_directory}/config/installation.env")_achelife-internal"
    [ "$(docker network inspect --format '{{.Internal}}' "$network_name")" = true ] \
        || fail_acceptance 'Application service network was not internal.'
}

seed_phase_fifteen_state()
{
    install_directory="$1"
    app_container="$(compose_for_installation "$install_directory" ps --quiet app)"
    docker cp "$repository_root/tests/Release/fixtures/seed_phase_15.php" "${app_container}:/tmp/seed_phase_15.php"
    docker exec "$app_container" php /tmp/seed_phase_15.php >/dev/null
}

verify_upgraded_state()
{
    install_directory="$1"
    app_container="$(compose_for_installation "$install_directory" ps --quiet app)"
    docker cp "$repository_root/tests/Release/fixtures/verify_upgraded_state.php" "${app_container}:/tmp/verify_upgraded_state.php"
    docker exec "$app_container" php /tmp/verify_upgraded_state.php >/dev/null
}

base_port=$((20000 + resource_suffix % 20000))
fresh_port="$(find_available_port "$base_port")"
upgrade_port="$(find_available_port $((fresh_port + 1)))"

docker run --detach --name "$registry_name" --publish 127.0.0.1::5000 "$registry_image" >/dev/null
registry_port="$(docker port "$registry_name" 5000/tcp | sed -n 's/.*://p' | sed -n '1p')"
registry_address="127.0.0.1:${registry_port}"
image_repository="${registry_address}/achelife"
wait_for_registry
publish_acceptance_images

fresh_home="${acceptance_root}/fresh-home"
fresh_install="${acceptance_root}/fresh-install"
run_manager "$fresh_home" --dir "$fresh_install" install \
    --bin-dir "${fresh_home}/bin" --port "$fresh_port" --project "$fresh_project" \
    --version "$rc_version" --channel rc --yes >/dev/null
curl --fail --silent "http://127.0.0.1:${fresh_port}/setup" >/dev/null
curl --fail --silent --head "http://127.0.0.1:${fresh_port}/up" | grep -Fi 'Content-Security-Policy:' >/dev/null \
    || fail_acceptance 'Browser security headers were absent.'
run_manager "$fresh_home" --dir "$fresh_install" doctor --json | grep -F '"ok":true' >/dev/null
assert_security_boundary "$fresh_install"

lan_home="${acceptance_root}/lan-home"
lan_install="${acceptance_root}/lan-install"
if run_manager "$lan_home" --dir "$lan_install" install \
    --bin-dir "${lan_home}/bin" --port $((upgrade_port + 1)) --project "$lan_project" \
    --bind 0.0.0.0 --version "$rc_version" --channel rc --yes --no-start >/dev/null 2>&1; then
    fail_acceptance 'Trusted-LAN install succeeded without explicit risk acknowledgement.'
fi
lan_output="$(run_manager "$lan_home" --dir "$lan_install" install \
    --bin-dir "${lan_home}/bin" --port $((upgrade_port + 1)) --project "$lan_project" \
    --bind 0.0.0.0 --version "$rc_version" --channel rc --yes --no-start \
    --acknowledge-network-risk 2>&1)"
printf '%s\n' "$lan_output" | grep -F 'Never expose it directly to the public internet.' >/dev/null \
    || fail_acceptance 'Trusted-LAN warning was absent.'

upgrade_home="${acceptance_root}/upgrade-home"
upgrade_install="${acceptance_root}/upgrade-install"
run_manager "$upgrade_home" --dir "$upgrade_install" install \
    --bin-dir "${upgrade_home}/bin" --port "$upgrade_port" --project "$upgrade_project" \
    --version "$phase_fifteen_version" --channel stable --yes >/dev/null
seed_phase_fifteen_state "$upgrade_install"
key_before="$(configuration_value ACHELIFE_APP_KEY "${upgrade_install}/config/installation.env" | sha256sum | awk '{print $1}')"
if run_manager "$upgrade_home" --dir "$upgrade_install" update --to "$rc_version" >/dev/null 2>&1; then
    fail_acceptance 'RC update succeeded without explicit RC channel opt-in.'
fi
run_manager "$upgrade_home" --dir "$upgrade_install" update --to "$rc_version" --channel rc >/dev/null
[ -n "$(find "${upgrade_install}/backups" -name 'achelife-full-*.tar.gz' -print -quit)" ] \
    || fail_acceptance 'Upgrade did not retain its verified pre-migration backup.'
compose_for_installation "$upgrade_install" exec -T scheduler php artisan tinker \
    --execute='app(\App\Actions\Money\SynchronizeAllMoneySubscriptions::class)->execute();' >/dev/null
curl --fail --silent "http://127.0.0.1:${upgrade_port}/money" >/dev/null
curl --fail --silent "http://127.0.0.1:${upgrade_port}/money" >/dev/null
verify_upgraded_state "$upgrade_install"
portable_archive="${acceptance_root}/account.achelife.zip"
curl --fail --silent --show-error \
    --output "$portable_archive" \
    "http://127.0.0.1:${upgrade_port}/settings/portability/export"
[ -s "$portable_archive" ] || fail_acceptance 'The portable account export was empty.'
unzip -t "$portable_archive" >/dev/null \
    || fail_acceptance 'The downloaded portable account export was not a readable ZIP archive.'
scheduler_container="$(compose_for_installation "$upgrade_install" ps --quiet scheduler)"
[ "$(docker inspect --format '{{.State.Running}}' "$scheduler_container")" = true ] \
    || fail_acceptance 'Scheduler container was not running.'
app_container_before_restart="$(compose_for_installation "$upgrade_install" ps --quiet app)"
web_container_before_restart="$(compose_for_installation "$upgrade_install" ps --quiet web)"
scheduler_container_before_restart="$scheduler_container"
run_manager "$upgrade_home" --dir "$upgrade_install" restart >/dev/null
[ "$(compose_for_installation "$upgrade_install" ps --quiet app)" != "$app_container_before_restart" ] \
    || fail_acceptance 'Restart did not recreate the application container.'
[ "$(compose_for_installation "$upgrade_install" ps --quiet web)" != "$web_container_before_restart" ] \
    || fail_acceptance 'Restart did not recreate the web container.'
[ "$(compose_for_installation "$upgrade_install" ps --quiet scheduler)" != "$scheduler_container_before_restart" ] \
    || fail_acceptance 'Restart did not recreate the scheduler container.'
verify_upgraded_state "$upgrade_install"
key_after="$(configuration_value ACHELIFE_APP_KEY "${upgrade_install}/config/installation.env" | sha256sum | awk '{print $1}')"
[ "$key_before" = "$key_after" ] || fail_acceptance 'Application key changed during update or restart.'

if run_manager "$upgrade_home" --dir "$upgrade_install" update --to "$broken_version" --channel rc >/dev/null 2>&1; then
    fail_acceptance 'Deliberately broken update unexpectedly succeeded.'
fi
[ "$(configuration_value ACHELIFE_VERSION "${upgrade_install}/config/installation.env")" = "$rc_version" ] \
    || fail_acceptance 'Failed update did not restore the prior version configuration.'
verify_upgraded_state "$upgrade_install"

external_backup_directory="${acceptance_root}/off-host-backups"
mkdir -p "$external_backup_directory"
backup_output="$(run_manager "$upgrade_home" --dir "$upgrade_install" backup)"
backup_path="$(printf '%s\n' "$backup_output" | sed -n 's/^Verified full-instance backup: //p')"
external_backup="${external_backup_directory}/$(basename "$backup_path")"
cp "$backup_path" "$external_backup"
external_checksum="$(sha256sum "$external_backup" | awk '{print $1}')"

compose_for_installation "$upgrade_install" down --volumes --remove-orphans >/dev/null
rm -rf "$upgrade_install"
recovery_home="${acceptance_root}/recovery-home"
recovery_install="${acceptance_root}/recovery-install"
run_manager "$recovery_home" --dir "$recovery_install" restore "$external_backup" \
    --bin-dir "${recovery_home}/bin" --confirm RESTORE >/dev/null
[ "$(sha256sum "$external_backup" | awk '{print $1}')" = "$external_checksum" ] \
    || fail_acceptance 'Off-host backup changed during recovery.'
[ "$(configuration_value ACHELIFE_BIN_DIR "${recovery_install}/config/installation.env")" = "${recovery_home}/bin" ] \
    || fail_acceptance 'Clean-host recovery retained the source host command path.'
verify_upgraded_state "$recovery_install"

printf 'Phase 17 isolated Docker acceptance passed.\n'
