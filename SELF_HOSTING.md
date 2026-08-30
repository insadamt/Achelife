# Achelife self-hosting

Achelife is installed and operated through the host-side `achelife` command. The manager uses exact versioned container images and does not require Git, PHP, Composer, Node.js, npm, or a source build on the host.

Achelife has no login boundary. The safe default is `127.0.0.1`; anyone who can reach a trusted-LAN or private-VPN binding can read and change the instance. Never expose Achelife directly to the public internet.

`v1.0.0-rc.1` is the first v1 pre-release candidate. After downloading and verifying its manager bundle, install it with explicit RC opt-in:

```bash
achelife install --version 1.0.0-rc.1 --channel rc
```

Common operations are:

```bash
achelife status
achelife start
achelife stop
achelife update --check
achelife backup
achelife doctor
```

Stable updates are always the default. Testing an exact RC requires the explicit channel on install and update:

```bash
achelife update --to 1.0.0-rc.1 --channel rc
```

For clean-host disaster recovery, copy a verified `achelife-full-*.tar.gz` archive outside the Docker host, install the same or newer trusted manager bundle, and run:

```bash
achelife restore /off-host/achelife-full-TIMESTAMP.tar.gz --bin-dir "$HOME/.local/bin"
```

See [Phase 16 self-hosted operations](docs/v1.0.0/phase-16-self-hosted-installer-and-manager.md) for installation options, the complete command reference, networking, updates, backup/restore, rollback, auto-start, and uninstall behavior. Release maintainers should also follow the [Phase 17 RC gates](docs/v1.0.0/phase-17-release-hardening-and-rc-promotion.md).
