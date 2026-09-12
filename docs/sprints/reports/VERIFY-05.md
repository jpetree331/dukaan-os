# VERIFY-05 — Draft lifecycle and cumulative integration

Verdict: **passed, self-verified**. Runtime code `1e43d8fa2f850e97547c92a4dc05cff31243aae5`; pushed build/report `da290b9cf9208ac7f63abcbd5e2976b7f9a12cfa`. Date: 11 September 2026. Disposable profiles, Edge 152.0.4191.66.

## Evidence and adversarial review

- **54 module tests passed**, including a new delayed-draft/lock test. Revoking the context before commit leaves the prior book byte-equivalent, hides the transient cart, and restores its durable quantity after unlock.
- **Eight draft browser groups passed**. Added verification checks switch staff and store, confirm neither inherits the owner's cart, return to the owner/store, migrate the draft, enable/disable login, then reload and recover the original draft ID. Both starting storage modes pass.
- Existing suites rerun: **12 baseline browser groups, nine native IndexedDB groups, 16 migration groups**. No runtime repairs needed by this gate.
- Public build `d24534752369a43a07c1`; plan and diff checks pass. Reviewed code paths cover cart edits, transient clearing, checkout, account transfer, schema validation, receipt rendering and backup compatibility. UI rendering itself never writes a draft.

## Every prior build

| Pair | Recipe evidence and result |
| --- | --- |
| 01-05 | Domain/tax/quantity: existing mixed-tax reference and fractional stock tests pass; a 1.25-unit sale totals 125 and leaves stock 8.75. Stale price/tax/unit selection rejects before effects. Original receipt identity, currency, units and allocations survive later changes. |
| 02-05 | Awaited persistence: failed sale keeps the draft and stock; failed edit keeps the prior revision. Locked delayed save cannot commit; delayed UI checkout cannot duplicate or display an early receipt. |
| 03-05 | Native transactions: UI resume and exactly-once finalized-draft retry run against disposable IndexedDB. Bill, stock and draft consumption survive reopen together. Existing native abort, CAS, quota and replay tests remain passing. |
| 04-05 | Migration/identity/recovery: a saved draft survives cutover, explicit login namespace remapping, disable-login and reload under its original staff/store/device. Account/store isolation holds. Existing archive/fence/restore/old-client tests pass with the extended validator. |

All six earlier-to-earlier pairs were reopened and rerun through the domain, async, baseline, native and migration suites because the book schema and mutation paths changed. **Ten pairs passed, 455 future pairs planned**; no N/A waiver. Higher-order supported journeys combine checkout, void, lock, migration, restore and login; future returns/transfers/cloud portions are not claimed.

## Recovery, deviations and delivery

No test auto-finalizes a recovered draft. A saved draft remains before commit; a finalized sale has no active draft afterward, and its retry returns the same bill. Exact receipt canvas pixels and text match before/after settings changes in both browser storage modes. Reloads represent restart checks, not physical power loss.

Failures requiring runtime repair: **None**. Independent reviewer: **None**. Cross-device draft takeover, physical printer output and missing historical receipt identity remain outside this increment. Real-data migration still awaits its independent review. Older readers reject the optional draft collection; preserve compatible backups rather than treating a Git rewind as data rollback.

Push this gate separately and verify remote SHA. BUILD-06 is eligible after the push. No merge or deployment is implied.
