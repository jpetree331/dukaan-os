# VERIFY-04 — Migration failure and cumulative storage gate

Verdict: **passed for continued development with migration disabled, self-verified**. Real-data cutover remains **blocked pending independent recovery review**. Runtime code `58ac83d4567bdfc50846828696dbcb03318ac256`; pushed build/report `c78598845bf6ef7b1aff8d5f8361a6b1dcda089a`. Date: 11 September 2026.

## Actual checks

- Module regressions: **50 passed, 0 failed** (`node --test tests/*.test.cjs`, the npm test script).
- Migration browser suite: **16 groups passed**. Verification adds foreign-target denial, archive quota failure, invalid marker, changed fence and missing destination, including startup rejection for the latter three. Preserved sources remain intact. The six-stage fixture also checks a 100 sale plus 5 GST: opening customer debt 50 becomes 155, points 10 become 11, stock 10 becomes 9, with one bill of 105. Later sales survive resume.
- Existing baseline browser suite: **12 groups passed**, including awaited UI sale, failed collection, credentials, backup and locked/stale access. No uncaught page errors in its primary and restored profiles.
- Native IndexedDB suite: **nine groups passed**, including concurrent CAS, native abort/quota injection, deduplication, replay and exact mixed-tax sale/void.
- Public build: `e1417b76194b2383d7af`. Plan structure and whitespace checks pass. The local npm shim was unavailable in the restricted shell; equivalent package-script Node entry points were used successfully.

All browser checks used headless Edge 152.0.4191.66 and disposable profiles. No real shop data was used. Reviewed runtime diff includes migration routing, account lifecycle, queue routing, checkpoint backup/import and public module inclusion. No automatic activation or production configuration was introduced.

## Every prior build and reopened pairs

| Pair | Expected and observed evidence |
| --- | --- |
| 01-04 | Money, stock and schema: each migration stage retains the independently calculated credit sale (105), debt (155), points (11) and stock (9). A later sale survives repeated resume and old-client refusal. Foreign-account targets reject before making a marker. |
| 02-04 | Awaited storage and recovery: archive failure releases busy state without changing source or creating a marker; later sale/restore/account transitions await routed commits. Existing delayed/rejected mutation and lock tests rerun. |
| 03-04 | Native repository: copied projection equals replay before fencing; interruption before/after fence resumes; missing destination rejects and retains archive. Actual pre-migration client cannot write the fenced book. Encrypted checkpoint restores in a fresh profile through file UI. |
| 01-02, 01-03, 02-03 | All previous domain, asynchronous and native-repository tests rerun on this runtime. Mixed-tax reference remains 200.70 and void restores original stock/loyalty. Concurrent writes and rollback preserve atomicity. |

Six implemented pairs pass; 459 future pairs remain planned. No N/A waiver. J01/J05/J07/J11 storage, backup, interrupted-write and lock portions run using supported workflows; unbuilt feature portions remain untested. See `tests/browser-migration.cjs`, `tests/browser-indexeddb.cjs`, `tests/browser-baseline.cjs` and module tests.

## Recovery and delivery

The [forward-recovery decision table](../MIGRATION-RECOVERY.md) is mandatory: cancellation is allowed only before fencing; after new-version transactions, retain the current destination and recover forwards. Never replace it with the stale opening archive. Portable backups preserve business records with declared checkpoint provenance, not complete internal journal history.

Runtime repairs required by this verification: **None**. Independent review: **not performed**. Physical disk exhaustion, abrupt power loss, browser eviction, installed-PWA update and live phone recovery remain untested. The software gate permits BUILD-05; it does not authorize enabling migration for real counters. Publish this verification as a separate checkpoint and verify its remote hash.
