# BUILD-24 — Conflict resolution and existing-shop onboarding

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Rejected operations and existing local books need explicit ownership and reconciliation.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-23](VERIFY-23.md).
- Decision records: [D08](../DECISIONS.md), [D09](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add owner exception review, corrective commands and resumable local-to-cloud onboarding with counts/checksums/checkpoints; map identities, deduplicate imports and preserve pending work; preview what will upload.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `sync conflict UI`; `backend migration`; `backup adapter`; `reports`.

Out of scope: Automatically selecting a financial winner or erasing rejected commands.

## Acceptance contract

Restore an old backup then reconnect, import the same shop twice, resolve a revoked cashier's pending sale and resume a failed onboarding; no silent rollback or duplicate money.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Cloud-linked restore must reconcile through commands, never replace cloud history. Abort onboarding by pausing it; retain source and reconciliation evidence.

## Integration handoff

Domain surfaces: money, inventory, identity, schema, persistence, recovery, reports, ui. Default next gate: [VERIFY-24](VERIFY-24.md).

The default gate assesses this build against **all 23 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-24` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-24.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-24 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
