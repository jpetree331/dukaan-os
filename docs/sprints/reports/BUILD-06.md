# BUILD-06 — Explainable customer balances

Status: **built-unverified at build checkpoint**. Runtime code `e30588d4b08b2a94f83d110c85e1fad0c81a0092`; predecessor VERIFY-05 remote `318eb716b0a00f7d72ae87de46c20cd6c1899cf8`. Date: 11 September 2026.

## What changed and why

Added dated opening balances and disclosed legacy checkpoints, append-only customer balance entries for credit sales/voids, linked partial collections, advances and owner corrections. Converted balances are derived in paise and schema validation rejects disagreement. Collection and advance forms select cash, UPI or card; persistent operation IDs make form retries idempotent. Cross-customer/store invoice links and excess linked collections reject before mutation. Corrections require an owner and reason and do not invent cash movements.

Customer detail shows recent balance entries and exports their full running-balance CSV. The previous complete purchase/payment-history export is retained separately. The root ledger version marker prevents older clients from silently changing the scalar balance while ignoring entries. See the [policy, worked arithmetic and recovery contract](../CUSTOMER-LEDGER.md).

## Builder evidence

- **57 module tests passed**. Independent example: 50 opening + 100 credit sale - 40 cash - 30 UPI - 100 advance + 5 correction = -15 balance; cash received = 140. Duplicate commands preserve the exact book; changed reuse, scalar edits, invalid links, cashier corrections, foreign-store collections and failed commits reject.
- **Four customer-ledger browser groups passed**, covering actual opening/collection/advance/correction forms and complete balance CSV in both storage modes. UI fixture gives balance -45 and cash 100 after reload.
- **12 baseline browser groups and 16 migration groups passed** on the final runtime. Build `1c4c9b2619f3317265f8`; plan and diff checks pass.
- A regression test initially caught displacement of the complete historical CSV. Both exports are now retained and that regression passes. A browser test was corrected to wait for closing-modal animation before opening the next form; no success was inferred from that failed test run.

## Compatibility and limits

Unconverted customers remain readable without changing their source on read; their first new financial command persists the disclosed opening checkpoint and movement atomically. Legacy transaction history is not reconstructed. Explicit opening is only available before history; later changes use correction entries. Unlinked payments apply to the customer balance; this does not allocate all historical payments across invoices or verify bank settlement.

Failed final checks: **None**. Independent review: **None**. New physical cash movements are advances/collections; opening and correction entries are noncash. No automatic bank operation, production migration or deployment. `customerLedgerVersion: 1` means older clients fail closed and Git rewind alone is not data rollback.

VERIFY-06 must assess five new pairs, rerun the ten older pairs affected by the book format and financial commands, and test checkpoint/backup and draft-finalization combinations. Push build/report first; verify remote SHA.
