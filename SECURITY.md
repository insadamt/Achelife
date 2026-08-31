# Security policy

Achelife handles private Diary writing, People notes, Money records, account exports, full-instance backups, and an application encryption key. Please report security problems privately and avoid testing with anyone else's data or deployment.

## Supported versions

Until stable v1.0.0 is released, only the newest published `1.0.0-rc.x` release candidate receives security fixes. After stable release, the newest stable release will be supported unless release notes state otherwise.

## Report a vulnerability

Use [GitHub's private vulnerability reporting form](https://github.com/insadamt/Achelife/security/advisories/new). Do not open a public issue for a suspected vulnerability.

Include:

- affected version and component;
- deployment and network conditions;
- reproducible steps or a minimal proof of concept;
- expected and observed impact;
- any suggested mitigation.

Do not attach real `.env` files, `installation.env`, application keys, account exports, full-instance backups, Diary entries, People notes, Money data, or other personal records. Use synthetic data and redact tokens, paths, addresses, and identifiers.

## Security boundary

Achelife is deliberately passwordless and single-user. It has no public-internet authentication boundary. Anyone who can reach the HTTP service can read and mutate the instance. The supported deployment is localhost, a trusted private network, or a private VPN.

Direct public-internet exposure, public port forwarding, shared untrusted networks, and treating the setup profile as multi-user authentication are unsupported configurations rather than authentication bypasses.

Reports are still welcome for issues such as:

- unintended exposure outside the configured bind address;
- secret disclosure through output, logs, archives, or images;
- archive traversal, unsafe links, checksum bypass, or restore validation bypass;
- command or configuration injection;
- unauthorized cross-profile behavior in migration or restore paths;
- supply-chain, container, update, or rollback integrity failures;
- browser injection or security-header regressions.

## Disclosure

Please allow time to reproduce, fix, and release a verified RC before public disclosure. Security fixes affecting installation, deployment, migrations, backups, persistent data, updates, or networking will never be published directly as a new stable build.
