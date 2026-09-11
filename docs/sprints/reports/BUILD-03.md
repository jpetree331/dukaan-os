# BUILD-03 — Transactional IndexedDB prototype

Status: **built-unverified at build checkpoint**. Runtime code `32c199b047dfa1abe9ab0d01a2ea87716cbf7186`. Predecessor VERIFY-02 corrected push confirmed at `f836473e19645be890a0fcbf38d7f2d3d6dc9ff2`. Date: 11 September 2026.

## What changed and why

Added a disabled IndexedDB factory with three stores for current projections, unique command IDs and versioned incremental journals. Atomic readwrite transactions compare the prior snapshot, check writer/context, then commit all effects together. Identical last-command retries deduplicate; changed contents or stale retries reject. Journal replay validates revision continuity, paths and resulting book. Tombstones preserve revision history; reopening retains the book.

`App.features.indexedDB` stays false; normal startup neither opens the prototype nor changes adapters. Tests explicitly opt into disposable `dukaanos-prototype-*` databases. [Schema and recovery documentation](../INDEXEDDB-PROTOTYPE.md) explains the transaction boundary, durability hint, replay and activation limits. The browser shell includes the module; no live migration occurs.

## Actual builder checks

- **49 module tests passed**; previous repaired/security/domain/async cases remain passing.
- **Six native-browser groups passed** on Edge 152.0.4191.66: disabled activation/parity, operation retry/reuse/stale rejection, native transaction abort and injected quota rollback, close/reopen/replay, BUILD-01/02 sale and void integration, tombstone/recreation.
- Injected quota failure occurs after a real IndexedDB request is queued. It proves transaction rollback behavior; physical disk exhaustion and phone storage capacity were not tested.
- Build passed at `043d8166e0fc82f28c75`; plan and whitespace checks passed.

The expected integrated mixed-tax sale remains 200.70; rice/soap stock and points reverse exactly on void. Rebuilding matches the committed records. The ordinary localStorage source remains byte-identical during prototype transactions.

## Deviations, data and risks

Failed final checks: **None**. Independent review: **None**. No schema cutover, source deletion, cloud upload, authorization substitution or production deployment. Journal entries store incremental JSON changes with an explicit opening snapshot; they do not reconstruct missing historical events. This is a bounded v2-compatible repository prototype, not the final accounting domain journal or a capacity certification.

Browser transaction durability remains a user-agent hint; encrypted backup and device recovery remain necessary. Unsupported physical quota/power-loss behavior is not passed. Rewinding this disabled prototype leaves normal shop storage untouched. Activation, migration markers, old-client fencing and backup compatibility are BUILD-04.

Due seams: SEAM-01-03 and SEAM-02-03. The separate VERIFY-03 gate will assess both and the existing 01-02 combination under normal startup. Code and report are pushed before that gate; remote SHA is checked after push.
