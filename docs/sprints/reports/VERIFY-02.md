# VERIFY-02 — Awaited persistence and domain seams

Verdict: **passed, self-verified**. Date: 11 September 2026. Pushed build/report checkpoint `02c85b2cc7aa5a5e2dafd2c47fe91075ac3b09e4`; runtime code `f89d5f602de069f3d3f2e0c531d72f7c6cfbee4a`. Compared with verified BUILD-01 `a286362458bd9ecb89ae6ab36f5e2620e75675a4`. Windows / headless Edge 152.0.4191.66 / disposable records.

## Exact acceptance and seam evidence

All **49 module tests passed**. The entire domain suite now uses the awaited public API: M01 remains total 200.70, points 20 → 12 → 20, exact stock reversals, M02 paise allocation and Q01 four-decimal preservation. Two thousand deterministic varied baskets still conserve money. Legacy invoices remain unchanged across reload; command/correction metadata survives. Earlier quota/stale-writer/role/backup regressions pass.

**SEAM-01-02** — BASE, MONEY, STOCK, AUTH:

- BASE: `tests/browser-baseline.cjs` completes sale → reload → void and fresh-profile encrypted restore through current UI; corrupt/wrong-password/malformed inputs preserve records.
- MONEY/STOCK: `tests/domain.test.cjs`, `tests/domain-verification.test.cjs` and `tests/async-storage.test.cjs` combine versioned calculations with delayed commit and rejection. All six money/stock commands plus settings retain exact old book/storage on rejected I/O. Duplicate pending sale does not add stock/money effects.
- AUTH: pending commands deny account switching; locking before commit rejects without writing. Failed login migration retains its source and leaves the gate off. Cashier restrictions and password/PIN gates still hold.

The **12 browser groups passed**, including two explicit async UI probes. A delayed sale leaves old stock visible, no receipt, a busy shell and no navigation; the second charge click has no effect. After release exactly one new bill exists. A delayed rejected customer collection leaves balance 100, displays the error, and retains an enabled keypad for retry. No uncaught page errors in the primary/restored profiles. Fixtures use API setup; named UI paths use actual DOM controls.

`npm run build` passed at `dfa3b24fd3c4118197d6`; plan check passed. Final diff review covered UI callback forwarding, post-save language/theme/reconciliation, startup lifecycle registration, migrations and public assets. Only this verification's additional browser scenario and documentation/status records change after the tested runtime commit.

## Prior evidence and limits

The BUILD-01 suite was rerun because persistence changed its contract; the passing results above supersede earlier synchronous execution evidence. There are no older-to-older pairs to reopen. One of 465 pair rows is now passed; 464 future combinations remain planned, never inferred passing from this result. Higher-order journeys run only their implemented sale/void/payment/restore/lock portions.

Failures requiring a runtime repair during this verification: **None**. Independent reviewer: **None**. Physical phone, installed PWA, screen reader, speech/camera and printer checks remain unavailable. Multi-key credential/book migration is not an atomic cross-store transaction; browser termination after a physical write and before acknowledgement is not solved. These remain explicit future journal/migration obligations, not waivers of the tested single-write contract.

Eligible next: BUILD-03 prototype repository, with activation disabled until migration gates. Push this verification separately and compare its remote SHA. No merge, deployment, provisioning or real customer data changes.
