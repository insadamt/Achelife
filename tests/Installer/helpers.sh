#!/bin/sh
set -eu

TEST_ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
TEST_WORK="$(mktemp -d "${TMPDIR:-/tmp}/achelife-manager-test.XXXXXX")"
TEST_BIN="${TEST_WORK}/bin"
TEST_HOME="${TEST_WORK}/home"
FAKE_DOCKER_STATE="${TEST_WORK}/docker-state"

export TEST_ROOT TEST_WORK TEST_BIN TEST_HOME FAKE_DOCKER_STATE
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="${TEST_HOME}/.config"
export PATH="${TEST_BIN}:$PATH"
export ACHELIFE_IMAGE_REPOSITORY="ghcr.io/insadamt/achelife"
export ACHELIFE_RELEASES_API_URL="https://example.test/releases"
export ACHELIFE_HEALTH_TIMEOUT=3

mkdir -p "$TEST_BIN" "$TEST_HOME" "$FAKE_DOCKER_STATE"

cleanup_test_environment()
{
    rm -rf "$TEST_WORK"
}

trap cleanup_test_environment EXIT HUP INT TERM

fail_test()
{
    printf 'FAIL: %s\n' "$1" >&2
    exit 1
}

assert_file_contains()
{
    file_path="$1"
    expected_text="$2"
    grep -F -- "$expected_text" "$file_path" >/dev/null \
        || fail_test "$file_path did not contain: $expected_text"
}

assert_output_contains()
{
    output_text="$1"
    expected_text="$2"
    printf '%s\n' "$output_text" | grep -F -- "$expected_text" >/dev/null \
        || fail_test "Output did not contain: $expected_text"
}

assert_command_fails()
{
    failure_output_file="${TEST_WORK}/expected-failure.$$.log"
    if "$@" >"$failure_output_file" 2>&1; then
        fail_test "Command unexpectedly succeeded: $*"
    fi
}

install_fixture_commands()
{
    cp "$TEST_ROOT/tests/Installer/fixtures/docker" "$TEST_BIN/docker"
    cp "$TEST_ROOT/tests/Installer/fixtures/curl" "$TEST_BIN/curl"
    cp "$TEST_ROOT/tests/Installer/fixtures/ss" "$TEST_BIN/ss"
    cp "$TEST_ROOT/tests/Installer/fixtures/sleep" "$TEST_BIN/sleep"
    cp "$TEST_ROOT/tests/Installer/fixtures/df" "$TEST_BIN/df"
    chmod +x "$TEST_BIN/docker" "$TEST_BIN/curl" "$TEST_BIN/ss" "$TEST_BIN/sleep" "$TEST_BIN/df"
}

run_manager()
{
    "$TEST_ROOT/achelife" "$@"
}

install_test_instance()
{
    install_directory="$1"
    shift
    run_manager install \
        --dir "$install_directory" \
        --bin-dir "${TEST_HOME}/.local/bin" \
        --version 1.0.0-rc.1 \
        --channel rc \
        --yes \
        "$@"
}

install_fixture_commands
