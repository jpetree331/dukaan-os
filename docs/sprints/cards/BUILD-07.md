# BUILD-07 — Customer returns and refunds

Status: **passed; formal-shift seam remains due at VERIFY-11**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Voids cannot express partial returns and separate repayment obligations.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-06](VERIFY-06.md).
- Decision records: [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add sale-linked partial return commands, cumulative return limits, restock versus quarantine disposition, loyalty/tax reversal allocation, store credit and explicitly recorded cash/UPI refund settlement.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/ledger.js`; `js/pos.js`; `js/core.js`; `receipts`.

Out of scope: Automatic bank refunds and arbitrary negative sales.

## Acceptance contract

Partial return after redemption and partial payment, repeat return, return after price change and refund after shift close preserve stock, tax, liability and cash identities.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Use compensating records linked to the original sale; historical legacy allocation uncertainty is visible, never guessed away.

## Integration handoff

Domain surfaces: money, inventory, persistence, receipts, reports. Default next gate: [VERIFY-07](VERIFY-07.md).

The default gate assesses this build against **all 6 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-07` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-07.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-07 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
