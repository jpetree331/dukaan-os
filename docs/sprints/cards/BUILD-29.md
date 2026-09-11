# BUILD-29 — Bengali pack and task validation

Status: **planned**. Track: Regional expansion.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Bengali support needs the same financial and recovery guarantees as every other locale.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-26](VERIFY-26.md).
- Decision records: [D05](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add reviewed Bengali UI/errors/receipts/help and aliases; verify script, numerals, pronunciation ambiguity and unsupported-device behavior.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `locale packs`; `alias fixtures`; `receipts`; `pilot evidence`.

Out of scope: A blanket claim that all regional speech works offline.

## Acceptance contract

Complete the shared Bengali task set and then rerun all enabled locales with sales, returns, sync, encrypted restore and printed receipts.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Cumulative regional release gate: a shared pack-engine change reopens affected Marathi, Tamil, Hindi and English evidence.

## Integration handoff

Domain surfaces: locale, ui, money, inventory, receipts, recovery. Default next gate: [VERIFY-29](VERIFY-29.md).

The default gate assesses this build against **all 28 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-29` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

This is also a cumulative milestone: run all applicable higher-order shop journeys, not only this feature's tests.

## Required pushed report

Create `docs/sprints/reports/BUILD-29.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-29 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
