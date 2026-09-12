# BUILD-20 — Atomic server command processing

Status: **planned**. Track: Cloud.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Replication must submit validated operations rather than overwrite full shop snapshots.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-19](VERIFY-19.md).
- Decision records: [D02](../DECISIONS.md), [D03](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Implement server-side atomic command validation and commit for the accepted local command catalogue; idempotency key plus payload fingerprint, authoritative versions, immutable audit events and deterministic responses.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `backend command handlers`; `database constraints`; `shared domain contracts`.

Out of scope: Client-owned authoritative totals and direct browser writes to protected projections.

## Acceptance contract

Duplicate retry returns the same result; reused key with changed payload is rejected; forged price/role/store/tax/quantity and transaction abort leave no partial effects; replay cannot duplicate stock or cash.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Maintain golden parity fixtures between local preview and authoritative results. Server audit retention is defined before production use.

## Integration handoff

Domain surfaces: money, inventory, identity, schema, persistence, reports. Default next gate: [VERIFY-20](VERIFY-20.md).

The default gate assesses this build against **all 19 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-20` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-20.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-20 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
