# Repository instructions

## Backward compatibility

- Always preserve backward compatibility for persisted data, account archives, imports and exports, database upgrades, configuration, public APIs, and installation or deployment workflows.
- Never change an existing versioned format in a way that makes previously valid data unreadable. Add an explicit versioned adapter, migration, or safe default instead.
- Verify backward compatibility with regression tests that use the previous data or payload shape.
- If compatibility cannot be preserved safely, stop and document the breaking change, the required migration path, and the recovery or rollback plan before implementation.

## Releases

- Never publish a stable release directly when a release affects installation, deployment, database migrations, backups or restores, persistent data, upgrades, security, or networking.
- Create an internal pre-release or release candidate first, test it fully, and promote it to stable only after verification passes. Do not publish internal test versions publicly.
- Write release notes in this structure:

```markdown
App name v1.1.0 improves the library, stats, and other updated areas.

## Added

- Added ...

## Changed

- Improved ...

## Fixed

- Fixed ...
```

Include only the sections that apply.

## Documentation and implementation

- Always read the relevant files in `docs/` before making changes.
- Use the nearest available development port from 8000 through 8009 for implementation and UI verification. Do not rebuild, recreate, or otherwise modify installed Docker instances such as the v1.0.1 instance on port 8081 unless the user explicitly requests it.
- Use intention-revealing names.
- Keep high-level flow readable.
- Extract low-level details into named functions or services.
- Do not hide side effects behind query-like names.
- Use DTOs when arguments become unclear.
- Do not add comments unless they explain why.
- Do not abstract duplication until the concept is proven.
- Keep files under 500 lines; split them by responsibility before they exceed that limit.
- Provide commit message suggestions after completing changes.
