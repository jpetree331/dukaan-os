# VERIFY-09 — Stock adjustments and cumulative integration

Verdict: **passed after separate repair, self-verified**. Build `166fc454df8fa3ef709417406fa95abb8b46d9ce`; verified build/report remote `8318cc05f95a4b06c1866dcf0f45cbdf3ac92549`; repaired runtime **`9531a91066aed441444cea63154143bbaf4570b3`**. Date: 11 September 2026.

## Finding and evidence

A crafted import changed an undated quarantine disposal from “damaged” to “expired”. The runtime command rejected this, but import validation did not check the expiry when stock was quarantined. A failing test reproduced it; the separate repair requires an actual past expiry for every expired-disposal record while keeping quarantined stock in only one quantity class.

- **81 module tests passed**: malformed summary/reversal links, fractional CSV counts with original costs, failed CSV all-or-nothing persistence, role/store restrictions and changed-ID retries join the builder's expiry/count/quarantine/reversal journey.
- **69 browser groups passed** on that final runtime: stock adjustments 6, suppliers 6, returns 6, customer ledger 6, drafts 8, baseline 12, native repository 9 and migration 16. Disposable local Edge 152.0.4191.66 profiles only.
- Public release `4c0143c82ef5101bad2e`; diff and plan checks passed. Reviewed final changes, optional root schema, public-module lists, UI workflow, count/reversal semantics and existing CSV behavior.

## All eight prior-build seams

| Pair | Assertions |
| --- | --- |
| 01-09 | Four-decimal count 1.0001 → 1 → reversal 1.0001 conserves quantity; original cost 60 survives item-cost change to 100. Movement values and physical classes reconcile. |
| 02-09 | Failed adjustment and CSV commits preserve the exact prior book; identical retries do not repeat changes, stale modal fingerprints reject and delayed-write regressions pass. |
| 03-09 | Both native and legacy UI journeys commit counts, disposal and reversals; native journal replay equals projections and atomic/CAS failure suite passes. |
| 04-09 | Adjustment records and stock classes survive migration/restart and fresh-profile encrypted restore; interruption stages and old-reader fences remain passing. |
| 05-09 | Counts change available stock without rewriting sale/draft snapshots; checkout refuses unavailable/expired/quarantined stock. Saved draft/receipt identity and stale selection suites rerun. |
| 06-09 | Counts leave debt/credit/cash unchanged; customer balance/collection/advance/correction regressions pass with the new optional stock history. |
| 07-09 | Damaged customer return restores quarantine, disposal removes it, linked reversal restores quarantine at original cost; physical four/sellable three/quarantine one and cash 100 remain correct. |
| 08-09 | Count/reversal preserves purchase attribution and restores supplier-returnable quantity two without changing supplier debt 120 or cash. Supplier purchase/return/refund/recovery suites pass. |

All 28 older pairs were reopened and rerun through the named suites after shared inventory/CSV/schema changes. **36 pairs passed; 429 future pairs planned.** No N/A waiver. The higher-order receipt/sale/return/count/reversal paths conserve stock without rewriting financial events.

Remaining runtime failures: **None**. Independent review: **None**. Historical full-stock reconstruction, automatic expense classification, physical disposal and real-data migration activation are not claimed. Existing restocks and initial item quantities retain their established histories. The SEAM-07-11 formal-shift refund requirement remains pending BUILD-11. Push the gate separately and verify remote SHA before BUILD-10.
