# BUILD-10 — Store assignments and stock transfers

Status: **built-unverified**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Stores need deliberate access boundaries and balanced movements.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-09](VERIFY-09.md).
- Decision records: [D03](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add staff-to-store assignments and store-specific receipt/target configuration; add owner transfer-out/in records with in-transit stock and idempotent acceptance.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/settings.js`; `js/inventory.js`; `js/core.js`; `receipts`.

Out of scope: Remote tenant enforcement and automatic offline inter-device transfer settlement.

## Acceptance contract

Wrong-store actor is denied; partial acceptance, repeated receipt and interrupted transfer preserve total physical stock; receipts retain their sale-time store identity.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Permissions default closed; migrations preserve existing ownership with an explicit assignment preview; transferred stock cannot be counted twice.

## Integration handoff

Domain surfaces: inventory, identity, persistence, receipts, reports. Default next gate: [VERIFY-10](VERIFY-10.md).

The default gate assesses this build against **all 9 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-10` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-10.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-10 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
