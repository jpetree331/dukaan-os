# VERIFY-08 — Supplier corrections and cumulative integration

Verdict: **passed after a separate repair, self-verified**. Build `b19f8269b4ae25114e14c37c18bd2722d304789a`; verified build/report remote `4ac289f5cfc6fd21861d2db7025f476a0d871bd4`; final repaired runtime **`a70c97333a29289e92663ecd963d34a10d49babe`**. Date: 11 September 2026.

## Findings and actual evidence

A crafted import omitted the purchase movement and changed the projected balance to match the remaining ledger. A failing test reproduced the missing reciprocal check. The separate repair now requires modern purchases, initial payments and command-tagged later payments to have their source movements, and rejects cancellation flags without an actual cancellation return. Two test-fixture errors were also corrected: passing options in the payment-mode position and setting the store in session instead of settings. Neither was an application defect.

- **75 module tests passed** on the final runtime. Added verification covers source omission, fabricated cancellation, supplier credit consumed by later purchases, failed-refund atomicity, changed operation-ID requests and owner/store boundaries.
- **63 browser groups passed** on that runtime: supplier 6, customer returns 6, customer ledger 6, drafts 8, baseline 12, native repository 9 and staged migration 16. All used disposable local Edge 152.0.4191.66 profiles and synthetic records.
- Public release `e5c74238bc47fa7dc876`; whitespace and plan checks pass. Reviewed code, public module inclusion, schema validation, test fixtures, UI and report formulas. No live external services used.

## All seven new pairs

| Pair | Concrete evidence |
| --- | --- |
| 01-08 | Whole-purchase paise allocation reverses exactly, including two 0.3333 quantities at 0.01 cost; four-decimal stock and immutable original purchase totals remain consistent. |
| 02-08 | Purchase/return/payment operation retries do not repeat effects; failed supplier return and refund restore the exact prior book, and existing delayed UI/lock gates pass. |
| 03-08 | Supplier UI runs on native IndexedDB; records and movement projections equal journal replay after restart. Native atomic/CAS/abort regressions pass. |
| 04-08 | Both storage origins migrate/reopen and restore encrypted supplier histories into fresh profiles with balance zero/cash 260. Staged interruption, old-client fencing and source-preservation suites rerun. |
| 05-08 | New purchase batches are consumed by sales without changing original receipts or drafts. Draft resume/idempotency, receipt pixel identity and account/store isolation pass after batch-attribution changes. |
| 06-08 | Customer and supplier movement collections remain separate; customer statement/collection/advance/correction and cash suites pass alongside supplier receipts/refunds. The combined cash projection includes supplier refund 60 once. |
| 07-08 | Customer-returned quarantine retains purchase attribution; supplier return removes quarantine first, leaving physical/sellable stock one. Sale-return/refund tax, loyalty, customer credit and cash regressions pass. |

All 21 older pairs were reopened because shared stock, cash and validation paths changed, and were re-exercised by the listed suites. **28 pairs passed; 437 future pairs planned.** No N/A waiver. The whole receipt → partial payment → sale → supplier return → credit refund → restart/restore journey reconciles to supplier zero, physical stock zero, cost 240, profit 160 and cash 260.

## Limits and handoff

Remaining runtime failures: **None**. Independent reviewer: **None**. Historical purchases without verified batch provenance require explicit reconciliation. Physical stock adjustments follow in BUILD-09; formal cash-shift attribution follows in BUILD-11, including the carried SEAM-07-11 close/refund requirement. Real-data migration still awaits independent review. No real purchase, payment transfer, hardware certification or production deployment occurred. Push this report/repair as its own gate, verify the remote hash, then begin BUILD-09.
