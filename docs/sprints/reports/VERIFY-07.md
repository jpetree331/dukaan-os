# VERIFY-07 — Return, settlement and cumulative integration gate

Verdict: **passed for implemented return workflows after separate repairs, self-verified**. Build `bdaa4bca5e8f000d13cf2034802c1f37603a036b`, pushed build/report `06f9b20fe406079c91ecd132ffd9507e23d3997f`; repaired runtime **`f047626f026af7a6ffac32a580659ed61bd9b426`**. Date: 11 September 2026.

## Findings and separate repairs

1. A crafted import could duplicate a linked customer compensation while adjusting the projected balance, or increase a return's refundable value despite debt cancellation. The duplicate case was reproduced as a failing test. The repair rejects repeated source links and recomputes refundable value from the customer balance immediately before the return.
2. Ten four-decimal returns exposed negative zero in a zero cost/quantity result. The shared rounding helpers now normalize only negative zero; they continue to propagate invalid numeric values for rejection.

Both changes are in the separate repair commit above. All gates below ran on that runtime.

## Evidence

- **68 module tests passed**. New verification cases cover paise distribution `[0.01, 0, 0.01]`, ten 0.0001-quantity returns conserving money/cost/stock, next-day negative sales/tax and cash reporting, spent-credit refund limits, failed-settlement rollback, encrypted return/ledger recovery and malformed imported compensation rejection.
- **57 browser groups passed**: six return/refund, six customer-ledger, eight draft, 12 baseline, nine native repository and 16 migration groups. Disposable Edge 152.0.4191.66 profiles only.
- Return browser verification adds migration/reopen, native replay equality and fresh-profile encrypted recovery of return/refund records, cash and quarantined stock. Existing old-client fencing, role/store restrictions, durable UI, receipts and backups remain passing.
- Public build `da44cf5849d01aafcac5`; plan and diff checks pass. Final diff reviewed: command/validation changes, compensating records, stock quarantine, receipt actions, net report/date treatment, signed charts and public module inclusion. No payment-provider action or migration activation.

## Every prior build

| Pair | Assertions on the repaired runtime |
| --- | --- |
| 01-07 | Original discounted/taxed sale returns in exact cumulative paise; fractional stock/cost and full loyalty restoration conserve original values. Tiny final residues do not over-refund. |
| 02-07 | Failed return and failed settlement restore the exact prior book; same-ID retry does not repeat money/stock effects. Existing delayed UI and locked-write gates pass. |
| 03-07 | Native return/refund journeys commit and replay together; reopen retains liability and quarantine. Existing atomic abort/CAS/quota tests rerun. |
| 04-07 | Compensating records survive migration and encrypted restore to a fresh profile; prior staged recovery and old-client refusal remain passing. |
| 05-07 | Return values follow original receipt/line snapshots after price changes; remaining quantities prevent returning the same units twice. Draft retry, receipt identity and account/store isolation suites rerun. |
| 06-07 | Credit-sale returns cancel debt before creating refundable credit; earned/redeemed points reverse, spent credit caps payment, and refund movements reconcile to customer statements and cash. Duplicate linked movements/imported liability inflation reject. |

All 15 older pairs were reopened and rerun through the named suites because financial, stock, schema and shared rounding contracts changed. **21 pairs passed; 444 future pairs planned.** No N/A waiver. Current checkout/return/settlement/restore/lock journeys pass; unbuilt supplier corrections, transfers, formal shifts and cloud portions remain future work.

## Carried-forward requirement and limits

Formal shift close is not implemented until BUILD-11. Existing count preservation and settlement-date independence pass here; **SEAM-07-11 must still execute a refund after a formal close and prove that the closed shift stays unchanged while the payment belongs to the later shift**. This requirement is carried into VERIFY-11, not treated as tested or waived.

Remaining runtime failures: **None**. Independent reviewer: **None**. Unsupported legacy allocations preserve the original records and require owner reconciliation. No physical power-loss, printer, bank-settlement or production evidence is claimed. Real-data storage migration still awaits independent review. Push this gate separately, verify remote SHA, then begin BUILD-08.
