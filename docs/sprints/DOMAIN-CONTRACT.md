# BUILD-01 domain contract (D02)

## Calculations

New sales use `exclusive-paise-v1`. The existing `App.cartTotals` API resolves current items, settings and customer, then passes plain values into `App.domain.sale`. The calculator has no persistence, DOM, identity or clock access. Existing persisted bills and legacy GST report fallback are not recalculated.

Line gross retains historical rounding of price times quantity to paise. Thereafter totals and discount allocation use integer paise. Proportional allocation uses integer rational arithmetic, with last-line residue as before. If many tiny lines would make that line negative, residue is distributed backwards within each line's gross. Taxes round individually; their sum is the bill tax. Mixed-rate examples and independently derived expected values are in [REFERENCE-CASES](REFERENCE-CASES.md).

Quantity uses a separate scale of 10,000. New mutation inputs reject finer precision; addition/subtraction normalizes floating representation noise at that scale. Stock, batch allocation, return through full void, POS accumulation and inventory imports/edits retain four decimals. Persisted legacy data is not bulk rewritten. More precise historical quantities remain readable but require explicit correction before new operations can accept them. Piece-versus-weight unit policy belongs to BUILD-15.

## Identity and snapshots

`domain.command` validates and freezes an envelope: version, random command ID, account ID, actor ID, store ID, operation kind, millisecond timestamp and optional correction link. IDs are generated outside the pure module. New sale/void metadata uses these envelopes; a void links to the original command or the legacy bill ID. Client times/IDs are not server authority or idempotency guarantees. Other command types adopt this contract in subsequent storage work.

`domain.snapshot` deep-copies JSON records and recursively freezes them. Receipt dialogs use a snapshot so asynchronous share/print actions see the same sale data. The current v2 book remains mutable for legacy action/rollback compatibility; append-only persistence and fully immutable sale storage arrive in BUILD-04/05. No browser-side freeze is represented as security against a user controlling the device.

## Compatibility and recovery

No database or backup version change. New metadata lives on new bills; existing v2 readers permit those extension fields. To revert this code, return to the VERIFY-00 commit before taking new fractional-stock records into an older client: older stock arithmetic can round those quantities. Preserve an encrypted backup and profile before changing a real counter. Rewinding Git is not a reversal of user data and must never be presented as one.

Deployment includes `domain.js` before `core.js` and in both the public-asset and service-worker shell lists. No framework, backend, inclusive-tax mode or new accounting policy is added.
