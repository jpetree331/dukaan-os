# BUILD-04 — Legacy migration and recovery cutover

Status: **passed for development; real-data activation pending independent review**. Track: Foundation.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Existing books must survive the new repository and still produce recoverable backups.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-03](VERIFY-03.md).
- Decision records: [D04](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Migrate v2 snapshots to the journalled schema with provenance, explicit opening checkpoints and migration markers; preserve historical facts rather than invent missing movements; update encrypted backup/restore for both schemas; prevent old clients writing after cutover.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/safety.js`; `js/backup.js`; `js/auth.js`; `persistence`; `sw.js`.

Out of scope: Deleting the source before verification or reconstructing lost pre-fix history.

## Acceptance contract

Interrupt at every migration stage, resume twice, compare counts/stock/balances, restore onto a fresh profile, and reject an older client without altering either copy.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Publish the forward-recovery and rollback decision table. After new-version transactions exist, reconcile them into recovery; never simply swap to a stale source snapshot.

## Integration handoff

Domain surfaces: money, inventory, schema, persistence, identity, recovery, release. Default next gate: [VERIFY-04](VERIFY-04.md).

The default gate assesses this build against **all 3 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-04` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

This is also a cumulative milestone: run all applicable higher-order shop journeys, not only this feature's tests.

## Required pushed report

Create `docs/sprints/reports/BUILD-04.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-04 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
