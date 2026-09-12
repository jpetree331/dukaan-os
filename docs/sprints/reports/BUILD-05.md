# BUILD-05 — Resumable carts and receipt snapshots

Status: **built-unverified at build checkpoint**. Runtime code `1e43d8fa2f850e97547c92a4dc05cff31243aae5`. Predecessor VERIFY-04 remote `0ca649eaa00563842c7b88d9c24f579520b7948d`. Date: 11 September 2026.

## Delivered behavior and reasons

Cart edits save through the awaited repository under account/store/staff/device scope. Interrupted work resumes on that scope; locking hides it and another staff member does not inherit it. Draft revisions and selected price/tax/unit versions expose stale choices. A sale atomically consumes its draft with stock and financial changes. An identical finalized-draft retry returns the existing bill; changed contents or scope reject.

New receipts retain shop/contact/currency/theme/UPI identity, customer phone, loyalty policy and item units alongside the existing tax, discount and batch-cost snapshots. Later settings cannot change their image or text. Lines receive stable identities and initial returnable quantities; void leaves original quantities and records a correction. Explicit login namespace transfers remap active draft ownership. See the [contract and rollback limits](../DRAFTS-AND-RECEIPTS.md).

## Builder checks

- **53 module tests passed**. New cases cover restart, identical/different retries, scope isolation, stale selections, failed draft edits, failed sales and receipt identity. Existing POS tests now await the durable cart operation they exercise.
- **Six browser draft groups passed**, covering normal UI resume, stale-price rejection, restart after checkout, duplicate retry, and exact receipt pixel/text equality in both localStorage and disposable IndexedDB.
- **12 baseline browser groups passed**; **16 migration browser groups passed**. The stale-price browser test initially found an unhandled rejection; checkout now reports that expected error locally and the final browser checks have no uncaught errors.
- Build `d24534752369a43a07c1`; plan and whitespace checks pass. Test harness fixtures remain synthetic.

## Compatibility, deviations and next gate

The optional `drafts` root field extends the business envelope. Old readers reject that field; Git rewind alone is not data rollback. Older receipts lacking identity snapshots keep their existing fallback because historical identity cannot be invented. Backups retain drafts, but a different device does not automatically claim another device's draft. Legacy direct checkout callers without draft IDs retain the prior non-idempotent contract; new retry-safe integrations must persist a draft first.

Failed final checks: **None**. Independent review: **None**. No partial returns, cross-device shared drafts, real-data migration activation or printer certification. Physical crash/power-loss evidence is not claimed from browser reloads. VERIFY-05 must test the four new pairs plus recheck all older pairs affected by persistence/schema changes. Push this build/report before that gate and verify remote SHA.
