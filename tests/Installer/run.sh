#!/bin/sh
set -eu

test_directory="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
for test_script in bootstrap install lifecycle update backup_restore; do
    sh "$test_directory/${test_script}.sh"
done

printf 'All Achelife installer and manager tests passed.\n'
