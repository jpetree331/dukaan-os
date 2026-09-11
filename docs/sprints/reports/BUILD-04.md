# BUILD-04 — Recoverable migration and checkpoint backups

Status: **built-unverified at build checkpoint**. Runtime code `58ac83d4567bdfc50846828696dbcb03318ac256`. Predecessor VERIFY-03 remote confirmed at `f292518b89ca6f78f8b1b8fcce040cb5f635ccd0`. Date: 11 September 2026.

## Changes and reasons

Added an explicit, disabled-by-default migration service and storage router. Migration archives the exact legacy source, copies and replays the destination, verifies it, then installs an old-client fence before marking the destination active. Restarting any stage resumes without replacing later destination sales. Changed sources require reconciliation or safe cancellation before cutover. Missing or damaged destinations fail closed. Login transitions retain journal storage; account deletion removes owned migration copies. Pending legacy sync queue and recovery checkpoints follow the book.

Added storage-v3 portable snapshot backups with source-hash provenance, validation, encryption and fresh-profile restore through the existing file UI. Current staff/PIN security remains local to the receiving counter. The [recovery decision table](../MIGRATION-RECOVERY.md) explains when cancellation is safe and when forward recovery is required.

## Actual builder evidence

- `npm test`: **50 passed, 0 failed** on the runtime code above.
- `node tests/browser-migration.cjs`: **11 groups passed** on disposable Edge 152.0.4191.66 profiles. Interruptions at all six stages survive reload and repeated resume; subsequent sales persist. Stock remains 8 and two bills remain after two sales from stock 10. A changed source with a third sale survives cancellation and migration retry.
- The actual retained VERIFY-03 client refuses the fence without changing it. Migrated login enable/disable, owned-account deletion, and encrypted checkpoint restore through the file UI pass.
- Build passed: `e1417b76194b2383d7af`. Plan structure and whitespace checks passed.

## Scope, deviations and recovery limits

Normal startup does not migrate a shop. Explicit prototype activation is tested only with synthetic data. Independent review: **None at this checkpoint**; required before real-data cutover. No production deployment, real shop data, physical power-loss or browser-eviction test.

The portable backup is a complete current business snapshot with a declared recovery checkpoint, **not a full internal journal export**. Restoring or changing login namespaces starts a new journal checkpoint; it cannot recreate unavailable legacy events. This bounded compatibility choice is documented rather than represented as continuous forensic history. Old binaries cannot reopen migrated storage; Git rewind alone is not data rollback.

Failed final builder checks: **None**. Due seams: 01-04, 02-04 and 03-04; older pairs must be rerun because the storage router and backup path changed. Push build/report before VERIFY-04 and check the remote SHA separately.
