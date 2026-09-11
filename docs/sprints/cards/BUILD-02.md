# BUILD-02 — Awaitable commands and storage boundary

Status: **passed (self-verified)**. See [verification](../reports/VERIFY-02.md). See [build report](../reports/BUILD-02.md). Track: Foundation.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

IndexedDB and network acknowledgements are asynchronous; changing storage without changing callers would show false success.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-01](VERIFY-01.md).
- Decision records: apply the agreed decisions; no new external choice is required for this slice.
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Introduce one awaitable command/persistence interface using the existing localStorage adapter; route sale, collection, purchase, restock, settings and auth migrations through it; preserve visible behavior.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/core.js`; `js/auth.js`; `js/settings.js`; `js/ledger.js`; `js/pos.js`.

Out of scope: IndexedDB cutover and background replication.

## Acceptance contract

Delay and reject each mutation: success, receipt, stock display and navigation wait for durable completion; double-click and stale dialogs cannot duplicate work.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

List every mutation caller and failure path; fall back to the tested adapter only if no newer-schema records were written.

## Integration handoff

Domain surfaces: money, inventory, identity, persistence, ui. Default next gate: [VERIFY-02](VERIFY-02.md).

The default gate assesses this build against **all 1 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-02` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-02.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-02 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
