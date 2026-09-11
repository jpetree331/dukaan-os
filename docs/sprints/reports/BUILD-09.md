# BUILD-09 — Stock adjustments and expiry write-offs

Status: **built-unverified at build checkpoint**. Runtime `166fc454df8fa3ef709417406fa95abb8b46d9ce`; predecessor verified remote `33fc80ad0b9f95a90220f143382e36e3a7c6e938`. Date: 11 September 2026.

## Changes and reasons

Added owner counts, found-stock additions and expired/damaged disposal by selected batch, recording actor/reason, prior/new quantities, batch cost and purchase attribution. A stock fingerprint rejects stale modal counts. Linked reversals append compensating movements and preserve quarantine/expiry; a reversal cannot remove goods already consumed. History exposes signed cost values, reversal links and all-record CSV. [Detailed policy](../STOCK-ADJUSTMENTS.md).

Existing item editing directs stock changes through counting. CSV retains undated-stock update behavior by staging a disclosed count movement in the same save as all rows; a failed import preserves both histories and stock. Batch counts remain explicit. Counts and disposals do not automatically change cash, customer/supplier balances or sales profit.

## Actual builder evidence

- **78 module tests passed.** Starting with five undated units, counting to four, adding/discarding two expired units, selling/returning a damaged unit and disposing/reversing it leaves physical four, sellable three and quarantine one. Original costs remain 20/30 as appropriate. Sale/return net cost is zero and unrefunded cash remains 100.
- **Six browser groups passed** in Edge 152.0.4191.66 disposable profiles: actual disposal/count/reversal controls, full CSV and restart on both storage modes, migration/journal equality and fresh-profile encrypted restore.
- Visually inspected the desktop adjustment history: reasons, signed quantities/value, physical before/after, actor, reversal marker and CSV are readable. No phone or printer inspection claimed.
- Release `71746cd54202b49dcd9d`; plan and diff checks passed.

## Corrections during building and limits

The initial stock summary omitted expired-but-not-quarantined goods; tests exposed the mismatch and the final model has four reconciled classes (physical = sellable + quarantine + expired non-quarantine). Initial blanket refusal of existing CSV counts broke established regression contracts; undated CSV counts now append atomic adjustment records instead. A browser selector initially matched a closing modal; it now targets the current modal. Final checks pass.

No reconstructed historical full stock ledger or automatic expense classification is claimed. Initial item quantities, existing restocks, purchases and sales keep their prior histories. The new optional adjustment collection fences old readers and travels through compatible encrypted checkpoints. Reversal, not database rollback, is the correction path. Independent review: **None**. No physical disposal, purchase, payment, production action or real-data migration activation occurred. VERIFY-09 must assess eight new pairs and reopen 28 earlier pairs before BUILD-10.
