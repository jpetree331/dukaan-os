# BUILD-05 — Resumable drafts and immutable sale records

Status: **planned**. Track: Local workflows.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

An interrupted cart should be recoverable while historical receipts must not follow later settings.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-04](VERIFY-04.md).
- Decision records: [D02](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Persist drafts by shop/store/staff/device; version price/quantity selections; finalize through one command; snapshot receipt identity, tax, units, discounts, loyalty and batch cost; define returnable quantities.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/pos.js`; `js/core.js`; `js/ui.js`; `repository`.

Out of scope: Returns, payment verification and cross-device shared drafts.

## Acceptance contract

Crash before and after checkout, resume a stale-price draft, switch role/store, change shop settings, then reprint: no duplicate bill and no changed historical amount.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Keep draft and finalized transaction identities distinct; recovery never finalizes a draft automatically.

## Integration handoff

Domain surfaces: money, inventory, identity, persistence, receipts, ui. Default next gate: [VERIFY-05](VERIFY-05.md).

The default gate assesses this build against **all 4 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-05` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-05.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-05 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
