# BUILD-07 — Partial returns and recorded refunds

Status: **built-unverified at build checkpoint**. Runtime code `bdaa4bca5e8f000d13cf2034802c1f37603a036b`; predecessor VERIFY-06 remote `26ac9500d9bef3dca60e0241fff9f6a391c0369b`. Date: 11 September 2026.

## Changes and reasons

Added sale-linked partial returns with cumulative quantity limits, original taxable/tax/discount and batch-cost allocation, proportional loyalty reversal, operation-ID retries and explicit legacy-data exceptions. Goods can be restocked or placed in quarantined batches that checkout excludes. Returning does not rewrite the sale; subsequent void is denied to prevent a second reversal.

Returns reduce credit-sale debt or create named customer credit/refund liability according to the documented destination. Separate cash/UPI settlement records payments already made, with references and liability/credit limits. Original receipts expose owner return/refund controls, prior returns and downloadable return notes. Net sales, tax, cost and cash reports include the compensating records on their actual dates; signed charts can display net-return periods. [Detailed policy and arithmetic](../RETURNS-AND-REFUNDS.md).

## Builder evidence

- **63 module tests passed** on the final runtime. The 168 discounted/redemption credit-sale fixture returns in two 84 portions, reverses tax 4 each, restores points from 31 through 40.5 to 50, and settles 16 cash plus 84 UPI after a 100 collection. Final customer balance is zero and cash is 84.
- **Two browser return/refund journeys passed** on the final UI, one per storage mode. A 189 cash sale returns one unit worth 94.50 with tax 4.50; quarantine preserves physical stock 9/sellable stock 8; recorded cash refund leaves 94.50 cash. Downloaded note, restart and report controls pass.
- Visually inspected the synthetic desktop return summary: readable amount, tax, recorded/available refund, quarantine explanation and actions. The initial plain-text presentation was replaced with the structured summary before the final check. No physical printer or mobile inspection claimed.
- Build `45539e64db52b6b630a2`; plan and whitespace checks pass. Baseline/migration suites also passed during development; VERIFY-07 will rerun all suites on the pinned final runtime.

## Deviations and remaining evidence

The acceptance card mentions refund after formal shift close, but formal shifts are BUILD-11. This sprint verifies separate settlement and preservation of the existing cash-count record. **SEAM-07-11 must execute the formal close/refund case later**; it is not claimed now. The working credit policy applies credit-sale returns against current customer debt first, and treats customer credit as fungible at account level; historical invoice allocation is not invented.

Incomplete/inconsistent historical tax or batch allocations reject with a preservation/reconciliation message. Automatic historical repair is not supplied. Optional root return/refund collections fence older readers; Git rewind is not a data rollback. Original receipt snapshots remain intact; return notes additionally show current settlement status.

Failed final checks: **None**. Independent review: **None**. No bank API, physical power-loss test, printer certification or real-data migration activation. VERIFY-07 must assess six new pairs and reopen all 15 earlier pairs affected by financial, stock, schema and reporting changes. Push build/report first and verify remote SHA.
