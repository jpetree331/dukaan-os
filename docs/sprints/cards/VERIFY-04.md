# VERIFY-04 — Verify legacy migration and recovery cutover

Status: **passed for development; real-data activation pending independent review**. Build under review: [BUILD-04](BUILD-04.md).
This is a separate verification sprint, not a renamed builder checklist.

## Entry and exact scope

Read the pushed BUILD-04 code/report and its predecessor evidence. Pin the actual code commit and application tree; identify whether the reviewer is independent or the implementer. Do not infer a pass from CI or from this planning card.

Feature acceptance to demonstrate:

Interrupt at every migration stage, resume twice, compare counts/stock/balances, restore onto a fresh profile, and reject an older client without altering either copy.

## Verification work

1. Review the final diff, schema changes, migrations, untracked/generated/configuration files and feature flags against the card.
2. Run relevant existing regressions and targeted negative/failure cases. Current baseline commands are `npm test`, `npm run build` and `npm run plan:check`; add/document real-browser or backend commands where this build requires them.
3. Test the changed feature through normal UI/API entry points and at the authorization/transaction boundary. Include restart, cancellation, duplicate submission, malformed input and applicable migration cases.
4. Check **every prior build**: [BUILD-01](BUILD-01.md), [BUILD-02](BUILD-02.md), [BUILD-03](BUILD-03.md).
5. For each due row in [seams.json](../seams.json), execute or substantiate the named recipe against the two actual features. Record expected/actual results, fixture and exact code hash; N/A needs a specific reviewed rationale plus shared-platform evidence.
6. Reopen affected older-to-older seams if this build changes their shared data/contracts. Run affected [higher-order journeys](../VERIFICATION.md), including valid and invalid operation orders.
7. Inspect recovery: Publish the forward-recovery and rollback decision table. After new-version transactions exist, reconcile them into recovery; never simply swap to a stale source snapshot.

## Cumulative milestone gate

Run the storage/migration portions of J01, J05, J07 and J11 using existing supported workflows: interrupted durable writes, legacy checkpoints, encrypted restore, locked callbacks and old-client fencing. Require independent migration/recovery review before real-data cutover. Future unbuilt features remain planned; do not claim their behavior was exercised.

## Gate result and push

Use **passed**, **failed** or **blocked**, and state independent versus self-verification. Money/stock discrepancies, lost/duplicate operations, cross-shop access and unrecoverable migration prevent a pass. A test that could not run is not a successful result.

Push `docs/sprints/reports/VERIFY-04.md` from the [verification template](../templates/VERIFY-REPORT.md), updated seam evidence/statuses, and any separately identified repair commits. Verify the remote SHA. Record all deviations and incomplete evidence, or “None”. No downstream dependent feature is promoted until this gate passes on the repaired code. [Delivery protocol](../DELIVERY.md).
