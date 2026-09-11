# Reported-bug repair pass

Date: 2026-09-11. Baseline: `65e2751883935033ad337df5b2142f0ae10f6c91` from `sammarthh5655/dukaan-os`. Work is in the local checkout of the `jpetree331/dukaan-os` fork. The original audit reports remain unchanged in the parent workspace.

All 30 numbered findings have corrective changes. Validation comprises 23 automated tests, JavaScript syntax checks, and targeted browser interaction. This is a repair pass, not a claim that the application is ready for a shop's primary accounting records or that the next security pass is complete.

## Findings and corrections

| Finding | Corrected behavior | Verification |
|---|---|---|
| B01 | First dated restock carries existing undated stock into a batch instead of replacing it. | Mixed-stock transaction test |
| B02 | Consuming the last batch sets stock to zero. | Complete depletion test |
| B03 | New bill lines retain actual consumed batch IDs, dates, costs and quantities; void restores those allocations. | Full depletion/void equality test |
| B04 | Item/customer/supplier selectors are store-scoped; cart records its store, rejects mismatches, and clears on store changes. Last-bill state clears too. | Foreign-store rejection test; browser switches with a confirmed nonempty cart |
| B05 | Cart and checkout share one tax/discount/redemption calculation. | Displayed ₹80 equals committed ₹80 for a ₹100 basket with ₹20 redemption |
| B06 | Customer selection clears redemption; unavailable points and walk-in redemption cannot be used. Quantity/discount changes cap it again. | Redemption/walk-in tests; picker handlers reviewed |
| B07 | Void restores the recorded number of redeemed points and removes earned points, even after the configured point value changes. | Redemption and void test |
| B08 | Purchase payments record cash/UPI/card mode; immediate cash payments enter cash reconciliation exactly once. | Partial cash purchase, UPI purchase and later settlement test |
| B09 | Customer/supplier payments above the outstanding balance are rejected before mutation. | Excess payment and unchanged-database assertions |
| B10 | GST is accumulated from each line's actual rate and discounted base. New lines snapshot tax; legacy bills allocate recorded tax by rate-weighted taxable value. | Mixed 5%/18%, legacy and paise-discount tests |
| B11 | Estimated profit subtracts collected GST and recorded sale cost. Batch sale costs and stock value use batch costs. | ₹200 pre-tax revenue, ₹23 GST, ₹120 cost yields ₹80 profit |
| B12 | Unreadable local data stops startup and offers a raw recovery download; it is never replaced with a blank shop. | Byte-for-byte malformed-storage preservation test |
| B13 | Restore validates version, collections, IDs, references, stores, staff, numeric values, transaction totals, modes and stock allocations before replacement. Previous data is retained; failed writes restore memory. | Invalid schema/reference/value cases, quota failure, successful restore and recovery-copy assertions |
| B14 | A Web Lock allows one writable Dukaan OS counter per origin. A stored-snapshot comparison also refuses stale overwrites from older clients. | Competing-writer and stale-snapshot tests; second real browser tab blocked |
| B15 | Saves are synchronous; checkout returns only after storage succeeds. Failure restores stock, loyalty, balances, bills and counters and leaves the cart available. | Injected quota failure and durable-before-return test; browser sale and reload |
| B16 | Birthday, briefing, item-icon and fly-to-cart rendering escape user text. Restore rejects unsafe IDs and invalid raw transaction fields. | Inert HTML payload tests across birthday, briefing, CSV inventory, POS and animation sinks; no payload executed |
| B17 | The UI describes device-only storage. No queue is falsely drained and no upload success is fabricated. Old queue entries are preserved. | Legacy queue remains unchanged while online; browser status text |
| B18 | Decimal punctuation inside quantities survives speech cleanup. | `1.5 kilo sugar` yields quantity 1.5 |
| B19 | Matching requires coverage of all substantive tokens and a score margin over alternatives; ties remain unrecognized. | Unknown-token, ambiguous-variant and Hindi/Hinglish control tests |
| B20 | Filler removal operates on whole words, item-stock questions keep their subject, and historical rankings use both date bounds. | Maggi question, yesterday-only ranking and summary tests |
| B21 | Checkout revalidates item existence, deletion, store, current price, positive quantity and combined quantity across duplicate lines. | Stale/deleted/foreign/duplicate/over-stock rejection tests |
| B22 | Purchase/restock cost and quantities must be finite and nonnegative/positive as appropriate. | Negative, NaN, Infinity and excess-payment rejection tests |
| B23 | Turning login on or off immediately loads the migrated namespace into memory. A later save no longer writes the old blank database over it. | Migration, immediate save, reverse migration and bad-password control |
| B24 | Deferred rendering stays pending until a modal is removed or a focused input loses focus. Modal close is idempotent; async saves cannot double-submit through their button. | Browser: saved item appears without navigating away |
| B25 | Route authorization applies to navigation, hash changes, initial render and role changes. Restricted editors/actions check authority. Owner switching requires an owner staff PIN when using cashiers. | Action/editor rejection tests; browser role switch, direct settings URL, fresh reports URL, hidden inventory edit controls, wrong/correct PIN |
| B26 | Development server binds to loopback by default and serves an explicit public-asset allowlist. | Private paths return 404; app/safety assets return 200 |
| B27 | Invalid percent encoding returns 400 and leaves the server running. | Two malformed requests followed by successful requests |
| B28 | Worker cleanup targets only old `dukaan-os-` caches. A cache version holds a complete shell instead of mixing independently refreshed scripts. | Mock install/activation confirms unrelated cache survives and every shell path exists |
| B29 | CSV blank numeric cells preserve values; invalid numbers abort the whole import; zero is explicit; Hindi/GST updates apply. Conflicting name/barcode matches and scalar replacement of dated stock are rejected. | CSV parser-to-import tests |
| B30 | Voiding a repaid credit bill preserves the negative balance as credit owed to that customer. It is visible in the customer list/detail and offsets subsequent udhaar bills. | Payment → void → later credit-sale accounting test |

## Additional report items addressed

- CSV exports neutralize formula-leading text while retaining actual numeric amounts. This was tested as output text; no spreadsheet was launched.
- Customer CSV exports include the complete history, independently of the 40-row screen limit, and label cancelled transactions. A 45-bill test checks completeness.
- Text, printable and canvas receipts mark voids; voided credit receipts no longer ask for payment. Fractional amounts retain paise in normal money formatting.
- Quick restock updates cost; newly billed batch inventory uses the actual consumed batch costs. Allocation is earliest expiry first, then oldest receipt; this is not a weighted-average costing system.
- Expired batches remain counted physically but cannot be sold. Suggestions say to set them aside. Stock write-off/disposal workflows remain to be designed.
- README now explains supported startup, single-tab operation, actual local-login boundaries and the absence of cloud sync.

## Verification

From this repository, run:

```text
npm test
```

The suite uses Node's built-in test runner, a small browser-state adapter, disposable in-memory records, and a temporary server on an OS-assigned loopback port. There are no application or test package dependencies. It verifies 23 grouped scenarios; a grouped scenario may cover several numbered findings. The adapter is not a full browser or an independent security scanner.

Browser checks used the in-app Chromium browser at `http://127.0.0.1:4187`, with synthetic data only:

1. Empty shop opened; device-only persistence status displayed.
2. Added “Browser test rice”, price ₹100, cost ₹60, stock 10. Saving closed the modal and inventory immediately showed 1 item/10 units.
3. A second tab was refused writable access while the first owned the lock.
4. A cash sale saved bill #1 for ₹100, stock became 9, and a receipt opened. The bill and stock survived a full page load.
5. With a confirmed one-item ₹100 cart, switching to another store cleared the cart, customer/redemption context and last-bill display; the new store showed no foreign inventory.
6. Configured an owner staff PIN and a test cashier. Switching from Settings to cashier opened Billing. Direct `#settings` and a fresh `#reports` load both returned to Billing. Inventory hid add/import/edit controls. Wrong owner PIN retained cashier access; the correct PIN restored owner access.

JavaScript syntax checks cover all application scripts, server and service worker. The original custom QR encoder is unchanged; its independent decode audit remains baseline evidence, not a newly rerun browser-payment test.

Not performed: Android/low-memory device testing, microphone or camera hardware tests, physical receipt printing, payment-provider verification, real spreadsheet execution, an HTTPS service-worker upgrade/offline browser cycle, or the broader security assessment requested for the next pass. No production data or service was modified. No deployment or remote push was performed.

## Compatibility choices and remaining work

- Use HTTPS or the loopback server in a browser supporting Web Locks. A second tab must wait for the first to close and then reload. Multi-device trading is still unsupported.
- Corrupt or previously inconsistent databases may now stop at recovery rather than open partially. Preserve their raw download and repair from a known-good backup; this pass does not infer missing financial history.
- For pre-fix bills, batch IDs/expiry allocations and the historical value of loyalty points were never recorded. Legacy void restores undated stock using the saved line cost, and converts any redemption with the current point value. Exact historical restoration cannot be guaranteed. New bills have the necessary snapshots.
- Old purchases without a payment mode are treated as cash. Review historical cash reports if those purchases were actually paid another way.
- Customer credit from a void is carried against later udhaar transactions. A separately recorded cash-refund workflow remains future work. Existing losses caused by old clamps/overwrites cannot be reconstructed automatically.
- The `.before-restore` copy occupies browser storage; if there is insufficient space, restore refuses safely. The primary app remains a whole-database localStorage design, so large-history performance and storage capacity need field testing.
- Authentication, encrypted storage, server-enforced permissions, session lifetime/rate limiting, deployment policy and cloud synchronization belong in the next security/architecture pass. Full localization and accessibility remain unfinished product work from the original design report.
