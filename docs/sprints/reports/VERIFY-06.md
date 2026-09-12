# VERIFY-06 — Customer ledger and fifteen cumulative seams

Verdict: **passed after a separate validation repair, self-verified**. Original build `e30588d4b08b2a94f83d110c85e1fad0c81a0092`, pushed build/report `28d59cdc2d32c2c11fc720e1f92d1ab7c2391610`; repaired runtime under this gate **`fd24ef8a3eff289d69c2f0d02bc2ad20b8ce6586`**. Date: 11 September 2026.

## Finding and repair

Sum-only ledger validation allowed a malformed imported entry and its projected balance to be changed together without detecting disagreement with the underlying bill/payment. The separate repair commit now validates sale/void deltas against their credit bill, collection/advance amounts and methods against their payment, and correction reasons. Negative tests change both delta and projection and confirm rejection. This was an internal consistency issue; it does not establish authenticity of user-supplied financial history.

## Actual verification

- **60 module tests passed** on the repaired runtime. Added cases cover invoice-specific limits despite larger customer debt, operation-ID reuse across customers, exactly one debt entry on a draft retry, encrypted ledger restore and linked-record mismatch rejection.
- **Six ledger browser groups passed**, including actual BUILD-05 old-client refusal with byte-preserved source and native journal replay equality after the complete UI journey.
- **Eight draft, 12 baseline, nine native repository and 16 migration browser groups passed** on the repaired runtime. Total: **51 browser groups**, using disposable Edge 152.0.4191.66 profiles.
- Build `792830d3175eb474a57e`; plan structure and whitespace checks pass. Reviewed final diff, optional ledger/version fields, linked payment history, method controls, complete exports and reader compatibility. No hidden migration activation or external service added.

## Every prior build and reopened evidence

| Pair | Expected / actual evidence |
| --- | --- |
| 01-06 | Independent paise example ends at -15 credit and cash 140; legacy opening 25 plus sale 100 minus payment 20 minus void 100 ends at 5. Existing mixed-tax/quantity calculations still pass. |
| 02-06 | Failed advance preserves the exact prior book; duplicate collection preserves it too. Existing delayed/rejected collection UI remains open for retry and shows no false success. Cashier correction and foreign-store actions reject. |
| 03-06 | Both storage modes run the actual ledger UI; native replay equals its final projection. Native rollback/concurrency cases rerun against this validator. |
| 04-06 | Encrypted restore preserves ledger entries and balance; version omission rejects. Actual previous client refuses the marked legacy key without changing it. All staged migration and recovery cases pass with ledger-backed credit sales. |
| 05-06 | A resumed/persisted credit-sale draft and identical retry produce one bill and one debt entry. Draft isolation, login remapping, stale-price rejection and immutable receipt rendering rerun. |

The ten earlier pairs were reopened because schema and shared financial commands changed; all relevant domain/async/native/migration/draft suites reran. **15 pairs passed, 450 future pairs planned**; none waived as N/A. Supported checkout/void, collection, lock, backup and migration journey portions pass. Returns, transfers, formal cash shifts and cloud journeys remain future work.

## Limits and next step

Remaining failures: **None**. Independent reviewer: **None**. Legacy balances are disclosed checkpoints, not reconstructed accounting history. Bank settlement, physical power loss, field-device capacity and production migration remain unverified. Customer balance CSV and complete purchase/payment-history CSV remain separate, complete exports.

Push this report and repair separately from BUILD-06; verify remote SHA. BUILD-07 may begin after this gate. No deployment, merge or real-data cutover was performed.
