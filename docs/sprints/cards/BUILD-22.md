# BUILD-22 — Incoming changes and initial hydration

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Uploads alone do not create a usable second device.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-21](VERIFY-21.md).
- Decision records: [D09](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add cursor-based pulls, paginated consistent bootstrap, ordered/idempotent apply, tombstones and projection refresh without overwriting local pending work; revoke cached access on online membership changes.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `sync adapter`; `repository`; `backend change feed`; `UI`.

Out of scope: Silent last-write-wins merging of transactions.

## Acceptance contract

Reconnect from stale cursor, replay/out-of-order pages, interrupted bootstrap and remote deletes; no lost pending commands or resurrection; two clients converge after accepted operations.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Checkpoint cursors only with successful local apply; a second device is not marked ready until bootstrap and authorization checks complete.

## Integration handoff

Domain surfaces: money, inventory, identity, schema, persistence, recovery, ui. Default next gate: [VERIFY-22](VERIFY-22.md).

The default gate assesses this build against **all 21 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-22` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-22.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-22 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
