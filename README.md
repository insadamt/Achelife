# Achelife

Achelife v1 is being built progressively from a deliberately small Laravel and React foundation.

Achelife is a single-user, self-hosted application. It does not present a login screen or provide a public-internet authentication boundary. Keep it bound to localhost, a trusted private network, or behind a private VPN. Anyone who can reach the application can use it and access its private Diary and financial data.

Phase 0 provides the framework, internal user ownership, local SQLite database, and quality checks. Phase 0.5 adds the global visual system and application shell. Phase 1 adds automatic 30-day Seasons and Season introductions. Phase 2 adds global Tasks, recurrence, subtasks, dynamic rewards, and historically safe Season SP attribution. Phase 3 adds effective-dated Habits and streak progression. Phase 4 adds the autosaved Diary, People, moods, and writing rewards. Phase 5 adds global Laws and escalating, Season-safe Constitution violations. Phase 6 adds non-gamified Money tracking. Phase 7 adds Boolean Objectives inside each Season with setup locking and exact reward rebalancing. Phase 8 adds the Today aggregation screen. Phase 9 adds live Rank and completed-Season snapshots. Phase 10 adds General Settings and a user-local calendar over UTC timestamp storage.

Self-hosted production installation uses the host-side `achelife` command, exact versioned images, localhost-first networking, safe updates, and verified full-instance recovery. Phase 17 adds migration, disaster-recovery, container, supply-chain, and RC-only publication gates. `v1.0.0-rc.1` is the first v1 pre-release candidate; it is not stable and requires explicit RC opt-in. See the [Phase 16 operations guide](docs/v1.0.0/phase-16-self-hosted-installer-and-manager.md), [Phase 17 release hardening](docs/v1.0.0/phase-17-release-hardening-and-rc-promotion.md), and [self-hosting quick start](SELF_HOSTING.md).

The product history and domain contracts remain documented under [`docs/v0.1.0`](docs/v0.1.0) and [`docs/v1.0.0`](docs/v1.0.0).

The remaining work before v1.0.0 is organized in the [v1 pre-release roadmap](docs/v1.0.0/pre-release-roadmap.md).
