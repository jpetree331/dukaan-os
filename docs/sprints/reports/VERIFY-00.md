# VERIFY-00 — Baseline verification

Verdict: **passed for the desktop software baseline**. Device, installed-PWA and physical-pilot claims remain unverified. Date: 11 September 2026.

## Identity and scope

Application baseline `3e7b9c87c0310aa7b780c11b6c96eab3a594affe`; committed browser tooling and reference fixtures `9a9a79621589870f8cff890d90c4b6c8cdd7d118`. Application runtime bytes are unchanged from the repaired/security baseline. Reviewer: Codex, **self-verification**, not a separate independent reviewer. Environment: Windows, Node test runner, headless Microsoft Edge `152.0.4191.66`, Playwright, ephemeral localhost HTTP server and disposable browser contexts.

## Actual evidence

| Check | Expected | Observed |
| --- | --- | --- |
| `npm test` | All existing repair and security regressions | 36 passed, 0 failed. Includes quota rollback, corrupt-data preservation, stale snapshots, session expiry, permission rejection, backup tampering and service-worker cache behavior. |
| `npm run build` | Allowlisted public release | Passed; artifact version `cfe762d8b4473c003e78`. Existing release test inspects the public file list and headers; planning/test code is not shipped. |
| `npm run plan:check` | Complete dependency/card/pair structure | Passed: 31 builds, 32 verification cards and 465 pairs. This does not certify future behavior. |
| Browser sale/reload/void | 100.00 sale takes stock 10 to 9; void restores 10 | Passed using billing and dashboard controls; reload retains the bill and stock. |
| Browser writer/role boundaries | Second writer blocked; cashier cannot void/manage settings | Passed. No recovery download in blocked tab. Role fixture uses the application API; navigation and direct action boundary checked. |
| Browser encrypted export/restore | Download contains ciphertext; incorrect password makes no change; valid upload restores in new profile | Passed through actual download/file-input flows. Fresh profile restores stock 10 and the voided bill across restart. |
| Browser malformed import/corrupt startup | Preserve existing records/raw bytes | Passed; malformed JSON leaves records unchanged; corrupt persisted bytes survive failed boot. |
| Browser PIN and account gate | Incorrect PIN/password denied; correct credentials reopen the migrated shop | Passed through real PIN/password controls. Signup/migration fixture uses the application API. Reload demands a new login and PIN; original stock remains. |
| Browser uncaught errors | None during primary/restored flows | None. Ten browser result groups passed. |

Reproduction: [browser runner](../../../tests/browser-baseline.cjs), [environment instructions](../../../tests/BROWSER.md), existing `tests/*.test.cjs`. Expected money and quantity tables are in [reference cases](../REFERENCE-CASES.md); future cases are explicitly not claimed as executed here.

## Failures and deviations

No application failures observed in these baseline checks. The first browser launch found no bundled Chromium executable; the runner now permits the installed Edge channel. Two initial test locators did not match the actual error wording and were corrected; the final complete browser run passed. These were tooling failures, not concealed application repairs.

The browser runner uses API fixture setup, then real DOM controls for the flows identified above; this is not a claim that signup and role setup were manually exercised end to end. Quota injection and old-cache/update logic are automated module evidence. A real installed-PWA upgrade, lost-device recovery, phone performance, screen reader, printer, microphone and camera remain unavailable and are not passed. The card permits desktop foundation work while physical-pilot evidence is outstanding.

## Seams, decisions and next step

No numbered build pairs are due before BUILD-01. All 465 future pairs remain planned. D01 workload remains provisional; current collection/node/text/storage bounds have not been benchmarked at 5,000 items/50,000 transactions. D02 follows documented legacy exclusive-tax rules; no legal tax compliance claim.

Eligible next step: BUILD-01, followed by a separate VERIFY-01. This is a development baseline, not production release approval. No merge, deployment, provider provisioning or participant outreach occurred. Test and report commits are pushed together to `fix/audit-reported-bugs`; remote SHA verification is recorded in the task handoff/next report rather than embedding this report's own hash.
