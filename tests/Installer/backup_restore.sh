#!/bin/sh
set -eu
. "$(dirname "$0")/helpers.sh"

install_directory="${TEST_WORK}/backup-source"
install_test_instance "$install_directory" >/dev/null
sed -i 's#^ACHELIFE_BIN_DIR=.*#ACHELIFE_BIN_DIR=/source-host/bin#' "$install_directory/config/installation.env"
backup_output="$(run_manager --dir "$install_directory" backup)"
backup_archive="$(printf '%s\n' "$backup_output" | sed -n 's/^Verified full-instance backup: //p')"
[ -f "$backup_archive" ] || fail_test 'Full-instance backup was not created.'

tampered_directory="${TEST_WORK}/tampered-backup"
tampered_archive="${TEST_WORK}/tampered-backup.tar.gz"
mkdir -p "$tampered_directory"
tar -xzf "$backup_archive" -C "$tampered_directory"
printf '%s\n' 'ACHELIFE_APP_IMAGE=ghcr.io/insadamt/achelife:1.0.0-rc.1@sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' \
    >>"$tampered_directory/config/installation.env"
(
    cd "$tampered_directory"
    : >checksums.sha256
    for payload_file in manifest.env config/installation.env config/compose.yaml volumes/data.tar volumes/storage.tar; do
        sha256sum "$payload_file" >>checksums.sha256
    done
)
tar -czf "$tampered_archive" -C "$tampered_directory" .
assert_command_fails run_manager --dir "${TEST_WORK}/tampered-restore" restore "$tampered_archive" --confirm RESTORE

restore_directory="${TEST_WORK}/clean-restore"
run_manager --dir "$restore_directory" restore "$backup_archive" --confirm RESTORE >/dev/null
[ -f "$FAKE_DOCKER_STATE/restored" ] || fail_test 'Clean-host restore did not restore volumes.'
assert_file_contains "$restore_directory/config/installation.env" 'ACHELIFE_VERSION=1.0.0-rc.1'
assert_file_contains "$restore_directory/config/installation.env" "ACHELIFE_BIN_DIR=${TEST_HOME}/.local/bin"

run_manager --dir "$restore_directory" uninstall >/dev/null
[ ! -d "$restore_directory" ] || fail_test 'Retained-data uninstall did not move the installation.'

purge_directory="${TEST_WORK}/purge"
install_test_instance "$purge_directory" >/dev/null
purge_output="$(run_manager --dir "$purge_directory" uninstall --purge --confirm-purge PURGE)"
[ ! -d "$purge_directory" ] || fail_test 'Confirmed purge retained the installation directory.'
assert_output_contains "$purge_output" 'Recovery backup:'

printf 'Backup, clean restore, and uninstall tests passed.\n'
