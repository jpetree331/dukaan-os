# BUILD-30 — Encrypted local vault and key lifecycle prototype

Status: **planned**. Track: Optional privacy. Conditional scope: requires D10; not part of the core product commitment.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Encrypted exports do not protect a copied locked browser database.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-04](VERIFY-04.md), [VERIFY-25](VERIFY-25.md).
- Decision records: [D10](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

If stronger at-rest privacy is selected, prototype a versioned encrypted repository, random data key, passphrase wrapping, lock/unlock memory lifetime and explicit recovery/rotation design using standard crypto.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `repository encryption adapter`; `auth`; `backup`; `threat model`.

Out of scope: Claiming protection against a compromised unlocked browser or using a four-digit PIN as the sole encryption secret.

## Acceptance contract

Locked storage dump contains no business plaintext; wrong key, corrupted ciphertext and interrupted rotation fail safely; unlocked limitations and recovery loss are demonstrated.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Disabled prototype only until independent crypto/design review and VERIFY-31 migration evidence. Do not retrofit encryption by changing one global password parameter.

## Integration handoff

Domain surfaces: identity, schema, persistence, recovery, release. Default next gate: [VERIFY-30](VERIFY-30.md).

The default gate assesses this build against **all 29 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-30` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-30.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-30 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
