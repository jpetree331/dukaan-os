# Verification between every sprint

## Build → verify → promote

Run VERIFY-00 before feature work. Every BUILD-NN is followed by VERIFY-NN, on the exact pushed application code being evaluated. A build report records implementation and builder checks; a verification report records observed behavior, independent expectations and defects. These are different claims.

A fresh reviewer or separate context is preferred. Storage migration, cloud authorization, offline stock authority and encryption release gates require a reviewer other than the implementer before production promotion. If the same person performs both phases, label the result **self-verified**, not independent. Do not imply that an agent, hardware test or external reviewer exists when it does not.

Target one demonstrable slice per build: normally 1–2 focused engineering days, with a 3-day ceiling. A verify slice normally takes 0.5–1 day initially; later cumulative verification is sized by actual runtime and risk. These are sizing heuristics, not schedule promises. Split an oversized build into stable sub-IDs with its own verification and pair entries before starting it. Do not fit more scope into the timebox by dropping failure tests.

## All-pairs coverage without all-pairs guesswork

There are 31 planned build slices: 29 core and 2 conditional vault slices. [seams.json](seams.json) explicitly contains all **465 unordered pairs**; 406 are between core builds and 59 involve the optional vault. [SEAM-MATRIX.md](SEAM-MATRIX.md) is the readable index. Every pair is initially `planned`, never pre-passed.

At VERIFY-NN:

1. Assess the new build against every earlier build, including ones that seem unrelated. Read their changed files, data/contracts, failure behavior and stored records. A missing shared source file does not prove non-interaction.
2. Run direct interaction tests when the features share data or a workflow. Run the shared-platform recipe for indirect pairs (for example, printer layout versus a persistence migration). A row may reference an existing test only if its assertions actually demonstrate that specific seam.
3. Record both directional scenarios when meaningful: old data through the new feature, and data created by the new feature through the older feature. Test valid order, invalid order, duplicate delivery and interrupted order where applicable. This is not a claim that all operations commute.
4. Attach the fixture, exact tested commit, command/device/browser, expected/actual result and report link to each row. One journey may substantiate several rows, but map its assertions to each row; a blanket “all tests green” is not evidence for 465 seams.
5. A `not-applicable` row requires a specific non-interaction rationale, named reviewer and shared-platform evidence. Untested, unavailable hardware and unknown behavior are `blocked` or `planned`, never N/A.
6. When a later build changes a shared contract, invalidate affected **older-to-older** evidence too. For example, a sync change can reopen sales × returns, and a locale formatter change can reopen every language × printer pair. Track this as `stale` until rerun at the new code commit. A code change after a verification pass invalidates affected evidence.

The default pair owner is the verification sprint of the later numbered build. If independent tracks are reordered, its actual gate is **the first verification where both implementations coexist**. Reassign the gate and rerun the pair when integrating branches; neither branch's isolated pass proves the merged result. Split or newly added builds require new pairs with every existing build. The structural checker does not decide semantic coverage or certify a release.

If an earlier-numbered feature is not implemented on an independent branch, leave its pair `planned` and explicitly transfer responsibility to the later integration gate; do not mark it passed or N/A. The branch's verification report lists this deferred pair inventory and the features actually present. It may verify that bounded branch, but cannot promote a milestone requiring the absent feature. All deferred pairs become due when their implementations first coexist.

## Shared seam recipes

Each pair lists applicable recipe IDs. The verifier must turn these into assertions about the two named features, rather than merely execute a generic smoke test.

| Recipe | Required behavior |
| --- | --- |
| BASE | Use the earlier and newer feature in one supported shop journey, reload, and check both outputs. Exercise cancellation/error and keep unrelated records unchanged. Check the actual changed dependency graph before declaring the pair indirect. |
| MONEY | Reconcile integer money, tax allocation, loyalty, credit/liability and cash to an independently computed reference. Include fractions, zero, limits, corrections and date boundaries. |
| STOCK | Reconcile physical, sellable, reserved, in-transit and quarantined quantities plus batch costs; test depletion, expiry, reversal and duplicate operation IDs. |
| AUTH | Owner, cashier, inactive/removed user, foreign store/shop, direct invocation, expiry, lock and role change during an async action. Server tests bypass the UI and use real restricted identities. |
| STORE | Abort/restart/quota/duplicate writes and delayed completion. Commit related effects together, preserve pending drafts/operations, rebuild projections and compare persisted state after reopen. |
| SCHEMA | Old/new versions, migration idempotency and interruption, malformed references, old-client fencing, mixed-version devices and backup compatibility; never invent missing historical facts. |
| RECOVER | Encrypted export → fresh installation restore; wrong key/tamper/old backup; pending-command reconciliation; key or device loss; no unintended credential/UPI replacement or plaintext-copy leak. |
| UI | Real browser through primary, empty, error and retry states. Keyboard/focus/large text; cancel on lock/context change; no duplicate submission or success before commit. |
| LOCALE | Same canonical IDs, units and amounts in every enabled language; missing strings, long text, fonts, pronunciation ambiguity and recognition unavailable/offline behavior. |
| RECEIPT | Sale/partial return/void/reprint preserve recorded values and identity; long names, script glyphs, QR decode and no duplicate sale from print/retry. Physical printer claims require hardware. |
| REPORT | Journal, projection, statement, screen, CSV and printed result agree, with complete history and explicit legacy/rounding exceptions. |
| RELEASE | Public-assets-only output, deployed headers, install/update/waiting tabs, offline reopen, schema compatibility, mixed client versions, rollback/forward recovery and absence of secrets in artifacts. |

Baseline guards from the bug/security work apply to **every** build even when it is absent from the 31-build matrix. Security, migration, exports and release behavior are cross-cutting responsibilities, not features that can be omitted from a UI sprint's review.

## Higher-order journeys and checkpoints

Pairwise testing cannot find every three-feature failure. Run the following growing journeys after each relevant change and in full at VERIFY-04, 12, 18, 25 and 29; VERIFY-31 repeats all enabled journeys under vault encryption. A milestone cannot pass with mandatory hardware/security evidence missing.

| Journey | Features crossed | Independent expected outcome |
| --- | --- | --- |
| J01 saved sale | contracts → async commit → repository → draft → receipt | One sale and one stock deduction after double-click, reload or interrupted acknowledgement. |
| J02 customer money | opening debt → sale → partial collection → return → refund → cash → statement | Every paise has an explained receivable, receipt, refund or cash movement; no unexplained balance clamp. |
| J03 supplier stock | receipt → partial payment → batch sale → supplier return/correction → cash/report | Consumed cost is preserved; returned stock and supplier credit are not counted twice. |
| J04 multi-store | assignment → transfer → in-transit stock → sale → receipt/report | Actor/store boundaries hold and quantity is conserved across stores and transit. |
| J05 difficult history | legacy checkpoint → new operation → encrypted backup → fresh restore → report | Historical caveats remain explicit, new entries reconcile exactly, current access/UPI policy is preserved. |
| J06 shop-floor input | Hindi/other locale → voice unit conversion → confirmation → sale → 58 mm receipt | The intended product, unit and quantity survive all layers; no unconfirmed guess becomes a bill. |
| J07 late callbacks | modal/voice/camera/crypto → lock/logout/store switch → delayed result | No stale callback publishes, saves, reopens private UI or leaks another context's data. |
| J08 disconnected till | sale → durable outbox → server commit → lost acknowledgement → retry → inbound pull → report | Accepted operations apply once and both devices converge; rejected operations remain visible and recoverable. |
| J09 last unit | device allocations → concurrent offline sales → expiry/revocation → reconnect → conflict review | No double allocation or silent stock overwrite; physical exceptions require explicit reconciliation. |
| J10 dangerous restore | queued operation → old backup restore → remote changes → rejoin | No duplicate operation, rollback of cloud history, deleted record resurrection or silently discarded pending work. |
| J11 live upgrade | old PWA tab → new asset/schema release → offline restart → pending operation recovery | No mixed-version write corruption; unfinished work is recovered or rejected with a safe path forward. |
| J12 privacy lifecycle | vault rotation → encrypted export → new device → membership revocation → local deletion | Keys and owned copies follow the documented lifecycle; no claim of remotely erasing an unreachable device. |

Use named seeds and independent expected-value tables, then add generated/randomized sequences with saved seeds for reproducibility. Include reversal of operation order where legal; invalid sequences must fail without partial effects. Do not make test expectations by calling the production calculation under test.

## Evidence and release rules

- Existing commands: `npm test`, `npm run build`, and (added with this plan) `npm run plan:check`. Future browser/backend/device commands must be introduced and documented by the responsible sprint; they are not available today merely because this plan mentions them.
- Treat a unit/VM test, real-browser test, local backend policy test, deployed test, native-language review and physical printer test as different evidence classes.
- Fail a gate for unresolved money/stock divergence, duplicate/lost operation, cross-shop exposure, unrecoverable migration, misleading success, or stale unauthorized action. Do not waive these as cosmetic issues.
- Other defects receive severity, owner and a bounded follow-up; untested requirements remain blocked. Do not call a sprint verified while required cases are skipped.
- Keep data synthetic or explicitly consented. No customer files, credentials, production databases, raw audio or private telemetry in commits or public sprint reports.
- Verification fixes are separate code commits with root cause and affected seam rows; rerun the gate on the repaired commit. Do not bury unverified feature work inside a verification report.
