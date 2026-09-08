# RC.2 acceptance — 2026-09-05

## Decision

The tested functional and recovery paths passed. Do not record this as an unconditional stable-release approval: the published web images have fixable HIGH dependency findings, and the Subscription composer has a reproducible date-preview mismatch. Recommend addressing both in a subsequent RC and verifying it before promotion.

No release was published, and no application code was changed during this assessment. The user separately reported testing all application areas successfully.

### Subsequent promotion authorization

On 2026-09-05, after reviewing these findings, the maintainer explicitly requested promotion to `v1.0.0`. They confirmed reinstall recovery worked and explicitly chose to proceed without a separate-machine restore. This is a maintainer-approved exception to that acceptance requirement, not a passing test result. The known dependency findings and Subscription preview mismatch remain disclosed; source, image digests, and automated publication gates are unchanged.

### Stable publication outcome

[v1.0.0](https://github.com/insadamt/Achelife/releases/tag/v1.0.0) was subsequently published as the latest stable release through [promotion run 33977165299](https://github.com/insadamt/Achelife/actions/runs/33977165299). Source verification, Docker acceptance, and all four architecture-specific vulnerability gates passed.

The first publication attempt completed image promotion but stopped in the absent-stable-tag check before invoking release creation. After verifying the successful gates and absence of the stable tag, the tag was created at the exact RC.2 commit and the publication job was retried successfully. No production image was rebuilt and no existing tag was overwritten.

Independent anonymous verification confirmed the release is public, non-draft, non-prerelease, and latest; `v1.0.0` points to `8d00531ad4b6a999f0e541a072e9987cacf16f76`; the manager contains version `1.0.0` and the MIT License; its download matches SHA-256 `3771a155de4b67452a227fa74414f47c5cadc8a9ae03bbe9574052108643be1a`; and both stable image manifests match the RC.2 digests listed below, including amd64 and arm64 entries. The public release notes disclose the findings and maintainer-approved restore-test exception.

## Candidate and isolation

- Candidate: `v1.0.0-rc.2`.
- Source: `8d00531ad4b6a999f0e541a072e9987cacf16f76`.
- Application manifest: `sha256:144028a4e3cb14a02b48cdddebfad95a5e5b046f632b1937f1c5a252d3e85421`.
- Web manifest: `sha256:67a3faa4138856bedd623fec7023d92e6221ca6ca8acbdd59713b3678bcb9c7d`.
- Source tests ran in a separate `/tmp` copy of the complete tracked source with separate writable dependencies and synthetic databases.
- Docker tests used uniquely named projects, localhost ports, networks, installations, and disposable volumes. Existing application data was not used.
- Published-image tests used an empty Docker credential configuration with only the host Compose executable made available.

## Results

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Full source gate | PASS | Composer validation/audit, npm audit, Pint, 320 PHPUnit tests and 1,969 assertions, installer/manager shell suite, release notes, TypeScript, ESLint, production build, shell syntax, Compose, Actionlint, supply-chain contracts, Caddy configuration, file sizes, and whitespace. |
| Source Docker acceptance | PASS | Unmodified `tests/Release/docker_acceptance.sh`, using local builds from candidate source. |
| Anonymous release downloads | PASS | Downloaded the published manager and digest manifest without credentials; manager SHA-256 verification passed. |
| Published RC.2 recovery acceptance | PASS | Downloaded manager, exact published RC.2 app/web images, and published RC.1 application image. Images were mirrored to a disposable local registry for failure injection. |
| Public installer | PASS | Downloaded the RC.2 installer, compared it with candidate source, and installed directly from GitHub/GHCR without credentials. `/setup` responded; `doctor --json` returned `ok: true`, zero issues. |
| Fresh installation and hardening | PASS | Localhost binding, private application network, `no-new-privileges`, security headers, readiness, and diagnostics. |
| Trusted-LAN acknowledgement | PASS, bounded | Installation configuration rejected a LAN bind without acknowledgement and emitted the required warning with it. This used `--no-start`; external LAN reachability was not exercised. |
| Upgrade and persistence | PASS | Synthetic profile, Season SP, Task reward, Subscription occurrence/transaction, application key, and storage marker survived update and recreation of app, web, and scheduler containers. |
| Failed-update recovery | PASS | A deliberately invalid application image failed; the manager restored the prior version and matched snapshot, preserving verified state. |
| Full-instance restore | PASS, same host | Copied the verified backup outside the installation, destroyed source containers and volumes, and restored into a different clean installation and executable path. Backup checksum remained unchanged. |
| Portable account export | PASS | Real HTTP download through the production web/app stack produced a valid, nonempty ZIP archive. |
| Subscription synchronization | PASS | Synchronization invoked in the scheduler container plus repeated Money access produced exactly one paid occurrence and one matching Expense. Scheduler was running. |
| Populated browser onboarding | PASS | Created a profile, first Season, Objective, Habit, Task, preset pack, and USD Account; reload resumed the Money step; account balance was correct. |
| Browser actions | PASS for exercised actions | Mobile Task and Habit completion produced 8 total SP; one-time hold changed the next Season to “waiting for you”; manual Subscription creation produced one payment due today. |
| Desktop/mobile DOM smoke checks | PASS | 24 checks: 11 pages at 1440×900 and 390×844, mobile navigation drawer, and mobile Subscription composer. No duplicate IDs, unnamed enabled controls, missing image alt attributes, or horizontal overflow. |
| Application images, amd64/arm64 | PASS | Current pinned Trivy scan reported zero fixable HIGH or CRITICAL findings on both architectures. |
| Web images, amd64/arm64 | REVIEW REQUIRED | Each architecture reported 16 fixable HIGH package findings representing eight CVEs; no fixable CRITICAL findings. |

The browser pages were Today, Seasons, Tasks, Habits, Diary, Constitution, Money overview, Subscriptions, Categories, transaction history, and General Settings. These are DOM and responsive-layout smoke checks, not a complete accessibility certification.

The full PHP suite also covers automatic rollover and long absence, manual intermissions and one-time holds, recurring Task resumption, Habit/Diary streak preservation, late restore catch-up, progression reconciliation, Money presets, fees, manual/automatic Subscription processing, archive rejection/rollback, and migration compatibility. Passing automated coverage is distinct from manually exercising every branch in a browser.

## Findings

### Web image dependency findings

Both published web architectures contain `curl` and `libcurl` version `8.20.0-r0`. Trivy reports `8.22.0-r0` as the fixed version for:

- `CVE-2026-11352`
- `CVE-2026-11586`
- `CVE-2026-12064`
- `CVE-2026-8286`
- `CVE-2026-8458`
- `CVE-2026-8925`
- `CVE-2026-8927`
- `CVE-2026-9547`

The existing fixable-CRITICAL publication threshold passes, but Phase 17 requires review of HIGH findings and base refresh where an acceptable fix exists. These results are scanner findings, not proof of application-level exploitability. Refresh the web dependency/base in an RC, then repeat scans and relevant acceptance before stable promotion.

The scanner logged missing vulnerability details for `CVE-2026-80256` and noted that a CVE may have been rejected. It completed all four scans. This warning is retained in the raw log; no clean assessment of that missing record is claimed. Scans used `--ignore-unfixed`, matching the repository gate.

### Subscription composer next-payment preview

Reproduction in published RC.2:

1. Open New Subscription on 2026-09-05.
2. Keep start date 2026-09-05, monthly recurrence, and manual payment mode.
3. The composer displays `Next payment: 2026-10-05`.
4. Create the Subscription. The saved card correctly displays `Next payment: Today`, and Due contains one 2026-09-05 payment.

The composer uses `schedulePreview(..., today, ...)`, whose `next` is the first occurrence strictly after today, and labels it as the next payment. This is a preview-label/date mismatch; no incorrect debit was observed. See `resources/js/features/money/SubscriptionComposerDrawer.tsx` and `subscriptionSchedule.ts`.

## Limits and retained evidence

- Recovery used one Docker host. A genuinely separate-machine restore and physical off-host storage remain unverified by this run.
- Images were scanned for both architectures; container execution was on the local host architecture, not a separate ARM machine.
- The source acceptance harness simulates the Phase 15 image from current source; the additional published-image harness used the real RC.1 application image under the harness's legacy version alias. Historical migration chains are covered separately by PHPUnit.
- Scheduler action execution and idempotency passed; this test invoked synchronization directly in the scheduler container rather than waiting for a calendar-triggered scheduled run.
- Browser screenshots could not be retained because screenshot capture timed out. DOM inspections succeeded. No application browser errors were observed in the inspected log; an Electron host warning was present.
- The browser tab became unavailable after manual Subscription creation, before a browser Pay action could be completed. Payment behavior passed the existing automated suite.
- An initial source-copy run omitted `.github` due to Git export rules; restoring the complete tracked source and rerunning the full gate passed. An initial anonymous test hid the user-installed Compose plugin; exposing only that executable, without credentials, resolved the test-environment issue.

Raw logs, all four scanner JSON reports, browser audit results, exact image digests, the published-test adapter, and a synthetic full-instance backup are retained in:

`/home/insayd/.codex/visualizations/2026/09/05/01a070dc-1a45-73b1-b041-eb5845cd8363/rc2-acceptance-evidence`

The retained synthetic backup SHA-256 is `4a928ee1f561f7fab17d49393ecd54bbb9bc40f8103d272e5915ad3bce8270e6`. Its images refer to the disposable registry used for recovery testing; this is acceptance evidence, not a user recovery package or a portable public-release backup.

Disposable Docker installations and volumes were removed after testing. The release roadmap's broader manual and separate-machine gates have not been marked complete based on this bounded run.
