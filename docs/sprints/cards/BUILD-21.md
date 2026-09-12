# BUILD-21 — Durable outbox and authenticated upload

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

A lost response must not mean a lost sale or a duplicate upload.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-20](VERIFY-20.md).
- Decision records: [D09](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Write operation payload and local effects atomically to an outbox; upload with retry/backoff, explicit acknowledgements and pending/rejected states; migrate legacy label-only queue entries as non-uploadable evidence.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `repository`; `sync adapter`; `status UI`; `auth`.

Out of scope: Incoming feed, automatic conflict resolution and rebuilding old queue payloads from guesses.

## Acceptance contract

Crash before send, after server commit and before acknowledgement; reauthenticate and retry; each operation applies once; rejection is retained for review and never labelled synced.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Feature stays on synthetic/test shops until inbound and concurrency gates pass. Rollback pauses transport while retaining every pending operation.

## Integration handoff

Domain surfaces: money, inventory, identity, persistence, recovery, ui. Default next gate: [VERIFY-21](VERIFY-21.md).

The default gate assesses this build against **all 20 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-21` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-21.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-21 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
