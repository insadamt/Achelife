# Releasing Achelife yourself

## Prepare a candidate

Use a clean checkout containing the changes you intend to release. Read the current release review and compatibility requirements before proceeding. An RC is a pre-release; stable promotion is a separate decision after acceptance.

1. Add accurate notes in `scripts/release/changes/MAJOR.MINOR.PATCH.md`. Start with `Achelife vX.Y.Z improves ...`, then use only applicable Added, Changed, and Fixed sections. Describe implemented behavior rather than unfinished roadmap items.
2. Install locked dependencies and run the gates:

   ```bash
   composer install --no-interaction --prefer-dist
   npm ci
   sh scripts/release/verify-source.sh
   sh tests/Release/docker_acceptance.sh
   ```

   The Docker harness uses isolated resources and cleans them up. Never use your installed account as a disposable test database. For interactive UI testing, use the nearest free port from 8000 through 8009.
3. Commit and push the candidate source branch. Record its full commit SHA.
4. Open GitHub → Actions → **Verify and publish Achelife release candidate** → **Run workflow**. Select the source branch, enter `2.0.0-rc.1` (without `v`), and enter the exact confirmation `PUBLISH RC`.

   The equivalent CLI command is:

   ```bash
   gh workflow run release-rc.yml \
     --ref YOUR_SOURCE_BRANCH \
     -f version=2.0.0-rc.1 \
     -f confirmation='PUBLISH RC'
   gh run list --workflow release-rc.yml --limit 5
   gh run watch RUN_ID --exit-status
   ```

   **This workflow publishes publicly in this public repository.** `--prerelease` does not make a release private. For an internal-only candidate, use a private distribution path instead; do not dispatch this workflow.
5. Wait for every job to pass. The workflow verifies source and Docker acceptance, builds and scans app/web for amd64 and arm64, assembles verified manifests, attaches checksummed manager assets, and creates the `v2.0.0-rc.1` pre-release. Do not manually bypass a failed gate or publish an unscanned image.
6. Verify the release target, assets, and image digests:

   ```bash
   gh release view v2.0.0-rc.1
   gh release download v2.0.0-rc.1 --dir /tmp/achelife-rc-download
   cd /tmp/achelife-rc-download
   sha256sum -c achelife-manager-2.0.0-rc.1.tar.gz.sha256
   cat image-digests.txt
   ```

   Retain the workflow URL, source SHA, scan results, digest manifest, and acceptance results. Follow the [self-hosting guide](../../SELF_HOSTING.md) for installation and recovery. Exact RC installation uses `--version 2.0.0-rc.1 --channel rc`; exact updates use `achelife update --to 2.0.0-rc.1 --channel rc` after a verified off-host backup.

## Manual RC acceptance checklist

Use disposable accounts and a separate installation for destructive tests. Mark these complete only after you perform them.

- [ ] Fresh installation, setup, onboarding, restart, and `achelife doctor` succeed.
- [ ] Review desktop and mobile layouts, keyboard focus, 320px reflow, large text, and reduced motion.
- [ ] Test Light/Dark, Normal/Frosted glass, separate main colors, custom background upload/removal, and persistence after reload.
- [ ] Test Today task completion/undo, boolean/numeric Habits, and popup positioning.
- [ ] Create/move/archive Tasks and Projects; test Calendar, Focus start/pause/switch/finish, navigation, and chart updates.
- [ ] Review Seasons, objectives, closeout/intermission, Diary, Constitution, and statistics.
- [ ] Add expenses/income with People, filter History, inspect totals, and test debt repayment, transfer, and subscription.
- [ ] Upgrade a copy of an older supported account; compare its records and settings.
- [ ] Restore representative old account archives; export/restore/re-export format 12, including a zero-day historical intermission.
- [ ] Verify full-instance backup, clean-host restore, failed-update recovery, and data persistence. Retain a verified backup outside the Docker host.
- [ ] Review HIGH image scan findings, remaining roadmap gaps, and release notes; accept the RC before stable promotion.

## Promote a verified RC to stable

Only promote after all automated and manual acceptance checks pass. Use the matching RC tag as workflow source, rather than a branch with later changes. The workflow reuses verified image manifests and does not rebuild production images.

```bash
gh workflow run release-stable.yml \
  --ref v2.0.0-rc.1 \
  -f version=2.0.0 \
  -f rc_version=2.0.0-rc.1 \
  -f confirmation='PROMOTE VERIFIED RC'
gh run list --workflow release-stable.yml --limit 5
gh run watch RUN_ID --exit-status
```

If the candidate fails acceptance, fix the source and publish `2.0.0-rc.2`; do not overwrite an existing RC. Use matched full-instance restoration for rollback, preserving the recorded image digests and database snapshot together. See the [release hardening procedure](../v1.0.0/phase-17-release-hardening-and-rc-promotion.md) for the full gate contract.
