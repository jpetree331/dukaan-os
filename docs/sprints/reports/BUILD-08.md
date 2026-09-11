# BUILD-08 — Supplier corrections and credit notes

Status: **built-unverified at build checkpoint**. Runtime `b19f8269b4ae25114e14c37c18bd2722d304789a`; predecessor verified remote `b63352575552fdd6e15b953bfb7ff129f7ab4f1e`. Date: 11 September 2026.

## Changes and reasons

New purchases snapshot item names, allocated paise values, command identity and individual batch provenance. Later payments can reference a purchase. Supplier balances derive from a disclosed opening checkpoint and subsequent movements, with complete statement CSV. Original paid-on-receipt amounts remain intact; “linked paid” includes later explicitly linked payments.

Owner return/cancellation commands remove only attributable stock still held, preserving consumed batches and original cash facts. Returned customer goods retain purchase attribution; quarantine is removed first when returning to a supplier. Cancellation requires the whole original receipt and no prior supplier return. Returns reduce debt or establish credit; a separate referenced cash/UPI receipt records refunds already received. Reasoned balance corrections change neither cash nor stock. Account, payment, return, refund, cancellation and downloadable credit-note controls expose these operations. [Policy and compatibility](../SUPPLIER-CORRECTIONS.md).

## Actual builder evidence

- **72 module tests passed**. The 600 receipt / 200 cash initial payment / 100 UPI payment / four-unit sale / six-unit return / 60 cash supplier refund produces zero supplier balance, zero stock, sales cost 240, profit 160 and expected cash 260. Retries are exactly once. Paid/unpaid duplicate cancellation, consumed-stock rejection, fractional paise allocation, customer quarantine attribution and failed-commit rollback pass.
- **Six browser groups passed** in disposable Edge 152.0.4191.66 profiles: receipt/payment/return/note/refund UI in both storage modes, migration/replay and fresh-profile encrypted restore. Final UI/runtime was rerun after the purchase-history label change.
- Visually inspected the synthetic supplier account at 1280×720: movement signs/running balance, linked payment total, credit note and refund action are readable. A temporary success toast overlaps part of the footer; it is dismissible/transient. No mobile or physical-printer claim.
- Public build `5766b6abfaba937541b2`; plan structure and whitespace checks passed.

## Limits, deviations and next gate

Unsupported historical batch attribution yields an explicit exception; a reasoned supplier correction repairs only the balance. Physical-stock reconciliation belongs to BUILD-09. Credit is fungible at supplier-account level, without inferred historical invoice allocation. New root collections/version markers deliberately refuse older strict readers; Git rewind does not restore old-format data. Encrypted checkpoints and original records are preserved.

Failed final checks: **None**. Independent review: **None**. No supplier contact, real purchase, bank transfer, production deployment or real-data migration activation. VERIFY-08 must independently exercise adversarial inputs in a separate pass, assess all seven new pairs and reopen the prior 21 pairs affected by shared stock/money/persistence contracts. Push this build/report, verify its remote hash, then run that gate.
