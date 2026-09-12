# BUILD-31 — Vault migration and end-to-end recovery

Status: **planned**. Track: Optional privacy. Conditional scope: requires D10; not part of the core product commitment.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Encryption is incomplete while plaintext migration or recovery copies remain.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-30](VERIFY-30.md).
- Decision records: [D10](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Implement recoverable conversion of every owned primary/journal/draft/outbox/recovery copy; explicit plaintext-copy retirement after verification; integrate key rotation, backup and cloud-cache lifecycle.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `repository migration`; `auth`; `backup`; `cloud cache`; `release tooling`.

Out of scope: Automatic destruction of unowned legacy copies or promising recovery without a retained key.

## Acceptance contract

Interrupt every conversion phase, restore and rotate keys, lose credentials, revoke a device and roll forward after new sales; no forgotten owned plaintext copies or lost commands.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Optional release only after independent review, target-device performance and a documented key-loss/recovery drill; never downgrade new encrypted records into an old plaintext snapshot.

## Integration handoff

Domain surfaces: money, inventory, identity, schema, persistence, recovery, release, ui. Default next gate: [VERIFY-31](VERIFY-31.md).

The default gate assesses this build against **all 30 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-31` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

This is also a cumulative milestone: run all applicable higher-order shop journeys, not only this feature's tests.

## Required pushed report

Create `docs/sprints/reports/BUILD-31.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-31 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
