#!/bin/sh
set -eu
. "$(dirname "$0")/helpers.sh"

install_directory="${TEST_WORK}/update"
install_test_instance "$install_directory" >/dev/null
: >"$FAKE_DOCKER_STATE/events.log"

stable_check_output="$(run_manager --dir "$install_directory" update --check)"
assert_output_contains "$stable_check_output" '1.0.1'

check_output="$(run_manager --dir "$install_directory" update --check --channel rc)"
assert_output_contains "$check_output" '1.0.0-rc.2'
assert_file_contains "$install_directory/state/update-check.env" 'UPDATE_STATE=available'

assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.2
run_manager --dir "$install_directory" update --to 1.0.0-rc.2 --channel rc >/dev/null
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0-rc.2'
[ -f "$install_directory/state/previous-release.env" ] || fail_test 'Previous image metadata was not retained.'
[ -n "$(find "$install_directory/backups" -name 'achelife-full-*.tar.gz' -print -quit)" ] || fail_test 'Update backup was not retained.'
backup_event_line="$(grep -n -m 1 '^backup-snapshot$' "$FAKE_DOCKER_STATE/events.log" | cut -d: -f1)"
migration_event_line="$(grep -n -m 1 '^compose-up:1.0.0-rc.2$' "$FAKE_DOCKER_STATE/events.log" | cut -d: -f1)"
[ "$backup_event_line" -lt "$migration_event_line" ] || fail_test 'The target image started before the verified backup completed.'

FAKE_PULL_FAILURE=1
export FAKE_PULL_FAILURE
assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.3 --channel rc
unset FAKE_PULL_FAILURE

FAKE_BACKUP_FAILURE=1
export FAKE_BACKUP_FAILURE
: >"$FAKE_DOCKER_STATE/events.log"
assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.3 --channel rc
if grep -F 'compose-up:1.0.0-rc.3' "$FAKE_DOCKER_STATE/events.log" >/dev/null; then
    fail_test 'Target migration started after backup failure.'
fi
unset FAKE_BACKUP_FAILURE

FAKE_MIGRATION_FAIL_VERSION=1.0.0-rc.3
export FAKE_MIGRATION_FAIL_VERSION
: >"$FAKE_DOCKER_STATE/events.log"
assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.3 --channel rc
unset FAKE_MIGRATION_FAIL_VERSION
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0-rc.2'
target_failure_line="$(grep -n -m 1 '^compose-up:1.0.0-rc.3$' "$FAKE_DOCKER_STATE/events.log" | cut -d: -f1)"
rollback_line="$(grep -n -m 1 '^compose-up:1.0.0-rc.2$' "$FAKE_DOCKER_STATE/events.log" | cut -d: -f1)"
[ "$target_failure_line" -lt "$rollback_line" ] || fail_test 'Rollback did not restart the prior image after target failure.'

FAKE_HEALTH_FAIL_VERSION=1.0.0-rc.3
export FAKE_HEALTH_FAIL_VERSION
assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.3 --channel rc
unset FAKE_HEALTH_FAIL_VERSION
assert_file_contains "$install_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0-rc.2'

status_json="$(run_manager --dir "$install_directory" status --json)"
assert_output_contains "$status_json" '"running":true'

FAKE_LOW_DISK=1
export FAKE_LOW_DISK
assert_command_fails run_manager --dir "$install_directory" update --to 1.0.0-rc.3 --channel rc
unset FAKE_LOW_DISK

stopped_install_directory="${TEST_WORK}/stopped-update"
install_test_instance "$stopped_install_directory" >/dev/null
run_manager --dir "$stopped_install_directory" disable --now >/dev/null
run_manager --dir "$stopped_install_directory" update --to 1.0.0-rc.2 --channel rc >/dev/null
stopped_status_json="$(run_manager --dir "$stopped_install_directory" status --json)"
assert_output_contains "$stopped_status_json" '"running":false'
assert_output_contains "$stopped_status_json" '"auto_start":false'

promotion_install_directory="${TEST_WORK}/stable-promotion"
install_test_instance "$promotion_install_directory" >/dev/null
run_manager --dir "$promotion_install_directory" update --to 1.0.0 >/dev/null
assert_file_contains "$promotion_install_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0'
assert_file_contains "$promotion_install_directory/config/installation.env" 'ACHELIFE_CHANNEL=stable'
assert_command_fails run_manager --dir "$promotion_install_directory" update --to 1.0.0-rc.2

printf 'Update and failure recovery tests passed.\n'
