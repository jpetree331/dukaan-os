# BUILD-28 — Tamil pack and task validation

Status: **planned**. Track: Regional expansion.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Tamil layout and recognition need their own evidence.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-26](VERIFY-26.md).
- Decision records: [D05](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Add reviewed Tamil UI/errors/receipts/help and aliases; verify glyph coverage, wrapping, quantity formatting and speech fallback.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `locale packs`; `alias fixtures`; `receipts`; `pilot evidence`.

Out of scope: Assuming Marathi validation transfers to another language.

## Acceptance contract

Repeat the shared task set in Tamil, including narrow printer output, long product names and offline fallback; compare canonical results to English/Hindi.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Keep the same pack interface and independent enablement; unresolved glyph or meaning defects block this locale only unless shared code changed.

## Integration handoff

Domain surfaces: locale, ui, money, inventory, receipts, recovery. Default next gate: [VERIFY-28](VERIFY-28.md).

The default gate assesses this build against **all 27 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-28` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-28.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-28 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
