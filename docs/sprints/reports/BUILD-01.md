# BUILD-01 — Domain contracts and reference fixtures

Status: **built-unverified at this build checkpoint**. Code: `9a78653294b03bede1ae2242607fb1e3159c3ddc`. Predecessor VERIFY-00 remote confirmed at `fb7e7b917d989fda34c4bd31c50e998e8680cc75`. Date: 11 September 2026.

## What changed and why

Extracted the sale calculator into dependency-free `js/domain.js`, retaining the existing cart API and historical persisted invoices. Integer paise provide explicit subtotal/discount/tax reconciliation. Four-decimal quantities now survive stock arithmetic and POS accumulation. New sale and void commands carry identity/time metadata and correction links; receipt dialogs hold frozen copies. The public and service-worker asset lists include the new module in load order.

The [domain contract](../DOMAIN-CONTRACT.md) records D02 semantics, limits, old-record compatibility and recovery. Five new test groups use the independently calculated reference cases, exercise exact stock/points voids, tiny-line allocation, invalid quantities and failed persistence with previously committed command metadata.

## Actual builder verification

- `npm test`: **41 passed, 0 failed** (36 previous + 5 new).
- `npm run build`: passed, version `c4ee11954ab264ff9f77`.
- `npm run plan:check`: passed before the report/status-only update; all 465 future pairs remain planned.
- `git diff --check`: passed.
- Browser rerun belongs to the following VERIFY-01 gate; not claimed here.

## Deviations and defects addressed

The extraction exposed two existing edge cases. Quantities accepted at 0.0001 were rounded to cents in stock changes; these now use their own scale. Multiple one-paise lines could allocate a negative taxable base to the final line; backwards bounded residual allocation now preserves nonnegative bases and exact totals. Both have regression cases. Inventory editing/import and purchase prevalidation were included because they share the same quantity contract; leaving them at two decimals would lose stock on a later edit.

No database migration or complete immutable-storage conversion occurred. v2 remains mutable internally for compatibility; immutable receipt copies and command-envelope definitions are the bounded foundation. Append-only book storage is later scope. No failures remained in builder checks. Independent review: **None**; this is implementer verification.

## Data, rollback and remaining work

New bill metadata only; backup/database version remains 2. No existing records rewritten. New four-decimal records must not be processed by an old client that rounds quantities to two decimals. Keep the profile and encrypted backup when changing real counters; Git rewind alone does not undo book data. More precise historical quantity values remain readable but cannot enter a new command without explicit correction.

No numbered earlier build pair is due here; pre-plan tests are the baseline seam. Full authorization/idempotency, async persistence, storage migration, new local workflows and all later features remain unimplemented. No merge, deployment or paid resource created. Code and this report are pushed separately from VERIFY-01; a passing build suite is not the verification gate.
