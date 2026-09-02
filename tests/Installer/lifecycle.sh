#!/bin/sh
set -eu
. "$(dirname "$0")/helpers.sh"

install_directory="${TEST_WORK}/lifecycle"
install_test_instance "$install_directory" >/dev/null

status_json="$(run_manager --dir "$install_directory" status --json)"
assert_output_contains "$status_json" '"running":true'
assert_output_contains "$status_json" '"health":"healthy"'
assert_output_contains "$status_json" '"auto_start":true'

run_manager --dir "$install_directory" stop >/dev/null
status_json="$(run_manager --dir "$install_directory" status --json)"
assert_output_contains "$status_json" '"running":false'
run_manager --dir "$install_directory" start >/dev/null
: >"$FAKE_DOCKER_STATE/events.log"
run_manager --dir "$install_directory" restart >/dev/null
assert_file_contains "$FAKE_DOCKER_STATE/events.log" 'compose-up-arguments:-d --force-recreate app'
assert_file_contains "$FAKE_DOCKER_STATE/events.log" 'compose-up-arguments:-d --force-recreate scheduler web'

run_manager --dir "$install_directory" disable --now >/dev/null
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_RESTART_POLICY=no'
run_manager --dir "$install_directory" enable --now >/dev/null
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_RESTART_POLICY=unless-stopped'

doctor_json="$(run_manager --dir "$install_directory" doctor --json)"
assert_output_contains "$doctor_json" '"ok":true'
version_json="$(run_manager --dir "$install_directory" version --json)"
assert_output_contains "$version_json" '"installed_version":"1.0.0-rc.1"'

mkdir -p "$install_directory/state/manager.lock"
printf '%s\n' "$$" >"$install_directory/state/manager.lock/pid"
assert_command_fails run_manager --dir "$install_directory" restart

printf 'Lifecycle and JSON tests passed.\n'
