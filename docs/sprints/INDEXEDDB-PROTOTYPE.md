# BUILD-03 IndexedDB prototype

Normal startup still selects `App.storage` from `storage.js`. `App.features.indexedDB` is frozen false. Merely loading `indexeddb.js` opens no database. The prototype factory requires an explicit `allowPrototype: true` and a `dukaanos-prototype-*` database name. Only disposable test contexts select it; existing shops are not migrated by this sprint.

## Schema and atomic boundary

Physical database version 1 has three object stores:

| Store | Key | Purpose |
| --- | --- | --- |
| records | book/auxiliary key | Current serialized projection and monotonically increasing revision; deletion is a null-valued tombstone. |
| commands | [book key, operation ID] | Unique accepted operation, content digest and revision. |
| journal | [book key, revision] | Versioned opening checkpoint or incremental JSON changes, operation link and deletion marker. |

An accepted commit writes all three stores in one readwrite transaction. Completion is reported on the transaction's `complete` event, never an individual request's success. Reads of both projection and operation ID occur in that transaction; the guard and expected-snapshot check run before writes. An identical last-operation retry returns the same revision without writing. Reusing an ID with different contents is rejected. Retrying an older operation after later commits requests a reload, rather than rolling the projection back to its old value.

Book writes are validated by the current v2 validator. The journal stores field replacements and array splices, keeping new front-inserted bills compact rather than duplicating the whole bill history each time. The first revision is an explicit snapshot checkpoint; it does not invent historical movements. Replay requires contiguous revisions and supported journal versions, rejects unsafe paths and validates the resulting book. JSON serialization order is not a security boundary; callers compare reconstructed business data as well as exact projection bytes where appropriate.

## Durability and recovery limits

Transactions request `durability: 'strict'`. This remains a user-agent durability hint, not a hardware/power-loss guarantee. Native atomicity, error/abort handling and completion semantics follow the [IndexedDB specification](https://www.w3.org/TR/IndexedDB/). Browser eviction, disk failure, cleared profiles and forgotten backup passwords remain distinct risks. No supported-capacity claim follows from this small-fixture prototype.

`node tests/browser-indexeddb.cjs` runs real IndexedDB in disposable Edge/Chromium contexts. Its quota test injects `QuotaExceededError` after enqueuing a native projection write; it does not fill the physical disk. The transaction abort/reopen/dedup/replay evidence is separate from actual phone quota/capacity testing.

The adapter alone is not authorization: a database name is not a tenant boundary. Existing application permission/writer/context guards still run. Credential/session metadata remains separate. Rewinding this disabled prototype has no effect on a normal shop's source data. Activation, source fencing, both-schema backup recovery and after-cutover rollback policy belong to BUILD-04.
