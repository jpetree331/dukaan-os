# 🏪 Dukaan OS

**A billing counter that speaks the shopkeeper's language — literally — and thinks ahead for them.**

Dukaan OS is a smart billing, inventory and *udhaar* (customer credit) ledger built for small local Indian shops — kirana and general stores selling chips, chocolates and daily items. It is designed for someone who has never used software like this before, works on a cheap Android phone, and keeps working when the internet doesn't.

> Zero build step. Zero dependencies. Run `node server.js` and open the local counter.

---

## ✨ What it does

### 🧾 Billing counter
- Tap-to-add item grid with large touch targets, favourites pinned on top
- Quantity steppers, discounts, loyalty-point redemption
- Cash / UPI / Card / **Udhaar** payment modes on every bill
- Receipt rendered as an image with an embedded **UPI QR code** — share on WhatsApp, download, or print
- Owners can undo the last bill straight from the confirmation toast
- Barcode scanning via the phone camera (`BarcodeDetector`), with manual fallback

### 🎙️ Voice billing — Hindi, Hinglish and English
Say **"do packet lays aur ek maggi"** and the cart fills itself.
- Web Speech API with `hi-IN` / `en-IN`
- Understands Hindi number words (*ek, do, teen… adha, dedh, dhai*), Devanagari script, packaging words (*packet, bottle, kilo*), and spoken product aliases (*chai, pani, cheeni, doodh*)
- Live transcript shown while listening; a confirmation sheet lets the shopkeeper fix quantities before anything is added
- Fails safe — an unrecognised product is flagged as unknown, never silently billed as something else

### 📦 Inventory
- Items with price, cost, stock, category, barcode, GST rate and a Hindi name
- Auto-deducts on every sale, auto-restocks on every purchase
- **Out of stock** and **Low stock** dashboards with per-item thresholds
- Quick restock (+5 / +10 / +50 / custom) with optional expiry date
- Batch tracking with earliest-expiry-first sale allocation, recorded batch costs, and an *expiring soon* warning. Expired batches remain in physical inventory but cannot be sold.
- CSV import/export for large catalogues

### 🤝 Customers & Udhaar ledger
- Profiles with pending balance, purchase history, visits, loyalty points and birthdays
- **Swipe a customer card right to log a payment, left to send a WhatsApp reminder**
- Dues sorted by amount or days overdue, with 7 / 15 / 30-day tags
- Birthday greetings on the day

### 🚚 Suppliers — a two-sided ledger
- Record purchases; stock updates itself and the supplier's balance rises
- *What customers owe you* and *what you owe suppliers* tracked separately, with a net position
- Supplier payment due dates and overdue flags

### 📊 Reports & on-device insights
- Today / 7-day / month sales, profit, margin, best sellers, payment-mode split
- Hand-drawn SVG charts (no chart library, works offline)
- Daily **cash reconciliation** — expected drawer vs counted
- GST summary by rate (CGST / SGST) when GST is switched on
- **Smart suggestions**: restock alerts from sales velocity ("Lays sells out every 4 days"), overdue follow-ups, expiry pushes, anomalous bills, slow movers
- **Ask your shop** in plain language — *"How much did Ramesh spend this month?"*, *"रमेश का कितना बाकी है?"* — answered instantly, no server
- Morning brief / end-of-day summary in Hindi or English, with read-aloud

### ⚙️ Everything else
- **Hindi / English UI** toggle (some prompts and labels still need translation), dark mode, receipt colour themes
- Staff logins with limited cashier permissions and an activity log
- Multi-store support under one profile
- Optional 4-digit PIN lock and an optional **username/password login** (PBKDF2-SHA256, salted — never stored in plain text; off by default)
- Daily sales target with a celebration when it's hit, and a friendly **shop health score**
- One-tap full JSON backup & restore, ledger CSV export
- **Offline-first PWA** — installable, service-worker cached, with a visible device-storage/offline indicator. No cloud upload is currently implemented

---

## 🚀 Run it

**Use the local development server:**

```bash
node server.js
```

Then open <http://127.0.0.1:4173>. No `npm install` required. The server binds to loopback and serves only application assets. Use a current browser with Web Locks; production must use HTTPS. Direct `file://` launch is not supported for shop storage coordination.

Voice input and barcode scanning need **Chrome on Android or desktop**.

## 🌐 Deploy

It's a static site. Drop the folder on **Vercel**, **Netlify**, or **GitHub Pages** — no build command, output directory is the repo root. The service worker enables full offline use once deployed over HTTPS.

## 🧱 Tech

Plain HTML, CSS and JavaScript. No framework, no bundler, no CDN dependencies — every piece (charts, QR encoder, voice parser, insight engine) is hand-written so the whole app runs with zero internet.

```
index.html        app shell
css/app.css       design system — warm "neighbourhood store" palette
js/core.js        state, durable persistence, money actions, analytics
js/safety.js      data validation and exclusive browser writer lock
js/auth.js        optional accounts (Web Crypto PBKDF2)
js/i18n.js        Hindi / English strings
js/voice.js       speech → cart parser (Hindi numbers, transliteration, fuzzy match)
js/pos.js         billing counter
js/inventory.js   stock, batches, expiry, CSV
js/ledger.js      customers, udhaar, suppliers, swipe gesture
js/insights.js    dashboard, reports, restock/anomaly engine, natural-language Q&A
js/settings.js    shop, staff, stores, backup
js/ui.js          modals, toasts, confetti, SVG charts, receipt renderer
js/qr.js          QR encoder for UPI payment codes
sw.js             service worker
```

Data lives in `localStorage`, namespaced per profile. Only one Dukaan OS tab per origin can write at a time. Saves complete before a transaction is reported as successful; a failed write restores the prior in-memory state. Export backups regularly. Cloud sync needs a real backend, authenticated writes, durable operations and conflict handling; the legacy queue is not a complete replication log.

The optional login and staff PIN are local convenience controls. Shop data and PINs are not encrypted, and someone with browser/storage access can bypass them. Set an owner staff PIN before switching to a cashier. Broader security hardening remains separate work.

## Verification and repair notes

Run `npm test` with Node 22 or newer. Tests use synthetic, in-memory shop data and a disposable local server; no dependencies or real shop records are needed. See [the repair report](docs/BUGFIX-PASS.md) for the B01–B30 mapping, browser checks, compatibility choices and remaining limitations.

- New bills retain consumed batch details and redeemed-point counts so voids can reverse them accurately. Historical bills cannot recover batch metadata that the old code never stored.
- Payments larger than the outstanding balance are rejected. Voiding a repaid credit bill records a negative customer balance as credit owed; subsequent udhaar bills offset that credit. A separate cash-refund workflow is still future work.
- Purchases record cash/UPI/card mode; historical purchases without a mode are treated as cash for reconciliation.
- Restore validates the complete v2 data shape and references before replacement, and retains the previous data under the account's `.before-restore` storage key. Invalid stored data stops startup and offers a raw recovery download. It is never automatically erased.
- GST reports and profit exclude collected tax appropriately; these are operational estimates, not a replacement for accounting review. Payment modes are manual records, not verified collections.

## 🗺️ Roadmap / help wanted

This is an open project and I'd love collaborators. Things I want to get right next:

- Real cloud sync (Firebase / Supabase) so a shop can use two devices
- Better Hindi speech accuracy on noisy shop floors
- More regional languages (Marathi, Tamil, Bengali…)
- Printer support for common 58mm thermal receipt printers
- Field testing with actual shopkeepers

Ideas and PRs welcome — open an issue or reach out.

## 📄 License

MIT
