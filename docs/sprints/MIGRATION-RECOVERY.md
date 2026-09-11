# BUILD-04 migration and recovery contract

Activation remains a developer-only prototype API: there is no migration button or automatic first-run cutover, and `App.features.indexedDB` remains false. Independent migration/recovery review is required before real shop activation. Existing active markers are read so a tested migrated profile can reopen; absence of a marker retains localStorage.

## States and provenance

`App.migrations.run({allowPrototype:true})` requires current owner access, fresh credentials where configured and the writer lock. It captures account/store/staff context and blocks other saves while working. The prototype can be interrupted using a test callback; ordinary startup never invokes it.

1. Validate and hash the current v2 book; write/read-back a byte-identical source archive.
2. Persist a `copying` marker bound to the account, expected database name and source SHA-256.
3. Copy the book into an IndexedDB opening checkpoint using a stable operation ID; copy existing recovery/legacy-queue data.
4. Compare destination bytes and journal replay, then mark `verified`.
5. Compare the source again and replace its legacy key with a version-3 fence. Prior v2 clients reject the unsupported version rather than overwrite the book.
6. Mark `active` and remove verified auxiliary source copies. Keep the original book archive for controlled recovery.

The opening checkpoint records observed legacy state, not an invented reconstruction of old sales or stock movements. Further writes are journalled by the repository. Login enable/disable carries the current book into the corresponding journalled namespace; these moves start a new checkpoint, not a fabricated continuous historical event stream. Account deletion explicitly destroys the owned journal database, archive, marker and legacy keys before removing the login. The legacy pending queue remains visible as pending; it is not uploaded.

## Recovery decision table

| Observed state | Authoritative data | Recovery action |
| --- | --- | --- |
| No marker, archive-only interrupted preparation | Valid live localStorage book | Retry preparation; the source has not switched. |
| Copying/verified, no fence, unchanged source | Live source, verified against its hash | Resume idempotently; verify destination before fencing. |
| Copying/verified, source changed | Current source; destination is a previous candidate | Stop automatic resume. `cancelBeforeCutover` preserves the source and removes only the inactive candidate/marker/archive; then preview and restart from current data. |
| Fence written, marker verified/active | IndexedDB current book | Reopen through the router and finish activation. Never replace it with the archived opening snapshot. |
| Active with subsequent transactions | IndexedDB current book plus journal | Export a current encrypted checkpoint. Reconcile later records into any forward recovery; swapping in the stale opening source is refused. |
| Missing/corrupt marker, changed fence or missing destination | Uncertain; preserve every copy | Fail closed. Keep the browser profile and use controlled owner recovery from a verified backup; do not create an empty counter or silently fall back. |

An old binary is tested directly from Git checkpoint `f292518b89ca6f78f8b1b8fcce040cb5f635ccd0`. This proves its startup validator rejects the fence. It does not certify an installed-PWA OS upgrade, device power loss, corrupted disk or every historical version.

## Backup schemas and forward recovery

Legacy encrypted/plain v2 business snapshots remain readable. Migrated exports encrypt a storage-version-3 **snapshot checkpoint** containing the complete current v2 business book and explicit opening/capture provenance. PINs are stripped from the contained book just as in v2 exports. Restore preserves the receiving profile's staff/PIN/payment destination and records checkpoint provenance.

This portable backup is not a byte-for-byte replica of every internal IndexedDB journal revision. It contains current bills, corrections, stock, balances and other book records; internal history begins at a new explicit recovery checkpoint after restore. Do not claim an append-only forensic archive. A fresh non-migrated profile can restore those business records into localStorage; migrating it later establishes a new opening checkpoint. This choice keeps recovery possible while migration activation remains disabled.

Internal IndexedDB version 1 and the v2 business record shape are distinct from backup storage version 3. No earlier invoice is recalculated. New accounting collections, immutable sale storage and operation-level synchronization are later builds, not implied by this checkpoint wrapper.

## Evidence and limitations

`tests/browser-migration.cjs` uses new browser contexts, interrupts each of six stages, reloads/resumes twice, adds a later sale, retries without rollback, runs the actual old client, tests login namespace changes/account cleanup and restores an encrypted checkpoint via file UI. `tests/checkpoint-backup.test.cjs` checks PIN omission and malformed provenance. Native IndexedDB quota injection and baseline browser suites remain separate evidence.

No real shop, phone, installed PWA or production site was migrated. Capacity at the provisional workload is unmeasured. Source archives remain plaintext in the browser and must be included in privacy/deletion review; no encrypted local-vault claim is made. Independent review and physical release gates are still outstanding.
