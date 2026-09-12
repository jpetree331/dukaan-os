# BUILD-23 — Bounded offline stock authority

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Two disconnected tills cannot both assume they own the last unit.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-22](VERIFY-22.md).
- Decision records: [D03](../DECISIONS.md), [D09](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Implement the approved per-device offline stock allocation/authority model, online atomic reservations and device epochs; define privileged online-only operations and observable stock availability.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `backend stock authority`; `sync`; `checkout`; `inventory UI`.

Out of scope: Reclaiming unreachable-device stock without reconciliation or trusting a client clock as a security boundary.

## Acceptance contract

Two devices race for last stock, exhaust offline allocations, reconnect in both orders, retry after revocation and recover a lost device; no duplicated allocation or unaccounted movement.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Default proposal: bounded offline allocations, with no automatic reclaim while a device is unreachable. Until approved and verified, concurrent offline selling remains disabled.

## Integration handoff

Domain surfaces: money, inventory, identity, persistence, recovery, ui. Default next gate: [VERIFY-23](VERIFY-23.md).

The default gate assesses this build against **all 22 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-23` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-23.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-23 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
