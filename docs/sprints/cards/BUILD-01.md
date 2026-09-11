# BUILD-01 — Domain contracts and reference fixtures

Status: **planned**. Track: Foundation.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

New features need one definition of stock, money, identity and reversals before the storage model changes.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: none beyond VERIFY-00.
- Decision records: [D01](../DECISIONS.md), [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Extract pure sale/tax/quantity calculations behind the existing API; define command IDs, actor/store IDs, timestamps, immutable snapshots and correction links; add independently calculated fixture totals.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/core.js`; `js/pos.js`; `tests/transactions.test.cjs`.

Out of scope: Framework replacement, database migration and new tax-policy features.

## Acceptance contract

A discounted mixed-tax sale, split quantities, loyalty redemption and full void match hand-calculated results; legacy records retain their original semantics.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Record calculation tables and contract version; compare output to the current implementation; revert the adapter only, without rewriting persisted records.

## Integration handoff

Domain surfaces: money, inventory, identity, schema. Default next gate: [VERIFY-01](VERIFY-01.md).

The default gate assesses this build against **all 0 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-01` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-01.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-01 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
