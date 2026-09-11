# VERIFY-00 — Re-establish the repaired baseline

Status: **planned**. This is the first execution sprint; it has not been run by creating this plan.

## Why

The prior security pass recorded 36 passing tests and limited browser checks at `74dfc18`. Those are useful historical evidence, not a substitute for checking the actual branch, device and fixtures used for new work.

## Required work

- Confirm the current application commit and clean/understood working tree; read the repair and security reports without treating superseded behavior as current.
- Run `npm test`, `npm run build` and `npm run plan:check`; record actual counts/results and inspect deployed-artifact contents. The plan checker checks structure only.
- Use synthetic records to complete sale/reload/void, cashier restrictions, PIN/login lock, blocked second tab, encrypted backup export and fresh-profile restore in a real browser.
- Exercise quota/corruption preservation, wrong backup password, malformed import, app restart and old-client/update behavior; record missing installed-PWA/phone/printer evidence explicitly.
- Create reviewed expected-value fixtures and artifact locations for future seam tests. Propose D01 workload and D02 financial invariants without certifying tax compliance.
- Record baseline defects and close serious existing failures before using this checkpoint for new behavior. Code fixes receive their own commit and re-verification, rather than being concealed in a report.

## Evidence and delivery

Push `docs/sprints/reports/VERIFY-00.md` with the exact tested code hash, environment, actual tests, independence label, defects, limitations and remote verification result. This gate establishes the pre-plan baseline against which every build is checked. A physical-pilot gate may remain unavailable while software baseline work proceeds, but no missing evidence becomes a pass. See [verification](../VERIFICATION.md) and [delivery](../DELIVERY.md).
