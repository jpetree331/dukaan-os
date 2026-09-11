# Dukaan OS — build and verification sprint plan

**Plan only; no future feature sprint has started.** Created 11 September 2026 against application commit `74dfc18282d0faaff9db03ff2453e8cdb9c18935`. Start execution with [VERIFY-00](cards/VERIFY-00.md), after the user requests implementation.

The recommended approach is **small vertical builds, a separate verification sprint after every build, and cumulative seam coverage**. Preserve the current plain-JavaScript counter while extracting transaction and persistence contracts. Finish dependable local workflows before enabling cloud writes for real shops. Treat regional languages, printer hardware and optional vault encryption as explicit, separately gated deliverables.

There are **29 core build sprints + 29 paired verification sprints**, an initial VERIFY-00, and **2 optional vault builds + 2 verifications**. This is a staged backlog, not a commitment to execute 63 sprints unattended or to ship every extension before a useful local pilot.

## Read this package

- [Decision register and architecture proposal](DECISIONS.md): assumptions, product choices and primary-source backend references.
- [Verification strategy](VERIFICATION.md): every-build pair coverage, older-pair invalidation, higher-order journeys and release gates.
- [All 465 seam pairs](SEAM-MATRIX.md), with [machine-readable evidence slots](seams.json).
- [Report and push protocol](DELIVERY.md), [build report template](templates/BUILD-REPORT.md) and [verify report template](templates/VERIFY-REPORT.md).
- [Current planning report](reports/PLAN-00.md): what this planning pass did, why and what it did not execute.
- [Historical future-design audit](sources/DESIGN-REVIEW-2026-09-11.md), [bug repairs](../BUGFIX-PASS.md) and [security pass](../SECURITY-HARDENING-PASS.md). Historical defects already repaired are not fresh feature work.
- [plan.json](plan.json) is the structured sprint inventory. `npm run plan:check` checks its dependencies, cards, pair coverage and links; it does not run future tests or certify readiness.

## Milestones and useful stopping points

| Checkpoint | New value | Required gate |
| --- | --- | --- |
| Foundation | Awaitable commands, atomic local records, recoverable migration and compatible backups | VERIFY-04; no real-data cutover before the migration/recovery gate |
| Complete local books | Draft recovery, opening balances, returns/refunds, supplier corrections, stock adjustments/transfers, cash sessions and reconcilable statements | VERIFY-12; a full synthetic shop day reconciles |
| Local shop pilot | Hindi/accessibility, safer units/voice, narrow receipts, one proven printer and operating/recovery kit | VERIFY-18 plus named phone/printer/native-user evidence |
| Two-device cloud pilot | Trusted identity, authoritative operations, durable bidirectional sync, bounded offline stock and visible conflict recovery | VERIFY-25; direct API authorization and outage/recovery tests plus independent review |
| Regional expansion | Shared language framework and reviewed Marathi, Tamil and Bengali flows | VERIFY-29 and all gates for locales being advertised |
| Optional at-rest privacy | Encrypted local repository and complete key/migration/recovery lifecycle | D10, VERIFY-30/31 and independent review; not enabled by default |

The short-sprint rule is one observable outcome, normally 1–2 focused engineering days and a 3-day split threshold. Verification has its own time budget and cannot be traded away to meet that estimate. Later hardware, field and cumulative tests may take longer in elapsed time. No dates, staffing availability, provider spend or hardware access are assumed.

## Default sequence and dependencies

Read a build card and its verification card as one cycle. Dependencies identify actual prerequisite gates; the table order is the recommended integration order. For example, local backend work can proceed from verified local contracts while printer hardware is unavailable, and language-pack scaffolding need not wait for a cloud pilot. Use a separate branch from an appropriate verified checkpoint for such work; when tracks combine, verify the combined code and all newly coexisting pairs.

| Build | Deliverable | Verify next | Prerequisite gates |
| --- | --- | --- | --- |
| [BUILD-01](cards/BUILD-01.md) | Domain contracts and reference fixtures | [VERIFY-01](cards/VERIFY-01.md) | VERIFY-00 |
| [BUILD-02](cards/BUILD-02.md) | Awaitable commands and storage boundary | [VERIFY-02](cards/VERIFY-02.md) | VERIFY-01 |
| [BUILD-03](cards/BUILD-03.md) | Transactional IndexedDB repository | [VERIFY-03](cards/VERIFY-03.md) | VERIFY-02 |
| [BUILD-04](cards/BUILD-04.md) | Legacy migration and recovery cutover | [VERIFY-04](cards/VERIFY-04.md) | VERIFY-03 |
| [BUILD-05](cards/BUILD-05.md) | Resumable drafts and immutable sale records | [VERIFY-05](cards/VERIFY-05.md) | VERIFY-04 |
| [BUILD-06](cards/BUILD-06.md) | Opening balances, customer credits and collections | [VERIFY-06](cards/VERIFY-06.md) | VERIFY-05 |
| [BUILD-07](cards/BUILD-07.md) | Customer returns and refunds | [VERIFY-07](cards/VERIFY-07.md) | VERIFY-06 |
| [BUILD-08](cards/BUILD-08.md) | Supplier corrections and credit notes | [VERIFY-08](cards/VERIFY-08.md) | VERIFY-07 |
| [BUILD-09](cards/BUILD-09.md) | Stock adjustments and expiry write-offs | [VERIFY-09](cards/VERIFY-09.md) | VERIFY-08 |
| [BUILD-10](cards/BUILD-10.md) | Store assignments and stock transfers | [VERIFY-10](cards/VERIFY-10.md) | VERIFY-09 |
| [BUILD-11](cards/BUILD-11.md) | Cash shifts, expenses and closing | [VERIFY-11](cards/VERIFY-11.md) | VERIFY-10 |
| [BUILD-12](cards/BUILD-12.md) | Statements and reconciliation reports | [VERIFY-12](cards/VERIFY-12.md) | VERIFY-11 |
| [BUILD-13](cards/BUILD-13.md) | Hindi and accessible core navigation | [VERIFY-13](cards/VERIFY-13.md) | VERIFY-12 |
| [BUILD-14](cards/BUILD-14.md) | Hindi and accessibility for money and recovery | [VERIFY-14](cards/VERIFY-14.md) | VERIFY-13 |
| [BUILD-15](cards/BUILD-15.md) | Quantity units and safer noisy-shop voice | [VERIFY-15](cards/VERIFY-15.md) | VERIFY-14 |
| [BUILD-16](cards/BUILD-16.md) | 58 mm receipt layouts | [VERIFY-16](cards/VERIFY-16.md) | VERIFY-15 |
| [BUILD-17](cards/BUILD-17.md) | One tested printer transport | [VERIFY-17](cards/VERIFY-17.md) | VERIFY-16 |
| [BUILD-18](cards/BUILD-18.md) | Local pilot and recovery release kit | [VERIFY-18](cards/VERIFY-18.md) | VERIFY-17 |
| [BUILD-19](cards/BUILD-19.md) | Local backend identity and store authorization | [VERIFY-19](cards/VERIFY-19.md) | VERIFY-12 |
| [BUILD-20](cards/BUILD-20.md) | Atomic server command processing | [VERIFY-20](cards/VERIFY-20.md) | VERIFY-19 |
| [BUILD-21](cards/BUILD-21.md) | Durable outbox and authenticated upload | [VERIFY-21](cards/VERIFY-21.md) | VERIFY-20 |
| [BUILD-22](cards/BUILD-22.md) | Incoming changes and initial hydration | [VERIFY-22](cards/VERIFY-22.md) | VERIFY-21 |
| [BUILD-23](cards/BUILD-23.md) | Bounded offline stock authority | [VERIFY-23](cards/VERIFY-23.md) | VERIFY-22 |
| [BUILD-24](cards/BUILD-24.md) | Conflict resolution and existing-shop onboarding | [VERIFY-24](cards/VERIFY-24.md) | VERIFY-23 |
| [BUILD-25](cards/BUILD-25.md) | Cloud operations and two-device pilot | [VERIFY-25](cards/VERIFY-25.md) | VERIFY-24 |
| [BUILD-26](cards/BUILD-26.md) | Regional language-pack foundation | [VERIFY-26](cards/VERIFY-26.md) | VERIFY-14, VERIFY-15, VERIFY-16 |
| [BUILD-27](cards/BUILD-27.md) | Marathi pack and task validation | [VERIFY-27](cards/VERIFY-27.md) | VERIFY-26 |
| [BUILD-28](cards/BUILD-28.md) | Tamil pack and task validation | [VERIFY-28](cards/VERIFY-28.md) | VERIFY-26 |
| [BUILD-29](cards/BUILD-29.md) | Bengali pack and task validation | [VERIFY-29](cards/VERIFY-29.md) | VERIFY-26 |
| [BUILD-30](cards/BUILD-30.md) (optional) | Encrypted local vault and key lifecycle prototype | [VERIFY-30](cards/VERIFY-30.md) | VERIFY-04, VERIFY-25 |
| [BUILD-31](cards/BUILD-31.md) (optional) | Vault migration and end-to-end recovery | [VERIFY-31](cards/VERIFY-31.md) | VERIFY-30 |

## Mapping to Sammarth's stated roadmap

| Stated README goal | Implementation path | Evidence that closes it |
| --- | --- | --- |
| Real cloud sync for two devices | BUILD-01–04 foundations; BUILD-19–25 cloud track | Direct authorization tests, replay/idempotency, both reconnect orders, bootstrap, last-unit/offline-allocation cases and a controlled two-device pilot |
| Better Hindi speech on noisy shop floors | BUILD-13–15 | Reviewed units/aliases, held-out utterances, ambiguity checks, consented noisy audio and actual target-browser behavior; typed parser fixtures alone do not prove recognition accuracy |
| Marathi, Tamil, Bengali | BUILD-26–29 after Hindi/accessibility contracts | Native-reviewed task completion per language, formatting/ID invariance, glyph/receipt and unavailable-speech tests |
| Common 58 mm printers | BUILD-16–17 | One named physical device/transport proven first, including reprint/disconnect and QR scan; expand the matrix later |
| Field testing with shopkeepers | BUILD-18 and BUILD-25 | Agreed participant scope, parallel reference records, discrepancies resolved, recovery drills and explicit release verdict |

Additional local workflows in BUILD-05–12 come from the earlier design audit, not an invented claim that Sammarth already committed to them. They make the advertised billing/ledger system usable and verifiable. The optional vault comes from the remaining security design question.

## Essential design rules

1. A finalized operation is immutable; mistakes produce linked corrections. Projections, printed receipts and reports must be explainable from recorded facts and disclosed legacy checkpoints.
2. Local effects and their durable operation/outbox record commit atomically. UI success follows commit. Replayed operation IDs cannot charge twice; reused IDs with changed payloads fail.
3. History is not repaired by inventing unavailable old batch/tax/loyalty facts. Migrations preserve provenance, exceptions and recovery copies until verified.
4. Cloud identity and per-shop/store authorization are independent of local convenience login. Server commands verify permission and input; clients cannot choose authoritative balances.
5. Cloud-linked restore and device rejoin are reconciliation flows. Never upload an old whole-database snapshot over live cloud history.
6. Offline concurrency is a business constraint, not a generic merge function. Proposed bounded device allocations must be agreed and tested; no automatic reclaim from an unreachable till.
7. Shared browser origin, unlocked-device compromise, unknown legacy copies and missing physical/native-review evidence remain explicit limits until the corresponding design is actually delivered.
8. Every sprint pushes its own factual report. Built, verified, independently reviewed, merged and deployed are separate states.

## What to do next

When implementation is requested, execute VERIFY-00 and publish its report before BUILD-01. Resolve only decisions that block the next concrete slice. If the initial operating goal changes (for example, a printer is urgently needed before new money workflows), reorder the dependency-compatible track and regenerate its seam ownership/evidence requirements rather than skipping verification.
