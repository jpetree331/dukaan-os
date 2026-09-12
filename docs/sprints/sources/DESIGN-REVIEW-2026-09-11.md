> Historical source review, preserved from the initial audit at 65e2751. Many listed defects were subsequently repaired. The current sprint plan and security/repair reports distinguish completed work from the remaining backlog.

# Dukaan OS — future design and remaining development

Reviewed 11 September 2026 at `65e2751883935033ad337df5b2142f0ae10f6c91`. [Original repository](https://github.com/sammarthh5655/dukaan-os) · [Development fork](https://github.com/jpetree331/dukaan-os).

## Product direction already present

Dukaan OS is intended to be a simple billing counter, inventory system, and two-sided credit ledger for small Indian shops. Its distinguishing goals are Hindi/Hinglish voice entry, low-cost Android usability, large touch targets, and operation during connectivity loss. The interface already has a consistent warm orange/cream visual design, optional dark mode, fast item cards, receipts, and visible feedback.

The implementation is a static, dependency-free application: twelve browser scripts sharing a global `App`, a single HTML shell, CSS, a PWA manifest/service worker, and a small Node development server. The database is an account-namespaced JSON snapshot in `localStorage`. There is **no backend**, shared cloud identity, remote database, or completed synchronization protocol.

The project is already broad enough that the next phase should concentrate on trustworthy records and completing the advertised workflows. A framework rewrite is not required to fix the identified defects. Separating domain calculations, persistence, permissions, and rendering would make the existing architecture much easier to test.

## Where future plans were found

The only explicit roadmap found is [README.md, Roadmap / help wanted](https://github.com/sammarthh5655/dukaan-os/blob/65e2751883935033ad337df5b2142f0ae10f6c91/README.md#%EF%B8%8F-roadmap--help-wanted).

At audit time, GitHub exposed one branch (`main`), two commits, no tags, and no issues or pull requests in the all-state issue listing. There is no separate design specification, wireframe collection, architecture decision record, test plan, migration plan, or implementation backlog in the tracked repository. `.claude/launch.json` is just a local launch configuration. Comments contain aspirations and extension hooks, but they are not a completed design.

The following five goals are **Sammarth's stated roadmap**, not additions from this audit:

| Stated goal | Current foundation | Work still needed |
|---|---|---|
| Real cloud sync using Firebase/Supabase | Account/store IDs, online/offline indicator, local queue metadata | Backend selection; remote identity/authorization; durable outbox containing actual changes; remote reads and initial hydration; idempotency; revisions/conflicts; retries; migrations; recovery; two-device tests. |
| Better Hindi speech accuracy on noisy shop floors | Web Speech API wrapper; Hindi/English number words; transliteration; aliases; confirmation sheet | Real device/audio evaluation; domain-specific vocabulary; decimal/unit parsing; safe ambiguity handling; noise/error recovery; explicit offline/unsupported behavior. |
| More regional languages such as Marathi, Tamil, Bengali | English/Hindi dictionaries and language-aware item names | Complete existing localization first; plural/currency/date formatting; language metadata; translated product aliases; recognition/TTS availability checks; native-speaker review and field trials. |
| Common 58mm thermal printer support | Browser print action and receipt HTML/canvas | Paper-width layouts; supported transport/platform decisions; Bluetooth/USB/browser or companion-app integration; encoding and Devanagari strategy; QR/long-name tests; printer hardware matrix. Current print CSS allows up to 78mm and is not a tested 58mm integration. |
| Field testing with actual shopkeepers | A runnable prototype, optional demo data, touch-oriented flows | Small pilot with disposable/parallel records; representative phones and shop conditions; task scripts; measurement of errors and completion time; feedback triage; recovery drills; release criteria. |

The README says cloud sync can be enabled by swapping one function. That is an aspiration that substantially understates the work. Queue entries currently contain only an operation label, timestamp, ID, and store; online draining deletes them without uploading. Settings/staff/store mutations often skip that queue entirely. There is no conflict resolution, remote subscription, durable acknowledgement, or shared authentication.

## Existing features and how complete they are

| Area | Present today | Missing or unreliable |
|---|---|---|
| Billing | Item search/cards, favourites, quantities, discount, customer selection, four payment labels, receipt, undo | Commit-time validation, store-safe carts, trustworthy loyalty totals, durable transaction success, reliable reversals, persistent draft cart, explicit return/refund workflow. |
| Inventory | Item CRUD, categories/barcodes, stock alerts, restock, expiry batches, CSV | Correct first-batch/depletion/undo behavior, batch-based cost accounting, adjustments/write-offs, expired-stock policy, barcode uniqueness, validated imports, stable identities. |
| Customer ledger | Profiles, debt, payments, history, loyalty, birthday/reminder actions | Overpayment/advance credits, refund liability, explicit payment method during collection, opening balances, full ledger export, correction/reversal history. |
| Supplier ledger | Suppliers, purchase entry, stock receipts, balance, payment, due dates | Purchase-linked payment methods, payment history and allocations, return/credit-note flow, reconciliation, validation, purchase correction/cancellation. |
| Reports | Date-window sales/profit, payment split, charts, GST table, cash comparison, activity log | Correct tax/profit/cash arithmetic, exact time-range handling, complete export, documented accounting semantics, opening/closing cash and expense movements. |
| Insights and questions | Deterministic restock/dues/expiry/anomaly suggestions, summaries, keyword Q&A | Product/entity/period correctness, ambiguity handling, safe HTML rendering, explanation of data window and assumptions, graceful unsupported questions. There is no remote AI service. |
| Accounts and staff | Optional local username/password gate, PBKDF2, PIN, owner/cashier UI, activity | Consistent route/action permissions, safe migration, clear local-security boundary, session policy, owner recovery strategy, remote authorization if cloud sync is added. |
| Multiple stores | Store selector, store-scoped list filters, combined daily total | Cart/record boundaries, per-store shop identity/settings where appropriate, staff-to-store assignments, transfer workflow, store-specific targets/cash/receipt rules. |
| Backup and offline | JSON export/restore, local persistence, service-worker shell | Schema validation, rollback, corruption recovery, durable capacity handling, honest sync status, full-device restore drill, tested deployed offline/update lifecycle. |
| UX/accessibility | Consistent visual system, desktop/phone layouts, language toggle, reduced-motion CSS | Complete Hindi coverage, keyboard/focus semantics, associated labels, screen-reader names, long-name/large-catalog stress checks, target-device performance. |

## Recommended development work, beyond the stated roadmap

These are audit recommendations. They should be agreed with Sammarth before becoming product commitments.

### 1. Establish reliable transaction and storage foundations

Create explicit domain operations for sale, void/refund, stock receipt, adjustment, customer collection, supplier payment, and credit/advance. Each operation should validate inputs, produce an immutable record, and commit its related effects together. Define invariants such as “stock equals available batch quantities,” “a void reverses the original movements,” and “a store cannot mutate another store's records.”

Move transaction storage toward an indexed, transactional model such as IndexedDB, or provide a rigorously tested equivalent. Preserve and migrate existing localStorage data; do not silently reset it. Model schema versions, rollback backups, storage failure, interruption, and multiple open tabs explicitly.

Use integer minor currency units where practical and document quantity precision. Snapshot sale price, allocated batch cost, tax, discount, loyalty movement, store identity, and staff identity at sale time. Avoid recalculating historical facts from mutable current settings.

**Acceptance:** Every high-priority stock/money/data-loss reproduction in the bug report becomes an expected-correctness test; storage failure cannot display an unqualified successful checkout; restart and restore preserve exact balances.

### 2. Complete the money workflows

Agree how a shop actually handles opening udhaar, partial collection, cash versus UPI, advances, overpayment, returns, refunds, supplier credits, and purchase corrections. The current scalar balances are too easy to make inconsistent with payment history.

Add payment method selection to collections and purchase-time payments. Define opening cash, paid-out expenses, owner withdrawals, closing cash, and reconciliation corrections. Preserve an audit trail rather than editing away a mistake. Build complete ledger exports independent of the UI's recent-feed limits.

For GST, define inclusive versus exclusive item pricing and round line/rate totals consistently. The audit confirms arithmetic defects but does not certify tax-law compliance; final invoice/tax requirements need a separate domain review.

**Acceptance:** A sale, partial payment, full payment, refund, overpayment, and void sequence can be reconciled from its records without guessing. Cash and tax reports match those records to the chosen rounding rules.

### 3. Make security promises match the implementation

Fix stored HTML injection and enforce owner/cashier permissions on both routes and actions. Require an appropriate owner credential before elevation, and define what happens when a role changes while a restricted screen or modal is open.

Document that local browser storage is not encrypted and that device/browser control is outside the protection offered by a local login screen. Decide whether encrypted backups or encrypted local storage are part of the product. If cloud sync is added, design server-enforced shop/store membership, least privilege, session invalidation, and recovery from the outset.

**Acceptance:** Direct links, reloads, role switches, imports, and action calls cannot defeat the intended application permission model; customer/imported strings render only as data.

### 4. Build an actual synchronization protocol

Choose Firebase, Supabase, or another backend after defining the data model and conflict policy. Neither provider has been selected in the repository. Consider cost, authentication, row/document authorization, offline behavior, exportability, and operational maintenance.

Each client needs a durable outbox with actual mutation payloads, device/operation IDs, idempotency keys, retry/backoff, and explicit server acknowledgements. It also needs incoming-change application, tombstones, version tracking, and a migration/bootstrap path for existing shops. Do not delete pending work until acknowledged.

Decide what two disconnected devices may do when both sell the final unit. Merely merging full JSON snapshots will lose transactions. Stock reservations, allowed oversell policies, or a designated counter are product decisions, not implementation details that a generic merge can settle.

**Acceptance:** Two devices can work offline, reconnect in either order, retry interrupted uploads, and converge without duplicate bills, missing payments, or cross-store leakage. The UI clearly distinguishes saved locally, pending upload, synced, and conflict requiring attention.

### 5. Finish voice, language, and accessibility as one shop-floor workflow

Preserve the confirmation sheet, but make the parser report partial/ambiguous matches instead of guessing. Add explicit units to products if loose-weight sales are intended; stripping “gram” or “kilo” does not convert quantities. Build a small, consented evaluation corpus with varied pronunciation, product names, code-switching, and background noise.

Move every visible label, error, receipt string, and accessibility name into the localization system. Improve focus restoration and keyboard access, label all inputs, and test screen-reader announcements and modal behavior. Confirm recognition support and offline fallbacks on the actual Android/browser combinations being targeted.

**Acceptance:** Unknown products cannot appear as confident matches; quantities and units survive parsing; a Hindi-speaking shopkeeper can finish the primary flows without encountering essential untranslated instructions.

### 6. Complete receipts, printers, and operational release support

Design a proper 58mm layout, including long item names, paise, discounts, mixed tax rates, cancelled/refunded receipts, and scannable QR sizing. Decide whether browser printing is sufficient or a transport integration is needed. Do not assume successful matrix decoding means a tiny printed QR will scan reliably.

Add a repeatable test command and CI for domain calculations, imports, persistence, roles, parser fixtures, QR decoding, and a small browser smoke suite. Document local development and static deployment, secure the dev server, namespace service-worker caches, and test first install, update while open, and offline restart. Add a changelog and versioned schema/release process.

**Acceptance:** A selected Android device prints and reprints accurate receipts on named 58mm hardware; old data survives upgrades; a cold offline start succeeds after installation; the release can be rolled back or recovered.

## Suggested milestones

| Milestone | Scope | Exit condition |
|---|---|---|
| M0 — Trustworthy single-device counter | P1 bug fixes, validation, durable storage, stock/ledger invariants, injection and role fixes | Exact accounting/stock regression tests pass; recovery and restore tested; no known P1 defects open. |
| M1 — Complete local shop workflows | Returns/credits, purchase payments, cash opening/closing, full exports, Hindi completion, safer voice, accessibility | Representative scripted shop tasks succeed on a target phone with parallel reference records. |
| M2 — Printing and controlled field pilot | Named 58mm devices, offline/install/update checks, pilot instructions, usability feedback | Shopkeepers complete daily tasks, backup/recovery drills work, pilot discrepancies are explained and fixed. |
| M3 — Multi-device/cloud | Backend, remote auth, store permissions, outbox, inbound sync, conflicts, migration | Offline/retry/concurrent-device tests converge and the migration preserves all records. |
| M4 — Regional expansion | Additional language packs, aliases, recognition evaluation, local review | Each language meets the same task, safety, and recovery criteria as Hindi/English. |

No dates or effort estimates are asserted here; the repository does not establish them. Printing or cloud work can be prioritized differently if a specific shop urgently needs it, but correctness and data preservation should remain release gates.

## Decisions to settle with Sammarth

1. Which first pilot shop, phone/browser, product count, daily bill volume, and printer should define the initial supported target?
2. Are prices GST-inclusive, and are loose-weight/unit-converted products required?
3. How should returns, advances, overpayments, opening balances, and stock adjustments work?
4. Is the first release strictly one device, or must concurrent offline counters be supported immediately?
5. What privacy, recovery, staff-permission, and hosting-cost promises should the product make?

These decisions were not required to complete this audit. They are the inputs needed to turn the current broad prototype into a realistic implementation backlog.
