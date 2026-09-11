# BUILD-09 — Stock adjustments and expiry write-offs

Status: **built-unverified**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Physical counts and quarantined stock need movements separate from sales.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-08](VERIFY-08.md).
- Decision records: [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add reason-coded owner adjustments, counted-stock reconciliation and expired/damaged disposal; preserve batch cost and physical/sellable/quarantine distinctions.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/inventory.js`; `js/core.js`; `repository`.

Out of scope: Store transfers and automatic financial expense classification.

## Acceptance contract

Write off an expired batch, adjust undated stock, return a damaged item and recount; totals match the movement log and no sale consumes quarantined units.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Record actor, reason, batch and prior/new count; reverse by linked adjustment instead of restoring an old database.

## Integration handoff

Domain surfaces: inventory, money, identity, persistence, reports. Default next gate: [VERIFY-09](VERIFY-09.md).

The default gate assesses this build against **all 8 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-09` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-09.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-09 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
