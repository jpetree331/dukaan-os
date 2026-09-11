# BUILD-08 — Supplier corrections and credit notes

Status: **passed**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Purchase edits must not erase cash movements or already consumed stock.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-07](VERIFY-07.md).
- Decision records: [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add purchase-linked payment history, supplier return/credit notes, correction and cancellation commands; handle paid, unpaid and partly sold purchases with explicit exception rules.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/ledger.js`; `js/core.js`; `repository`; `reports`.

Out of scope: Rewriting consumed batches or implementing a general accounting package.

## Acceptance contract

Receive, partially pay, sell part, return remaining goods, settle credit and correct a duplicate: supplier balance, batches, cost and cash reconcile.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Preserve the original purchase and append corrections; block unsupported historical adjustments with a recoverable exception.

## Integration handoff

Domain surfaces: money, inventory, persistence, reports. Default next gate: [VERIFY-08](VERIFY-08.md).

The default gate assesses this build against **all 7 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-08` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-08.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-08 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
