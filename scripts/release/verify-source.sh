#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
cd "$repository_root"

run_gate()
{
    gate_name="$1"
    shift
    printf '\n==> %s\n' "$gate_name"
    "$@"
}

verify_shell_syntax()
{
    find achelife manager scripts tests/Installer tests/Release -type f \( -name '*.sh' -o -name 'achelife' \) -print \
        | while IFS= read -r shell_file; do
            sh -n "$shell_file"
        done
}

verify_file_sizes()
{
    oversized_files="$(find app database docker docs manager resources routes scripts tests .github -type f -print \
        | while IFS= read -r source_file; do
            line_count="$(wc -l <"$source_file")"
            [ "$line_count" -le 500 ] || printf '%s: %s lines\n' "$source_file" "$line_count"
        done)"
    [ -z "$oversized_files" ] || {
        printf '%s\n' "$oversized_files" >&2
        return 1
    }
}

verify_compose_files()
{
    docker compose --file compose.yaml config --quiet
    compose_environment="$(mktemp "${TMPDIR:-/tmp}/achelife-compose.XXXXXX")"
    trap 'rm -f "$compose_environment"' EXIT HUP INT TERM
    digest='sha256:0000000000000000000000000000000000000000000000000000000000000000'
    cat >"$compose_environment" <<EOF
COMPOSE_PROJECT_NAME=achelife-release-gate
ACHELIFE_VERSION=1.0.0-rc.1
ACHELIFE_CHANNEL=rc
ACHELIFE_PORT=18080
ACHELIFE_BIND_ADDRESS=127.0.0.1
ACHELIFE_URL=http://127.0.0.1:18080
ACHELIFE_APP_KEY=base64:MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=
ACHELIFE_RESTART_POLICY=no
ACHELIFE_DATA_VOLUME=achelife-release-gate-data
ACHELIFE_STORAGE_VOLUME=achelife-release-gate-storage
ACHELIFE_APP_IMAGE=ghcr.io/insadamt/achelife:1.0.0-rc.1@${digest}
ACHELIFE_APP_DIGEST=${digest}
ACHELIFE_WEB_IMAGE=ghcr.io/insadamt/achelife-web:1.0.0-rc.1@${digest}
ACHELIFE_WEB_DIGEST=${digest}
ACHELIFE_BIN_DIR=/tmp/achelife-release-gate-bin
EOF
    docker compose --env-file "$compose_environment" --file manager/templates/compose.yaml config --quiet
    rm -f "$compose_environment"
    trap - EXIT HUP INT TERM
}

verify_workflows()
{
    for workflow_file in .github/workflows/*.yml .github/workflows/*.yaml; do
        [ -f "$workflow_file" ] || continue
        docker run --rm \
            --volume "$repository_root/$workflow_file:/workflow.yml:ro" \
            'rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667' \
            /workflow.yml
    done
}

verify_immutable_supply_chain_references()
{
    unpinned_base_images="$(awk '
        $1 == "FROM" {
            image = $2
            if (image ~ /^--platform=/) image = $3
            if (image !~ /@sha256:[a-f0-9]{64}$/) print
        }
    ' Dockerfile)"
    [ -z "$unpinned_base_images" ] || {
        printf '%s\n' "$unpinned_base_images" >&2
        return 1
    }

    workflow_actions="$(sed -n 's/^[[:space:]]*- uses: //p' .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null || true)"
    printf '%s\n' "$workflow_actions" | while IFS= read -r workflow_action; do
        [ -z "$workflow_action" ] || printf '%s\n' "$workflow_action" | grep -Eq '^[^[:space:]#]+@[a-f0-9]{40}([[:space:]]+#.*)?$'
    done

    grep -Eq "scanner_image='[^']+@sha256:[a-f0-9]{64}'" scripts/release/scan-image.sh
    grep -Eq "registry_image='[^']+@sha256:[a-f0-9]{64}'" tests/Release/docker_acceptance.sh
    grep -Eq "rollback_image='[^']+@sha256:[a-f0-9]{64}'" tests/Release/docker_acceptance.sh
}

verify_caddy_configuration()
{
    caddy_image='caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648'
    docker run --rm --volume "$repository_root/docker/selfhost/Caddyfile:/etc/caddy/Caddyfile:ro" \
        "$caddy_image" caddy fmt --diff /etc/caddy/Caddyfile
    docker run --rm --volume "$repository_root/docker/selfhost/Caddyfile:/etc/caddy/Caddyfile:ro" \
        "$caddy_image" caddy validate --config /etc/caddy/Caddyfile
}

run_gate 'Composer manifest' composer validate --strict --no-check-publish
run_gate 'Composer dependency audit' composer audit --locked --abandoned=fail
run_gate 'npm dependency audit' npm audit --audit-level=high
run_gate 'Pint' ./vendor/bin/pint --test
run_gate 'PHPUnit' php artisan test
run_gate 'Installer and manager shell suite' sh tests/Installer/run.sh
run_gate 'RC release notes' sh tests/Release/release_notes_test.sh
run_gate 'TypeScript' npm run types:check
run_gate 'ESLint' npm run lint
run_gate 'Production frontend build' npm run build
run_gate 'Browser acceptance harness syntax' node --check tests/Release/browser_acceptance.mjs
run_gate 'POSIX shell syntax' verify_shell_syntax
run_gate 'Compose validation' verify_compose_files
run_gate 'Workflow validation' verify_workflows
run_gate 'Immutable supply-chain references' verify_immutable_supply_chain_references
run_gate 'Caddy configuration' verify_caddy_configuration
run_gate 'First-party file size limit' verify_file_sizes
run_gate 'Whitespace errors' git diff --check
