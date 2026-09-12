# BUILD-27 — Marathi pack and task validation

Status: **planned**. Track: Regional expansion.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

The first regional pack should prove the reusable workflow with native feedback.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-26](VERIFY-26.md).
- Decision records: [D05](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add reviewed Marathi UI/errors/receipts/help and product alias fixtures; capability-aware speech/TTS selection; one bounded round of native-speaker corrections.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `locale packs`; `alias fixtures`; `receipts`; `pilot evidence`.

Out of scope: Inferring language quality from string-count parity.

## Acceptance contract

A Marathi-speaking reviewer completes sale, collection, return, lock, backup and printer tasks; no missing critical strings, wrong quantities or unsupported-speech claims.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Use explicit translation provenance and reviewer consent; missing native review leaves the language experimental.

## Integration handoff

Domain surfaces: locale, ui, money, inventory, receipts, recovery. Default next gate: [VERIFY-27](VERIFY-27.md).

The default gate assesses this build against **all 26 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-27` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-27.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-27 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
