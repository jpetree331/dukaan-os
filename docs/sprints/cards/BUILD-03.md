# BUILD-03 — Transactional IndexedDB repository

Status: **planned**. Track: Foundation.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

A command journal and related money/stock effects need one local atomic commit.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-02](VERIFY-02.md).
- Decision records: [D04](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add a versioned IndexedDB repository, unique operation IDs and atomic command/journal/projection transactions; implement schema-parity reads and writes behind a disabled feature flag.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/core.js`; `new persistence modules`; `tests/persistence.test.cjs`.

Out of scope: Real-shop migration, cloud upload and replacing authorization with storage names.

## Acceptance contract

Real-browser transaction abort, quota, reopen and duplicate-command tests leave either all effects or none; projection rebuild equals committed records.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Use disposable databases; document the schema and commit boundary; keep production selection on the previous adapter until VERIFY-04.

## Integration handoff

Domain surfaces: money, inventory, schema, persistence, identity. Default next gate: [VERIFY-03](VERIFY-03.md).

The default gate assesses this build against **all 2 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-03` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-03.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-03 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
