#!/bin/sh
set -eu
. "$(dirname "$0")/helpers.sh"

bundle_version=1.0.0
bundle_directory="${TEST_WORK}/bootstrap-downloads"
bundle_root="${TEST_WORK}/bundle/achelife-manager"
mkdir -p "$bundle_directory" "$bundle_root/manager"
cp -R "$TEST_ROOT/manager/." "$bundle_root/manager/"

cat >"$bundle_root/achelife" <<'EOF'
#!/bin/sh
printf 'BOOTSTRAP_ARGS=%s\n' "$*"
EOF
chmod 755 "$bundle_root/achelife"

create_bundle()
{
    version="$1"
    archive_path="${bundle_directory}/achelife-manager-${version}.tar.gz"
    tar -czf "$archive_path" -C "${TEST_WORK}/bundle" achelife-manager
    checksum_value="$(sha256sum "$archive_path" | awk '{print $1}')"
    printf '%s  %s\n' "$checksum_value" "$(basename "$archive_path")" >"${archive_path}.sha256"
}

create_bundle "$bundle_version"
export FAKE_DOWNLOAD_DIR="$bundle_directory"
export ACHELIFE_RELEASE_DOWNLOAD_BASE=https://example.test/downloads

stable_output="$(sh "$TEST_ROOT/scripts/install.sh" --version "$bundle_version" --yes --no-start)"
assert_output_contains "$stable_output" 'BOOTSTRAP_ARGS=install'
assert_output_contains "$stable_output" '--channel stable'

rc_version=1.0.0-rc.1
create_bundle "$rc_version"
rc_output="$(sh "$TEST_ROOT/scripts/install.sh" --version "$rc_version" --yes --no-start)"
assert_output_contains "$rc_output" '--channel rc'

printf 'tampered\n' >>"${bundle_directory}/achelife-manager-${bundle_version}.tar.gz"
assert_command_fails sh "$TEST_ROOT/scripts/install.sh" --version "$bundle_version" --yes --no-start
create_bundle "$bundle_version"

unsafe_root="${TEST_WORK}/unsafe-bundle"
mkdir -p "$unsafe_root"
cp -R "$bundle_root" "$unsafe_root/achelife-manager"
printf 'unexpected\n' >"$unsafe_root/achelife-manager/unexpected"
unsafe_archive="${bundle_directory}/achelife-manager-${bundle_version}.tar.gz"
tar -czf "$unsafe_archive" -C "$unsafe_root" achelife-manager
unsafe_checksum="$(sha256sum "$unsafe_archive" | awk '{print $1}')"
printf '%s  %s\n' "$unsafe_checksum" "$(basename "$unsafe_archive")" >"${unsafe_archive}.sha256"
assert_command_fails sh "$TEST_ROOT/scripts/install.sh" --version "$bundle_version" --yes --no-start

printf 'Bootstrap checksum and archive validation tests passed.\n'
