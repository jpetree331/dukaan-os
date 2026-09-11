# VERIFY-01 — Domain and baseline seam verification

Verdict: **passed, self-verified**. Date: 11 September 2026. Reviewed pushed build/report checkpoint `f30a68b01288cd7e6a8fde170df45b0420b08907`; application code `9a78653294b03bede1ae2242607fb1e3159c3ddc`. Compared against VERIFY-00 `fb7e7b917d989fda34c4bd31c50e998e8680cc75`. Windows / Edge 152.0.4191.66 / disposable synthetic profiles.

## Evidence and results

`npm test`: **44 passed, 0 failed**, including three new adversarial verification groups committed with this report. Two thousand deterministic varied baskets (seed 91126) conserve subtotal minus discounts plus tax, reconcile line bases/taxes, and never allocate a negative or over-gross taxable base. These invariants complement the independently calculated M01/M02 expected totals rather than duplicating the calculator implementation.

Fractional-stock CSV updates preserve 1.0001. A later invalid line in a purchase or import aborts without partial changes. A persisted legacy bill without new metadata reloads unchanged; its void links to the old bill ID. Duplicate void is a no-op. New command metadata survives save/reload. Builder cases confirm M01 total 200.70, points 20 → 12 → 20, exact stock reversal, and Q01 stock 1 → 0.9999 → 1.

`node tests/browser-baseline.cjs` with installed Edge: **all ten groups passed**, covering actual UI sale/reload/void, second-tab denial, cashier restrictions, encrypted download/fresh-profile restore, malformed/wrong-password preservation, PIN/password gates and no uncaught page errors. Fixture setup and several permission probes use App APIs as documented; this is not claimed as physical/manual device evidence.

`npm run build` passed at `c4ee11954ab264ff9f77`. `npm run plan:check` passed. Diff inspection confirmed the declared calculation/quantity surfaces, deployment lists, tests and documentation; no migration, framework replacement or hidden backend feature. No new runtime repairs needed after the build checkpoint.

## Seam accountability

No earlier numbered build exists: zero numbered pair rows due. The complete pre-plan repaired/security baseline and real-browser recovery flows are the exercised seam. All future pairs remain planned. Relevant portions of money/stock/restore journeys now have evidence; unbuilt purchase corrections, shifts, transfers, cloud and vault portions are not marked passed. No older pair evidence exists to reopen.

## Limits and next checkpoint

Independent reviewer: **None**. No failures or additional deviations in the verification run. Desktop software evidence permits BUILD-02. Physical phone, installed-PWA upgrade, accessibility, native speech, printer and production checks remain unavailable. The numeric extraction preserves old persisted money records; stock finer than four decimals and old-client processing of new fractional records retain the recovery limitations documented in the build report. A command ID alone does not provide idempotency.

Push this verification separately from BUILD-01. Its code hash remains the application hash above; this commit adds only verification tests, report and status evidence. No merge or deployment. Remote SHA is checked after push and recorded in the next checkpoint/task handoff.
