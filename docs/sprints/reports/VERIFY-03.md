# VERIFY-03 — IndexedDB transaction and integration verification

Verdict: **passed for the disabled prototype, self-verified**. Runtime code `32c199b047dfa1abe9ab0d01a2ea87716cbf7186`; pushed build/report `ccd609edee8176d5dd90cbf3e165603707ee2bbe`. Date: 11 September 2026. Windows / headless Edge 152.0.4191.66; disposable IndexedDB and localStorage only.

## Evidence

- `npm test`: **49 passed, 0 failed**.
- `node tests/browser-indexeddb.cjs`: **nine native-browser groups passed**. Three adversarial groups were added for this verification: simultaneous expected-version commits accept exactly one complete book; a revoked guard and unrelated-key tombstone preserve the current book; a closed connection rejects without erasing persisted state. Existing cases cover disabled activation, parity, dedup/reuse/stale rejection, native abort, injected quota error, reopen/replay, real application sale/void and tombstone recreation.
- `node tests/browser-baseline.cjs`: **12 groups passed**, including normal localStorage sale/void, encrypted restore, credentials, delayed sale and rejected collection. No uncaught page errors. The disabled prototype does not change ordinary application startup.
- Build passed at `043d8166e0fc82f28c75`; plan check passed. Diff reviewed against the card: new repository/module inclusion, native-browser tests and documentation only. No source migration or hidden activation.

## Every-prior-build seams

| Seam | Concrete assertions and evidence |
| --- | --- |
| SEAM-01-03: BASE/MONEY/STOCK/AUTH/SCHEMA | Native application checkout uses the M01 domain fixture: total 200.70, points 12, rice 8.75 and soap 8; void restores points 20 and both stocks 10. Journal rebuild equals the validated committed book. Factory gating and commit guards hold. v2 parity copy retains source bytes. See `tests/browser-indexeddb.cjs`. |
| SEAM-02-03: BASE/MONEY/STOCK/AUTH/STORE | The same actions use the awaited repository API; command/journal/projection roll back together on a native abort or injected quota failure. Reopen retains all records; stale, repeated and concurrent commands produce the documented outcome. Revoked guard prevents commit. See `tests/browser-indexeddb.cjs` and `tests/async-storage.test.cjs`. |
| SEAM-01-02 recheck | All domain/awaited regressions and normal browser recovery scenarios rerun on this tree. Prototype activation remains disabled, and normal storage selection remains the original adapter. Evidence is extended to this runtime hash, not inferred from an old run. |

Three pair rows are passed; 462 future pairs remain planned. No pair is waived as N/A. Implemented money/stock/backup/lock journey portions were checked; unbuilt transfers, returns, cloud and vault flows remain untested.

## Limits and delivery

Failures requiring runtime repair: **None**. Additional deviations: **None**. Independent reviewer: **None**. Quota is controlled `QuotaExceededError` injection inside native transactions, not a disk-full experiment or phone capacity proof. Physical power loss, browser eviction, installed-PWA upgrade, phone, printer and production validation remain unavailable. The prototype is not authorization, encrypted browser storage or a production migration approval.

Eligible next: BUILD-04 migration/recovery work. Independent migration/recovery review remains required before real-data cutover. Push this verification separately; remote SHA is verified afterwards. No merge, deployment or real shop data changed.
