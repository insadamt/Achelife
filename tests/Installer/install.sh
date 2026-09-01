#!/bin/sh
set -eu
. "$(dirname "$0")/helpers.sh"

install_directory="${TEST_WORK}/fresh install"
install_output="$(install_test_instance "$install_directory")"
assert_output_contains "$install_output" 'Achelife 1.0.0-rc.1 is installed.'
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_BIND_ADDRESS=127.0.0.1'
assert_file_contains "$install_directory/config/installation.env" 'COMPOSE_PROJECT_NAME=achelife-8080'
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0-rc.1'
[ "$(stat -c '%a' "$install_directory/config/installation.env")" = 600 ] || fail_test 'Configuration permissions were not 600.'

original_key="$(sed -n 's/^ACHELIFE_APP_KEY=//p' "$install_directory/config/installation.env")"
install_test_instance "$install_directory" --no-start >/dev/null
repeated_key="$(sed -n 's/^ACHELIFE_APP_KEY=//p' "$install_directory/config/installation.env")"
[ "$original_key" = "$repeated_key" ] || fail_test 'Idempotent install changed the application key.'

custom_directory="${TEST_WORK}/custom"
install_test_instance "$custom_directory" --port 18081 --project custom_identity --no-start >/dev/null
assert_file_contains "$custom_directory/config/installation.env" 'ACHELIFE_PORT=18081'
assert_file_contains "$custom_directory/config/installation.env" 'COMPOSE_PROJECT_NAME=custom_identity'

FAKE_LEGACY_APP_KEY='base64:bGVnYWN5LWtleS0xMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ='
export FAKE_LEGACY_APP_KEY
legacy_directory="${TEST_WORK}/legacy"
install_test_instance "$legacy_directory" --project achelife --no-start >/dev/null
assert_file_contains "$legacy_directory/config/installation.env" "ACHELIFE_APP_KEY=$FAKE_LEGACY_APP_KEY"
unset FAKE_LEGACY_APP_KEY

assert_command_fails install_test_instance "${TEST_WORK}/unsafe" --bind 0.0.0.0 --no-start
install_test_instance "${TEST_WORK}/lan" --bind 0.0.0.0 --acknowledge-network-risk --no-start >/dev/null

FAKE_PORT_CONFLICT=1
export FAKE_PORT_CONFLICT
conflict_directory="${TEST_WORK}/conflict"
conflict_output="$(install_test_instance "$conflict_directory" --port 18080 --no-start 2>&1)"
assert_output_contains "$conflict_output" 'Port 18080 is already in use; using available port 18081.'
assert_file_contains "$conflict_directory/config/installation.env" 'ACHELIFE_PORT=18081'
assert_file_contains "$conflict_directory/config/installation.env" 'COMPOSE_PROJECT_NAME=achelife-18081'
assert_command_fails install_test_instance "${TEST_WORK}/control-character" --project "invalid
project" --no-start
unset FAKE_PORT_CONFLICT
assert_command_fails install_test_instance "${TEST_WORK}/invalid" --port 70000 --no-start
assert_command_fails install_test_instance "${TEST_WORK}/invalid-ipv4" --bind 999.1.1.1 --acknowledge-network-risk --no-start
assert_command_fails install_test_instance "${TEST_WORK}/invalid-ipv6" --bind 1::2::3 --acknowledge-network-risk --no-start
install_test_instance "${TEST_WORK}/ipv6" --bind ::1 --no-start >/dev/null
assert_command_fails install_test_instance relative-path --no-start

FAKE_LOW_DISK=1
export FAKE_LOW_DISK
assert_command_fails install_test_instance "${TEST_WORK}/low-disk" --no-start
unset FAKE_LOW_DISK

FAKE_DOCKER_MODE=compose_unavailable
export FAKE_DOCKER_MODE
assert_command_fails install_test_instance "${TEST_WORK}/no-compose" --no-start
FAKE_DOCKER_MODE=daemon_unavailable
export FAKE_DOCKER_MODE
assert_command_fails install_test_instance "${TEST_WORK}/no-daemon" --no-start
unset FAKE_DOCKER_MODE

missing_docker_bin="${TEST_WORK}/missing-docker-bin"
mkdir -p "$missing_docker_bin"
ln -s "$(command -v dirname)" "$missing_docker_bin/dirname"
ln -s "$(command -v mkdir)" "$missing_docker_bin/mkdir"
assert_command_fails env PATH="$missing_docker_bin" HOME="$TEST_HOME" XDG_CONFIG_HOME="$XDG_CONFIG_HOME" \
    /bin/sh "$TEST_ROOT/achelife" install --dir "${TEST_WORK}/no-docker" --yes --version 1.0.0-rc.1 --channel rc

if printf '%s\n' "$install_output" | grep -F "$original_key" >/dev/null; then
    fail_test 'Installer output exposed the application key.'
fi

run_interactive_install()
{
    prompt_responses="$1"
    interactive_install_directory="$2"
    interactive_command="\"$TEST_ROOT/achelife\" install --dir \"$interactive_install_directory\" --bin-dir \"${TEST_HOME}/.local/bin\" --version 1.0.0-rc.1 --channel rc --no-start"
    printf '%b' "$prompt_responses" | script --quiet --return --command "$interactive_command" /dev/null
}

enter_confirmation_directory="${TEST_WORK}/enter-confirmation"
enter_confirmation_output="$(run_interactive_install '\n' "$enter_confirmation_directory")"
assert_output_contains "$enter_confirmation_output" 'Install Achelife 1.0.0-rc.1? [Y/n]'
assert_file_contains "$enter_confirmation_directory/config/installation.env" 'ACHELIFE_PORT=8080'

cancelled_directory="${TEST_WORK}/cancelled"
cancelled_output="$(run_interactive_install 'n\n' "$cancelled_directory")"
assert_output_contains "$cancelled_output" 'Installation cancelled.'
[ ! -e "$cancelled_directory/config/installation.env" ] || fail_test 'Cancelled installation wrote configuration.'

FAKE_USED_PORTS='8080'
export FAKE_USED_PORTS
suggested_port_directory="${TEST_WORK}/suggested-port"
suggested_port_output="$(run_interactive_install '\n\n' "$suggested_port_directory")"
assert_output_contains "$suggested_port_output" 'Press Enter to use available port 8081'
assert_file_contains "$suggested_port_directory/config/installation.env" 'ACHELIFE_PORT=8081'
assert_file_contains "$suggested_port_directory/config/installation.env" 'COMPOSE_PROJECT_NAME=achelife-8081'

FAKE_USED_PORTS='8080 9000'
custom_port_directory="${TEST_WORK}/custom-port-prompt"
custom_port_output="$(run_interactive_install '9000\n\n\n' "$custom_port_directory")"
assert_output_contains "$custom_port_output" 'Port 9000 is already in use.'
assert_output_contains "$custom_port_output" 'Press Enter to use available port 9001'
assert_file_contains "$custom_port_directory/config/installation.env" 'ACHELIFE_PORT=9001'
unset FAKE_USED_PORTS

printf 'Installer tests passed.\n'
