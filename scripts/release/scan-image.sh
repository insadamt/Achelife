#!/bin/sh
set -eu

image_reference="${1:-}"
[ -n "$image_reference" ] || {
    printf 'Usage: %s IMAGE_REFERENCE\n' "$0" >&2
    exit 1
}

scanner_image='aquasec/trivy:0.74.0@sha256:62b1e65e8869bc4b4c6aa4fa2b21595256c7c2f6018a9d9ad61caf87187c1969'
scanner_cache="${TRIVY_CACHE_DIR:-${TMPDIR:-/tmp}/achelife-trivy-cache}"
scanner_timeout="${TRIVY_TIMEOUT:-15m}"
mkdir -p "$scanner_cache"

run_scan()
{
    docker run --rm \
        --volume /var/run/docker.sock:/var/run/docker.sock \
        --volume "${scanner_cache}:/root/.cache" \
        "$scanner_image" image \
        --skip-version-check \
        --timeout "$scanner_timeout" \
        --scanners vuln \
        --ignore-unfixed \
        "$@" \
        "$image_reference"
}

run_scan --exit-code 0 --severity HIGH,CRITICAL
run_scan --exit-code 1 --severity CRITICAL --quiet
