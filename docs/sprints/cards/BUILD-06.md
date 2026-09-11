# BUILD-06 — Opening balances, customer credits and collections

Status: **built-unverified**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Scalar balances need explainable entries before adding refunds.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-05](VERIFY-05.md).
- Decision records: [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add explicit dated opening entries, payment-method selection, linked partial collections, advances and owner correction entries; make the customer balance a derived projection.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/ledger.js`; `js/core.js`; `repository`; `customer statements`.

Out of scope: Payment gateway integration and silent editing of old balance totals.

## Acceptance contract

Opening debt plus cash/UPI collections plus advance reconciles to statements and cash; duplicate collections and cross-store links fail without changes.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Carry migrated balances as disclosed opening checkpoints; retain evidence of exceptions; disable new entry UI rather than deleting ledger entries on rollback.

## Integration handoff

Domain surfaces: money, identity, persistence, reports. Default next gate: [VERIFY-06](VERIFY-06.md).

The default gate assesses this build against **all 5 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-06` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-06.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-06 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
