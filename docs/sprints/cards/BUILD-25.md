# BUILD-25 — Cloud operations and two-device pilot

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

A correct protocol still needs recoverable operations and observable failures.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-24](VERIFY-24.md).
- Decision records: [D01](../DECISIONS.md), [D07](../DECISIONS.md), [D08](../DECISIONS.md), [D09](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add redacted operational logs, request/operation correlation, health checks, backup/restore runbook, release/migration order and environment separation; conduct a controlled two-device pilot.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `backend operations`; `docs/pilot`; `release tooling`; `browser integration`.

Out of scope: Unbounded telemetry, customer payload logs and a production launch without the pilot gate.

## Acceptance contract

Backend outage, credential expiry, schema mismatch, restore drill and delayed acknowledgements produce understandable states; accepted records converge and exception records remain accountable.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Provider backup features, costs, region and retention must be verified on the chosen plan. Emulator success is not deployed-environment evidence.

## Integration handoff

Domain surfaces: money, inventory, identity, schema, persistence, recovery, release, ui, reports. Default next gate: [VERIFY-25](VERIFY-25.md).

The default gate assesses this build against **all 24 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-25` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

This is also a cumulative milestone: run all applicable higher-order shop journeys, not only this feature's tests.

## Required pushed report

Create `docs/sprints/reports/BUILD-25.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-25 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
