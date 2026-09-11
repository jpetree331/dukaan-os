# BUILD-26 — Regional language-pack foundation

Status: **planned**. Track: Regional expansion.
Sizing target: 1–2 focused engineering days; split this card before exceeding 3. This is a slice budget, not a promised date.

## Why

Additional languages need formatting, aliases and fallback contracts rather than copied string tables.

## Entry conditions

- [VERIFY-00](VERIFY-00.md) establishes the current baseline.
- Required predecessor gates: [VERIFY-14](VERIFY-14.md), [VERIFY-15](VERIFY-15.md), [VERIFY-16](VERIFY-16.md).
- Decision records: [D05](../DECISIONS.md).
- Use a verified integration tree. Missing decisions/hardware block only work that depends on them; reordering requires the seam reassessment in [VERIFICATION](../VERIFICATION.md).

## Build scope

Generalize locale metadata, fonts, formatting and product aliases; translation completeness tooling and fallback; keep canonical IDs/numbers independent of language; scope initially to English/Hindi regression plus pack API.

Likely touch points (current files or proposed modules, not an instruction to create all of them blindly): `js/i18n.js`; `js/voice.js`; `receipts`; `language tooling`.

Out of scope: Declaring Marathi/Tamil/Bengali complete before reviewed packs exist.

## Acceptance contract

Changing locale does not change money, IDs, units, sync payloads or receipts; missing keys fall back safely; recognition/TTS support is capability-tested.

Commit success must remain durable, permissions must be checked at the action boundary, and all affected existing bug/security regressions must remain passing. Builder tests should use independently derived expected results.

## Compatibility and recovery

Keep packs versioned and independently disableable; translations never change persisted accounting semantics.

## Integration handoff

Domain surfaces: locale, ui, money, inventory, receipts, schema. Default next gate: [VERIFY-26](VERIFY-26.md).

The default gate assesses this build against **all 25 earlier numbered builds**, plus the pre-plan baseline. This list is not limited to directly shared files. See all rows whose later build is `BUILD-26` in [the seam matrix](../SEAM-MATRIX.md). Later builds will add this feature to their own verification. Shared-contract changes also reopen affected older-to-older rows.

## Required pushed report

Create `docs/sprints/reports/BUILD-26.md` using the [build report template](../templates/BUILD-REPORT.md). Record what changed and why, actual tests and code hash, data/schema effects, deviations, failed or missing evidence, affected seams, recovery limitations and remote push verification. Mark **built-unverified** until VERIFY-26 passes. Follow [delivery rules](../DELIVERY.md); no merge or deployment is implied.
