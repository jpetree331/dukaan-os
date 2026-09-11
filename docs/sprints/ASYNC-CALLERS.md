# BUILD-02 awaitable persistence boundary

## Contract

`App.storage` supplies awaitable `read`, `commit`, `write` and `remove`. `commit` compares the previous raw snapshot and calls the captured context/writer guard immediately before changing the key. This sprint's adapter still uses localStorage; asynchronous delay/failure is injected by tests. `write` is for separately recoverable migration/checkpoint copies, not ordinary sale updates. Authentication credentials, throttle/session flags and the unused legacy sync queue stay in their existing local registry.

`App.save`, `persistNow`, `boot`, initialization, restore, reset, delete and all money/stock actions return promises. A successful command resolves after persistence. While waiting, selectors expose the previous committed book and the draft remains private to the pending operation. Success restores the accepted draft while preserving existing record references; failure restores the previous book and rejects. Pending writes deny additional actions/account switches. This is single-writer serialization by rejection, not server idempotency or durable offline replication.

Callers must await these promises before closing an editor, clearing a cart, navigating or announcing success. `App.isSaving()` and the `saving` event disable the counter/modal surfaces and mark the shell busy. Routing/rendering waits. Lock/context changes invalidate the guard before the eventual write; logout locks immediately without flushing an abandoned draft.

## Mutation caller inventory

| Surface | Awaited operations / completion behavior |
| --- | --- |
| `core.js` | sale, full void, customer collection, purchase, supplier payment, restock; restore/checkpoint, sample seed, reset, account initialization/load/delete. Effects and return values wait for the repository. |
| `pos.js` | charge and undo; cart clearing/receipt follow accepted sale. A pending second charge is ignored. Daily-target preference failure cannot turn a committed sale into a missing receipt. |
| `inventory.js` | item editor/delete, numeric and quick-button restock, CSV import. Every row is validated before the staged import; completion waits. |
| `ledger.js` | customer editor/delete, collection keypad, supplier editor/payment and purchase receipt. Keypad modal awaits its callback before closing. Reminder activity is awaited after the user's external-share action; delivery of a message is not a persistence guarantee. |
| `settings.js` | PIN/staff changes, store switch/create, fields/toggles/themes/language, exports/restore, sample/reset, login migration and logout/password flows. Business restore waits before reload. |
| `i18n.js` / shell | language, theme, startup/account load; language/theme application follows its write. Shell initialization attaches lifecycle handlers without waiting for background startup I/O. |
| `insights.js` | target/brief preferences, manual void and cash-count activity. Reconciliation result/celebration follows activity persistence. |
| `auth.js` | signup book initialization, enable/disable login copies/read-back/boot, deletion and password-change logout. Source local data is retained until migration destination is verified. |
| `ui.js` | modal callback promises retain busy state; numeric keypad forwards/awaits the mutation promise. |

The AST-assisted caller inventory was generated using a disposable pinned parser outside the repository. Manual review corrected promise `.catch` placement, keypad callbacks, lifecycle registration and post-save UI timing. No parser dependency is shipped or required by the app. Existing tests now await public mutation APIs and assert rejected promises rather than synchronous exceptions.

## Failure and recovery limits

The live schema and backup format remain v2. A failed ordinary command retains old storage and book state. Login migration and account deletion remain multi-key procedures with preserved-source/retry rules, not one atomic transaction across credential and book stores. The localStorage adapter does not provide IndexedDB capacity, transactions across multiple collections, cross-device ordering, or recovery of a browser terminated after a physical write but before displaying acknowledgement. Subsequent journal/idempotency sprints address those boundaries.

Review old third-party console scripts before using them: public mutation APIs are now promises. Git can rewind this code with no schema downgrade, but cannot undo recorded business operations. Continue to keep encrypted backups when changing a real counter.
