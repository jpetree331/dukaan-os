# Per-sprint reports, commits and pushes

The user requested this planning package first. All future BUILD/VERIFY cards are **planned**, not executed. Creating this plan does not start deployment, provisioning, participant outreach or the next build.

## One reviewable build and verification cycle

1. Start from the last verified integration commit. Use a named working branch such as `sprint/build-01-domain-contracts`; these are proposed branch names, not existing branches. Keep a blocked hardware/provider track separate so it does not contaminate independent work.
2. Implement only the card's scope, with meaningful regression tests and a recovery path. If the slice exceeds the size limit, split it first and extend the dependency/seam manifest.
3. Commit code and tests. Run the documented builder checks against that code commit. Write `docs/sprints/reports/BUILD-NN.md` from the report template with **what changed, why, evidence, deviations, risks and incomplete work**. Record the exact tested code hash; report-only commits may follow without pretending a self-referential commit hash is possible.
4. Push the branch and report to the user's fork. Verify the remote branch SHA. Set status to `built-unverified`; a successful push or green CI is not the verification sprint.
5. Run VERIFY-NN on that pushed application tree, including its prior-build seams, reopened older seams and affected higher-order journeys. Publish `docs/sprints/reports/VERIFY-NN.md`, evidence references and matrix updates as a separate commit; push and verify the remote SHA again, even when the verdict is failed or blocked.
6. Fix defects in identifiable follow-up code commits, then rerun affected checks at their new hashes. After a passing gate, record the verified integration checkpoint and next eligible sprint. Record the latest remote SHA in the handoff/next report; do not endlessly amend a report just to put its own hash inside itself.
7. Merge or deploy only within separately authorized scope. A push to the fork is not a production release. Before production, satisfy the milestone's independent review and hardware/environment gates.

Never publish a full dump as test evidence. Small synthetic fixtures, expected/actual summaries, redacted screenshots and hashes of reviewed public artifacts are appropriate. Private review evidence needs an authorized access location, not a public customer-data attachment.

## Status meanings

| Status | Meaning |
| --- | --- |
| planned | Work has not started; a card or test recipe is not evidence. |
| in-progress | Implementation or verification is underway. |
| built-unverified | Code and builder report pushed; verify gate remains open. |
| passed | Required checks passed on the identified code tree, with evidence. Record independent versus self-verification explicitly. |
| failed | Observed behavior violates an acceptance condition. |
| blocked | A required decision, device, reviewer, service or evidence is missing; explain exactly what. |
| stale | Earlier evidence no longer covers changed code/contracts. |
| not-applicable | Seam only: reviewed non-interaction rationale plus shared-platform evidence. Not a substitute for missing tests. |

Future sprint reports must say “None” where there are no deviations, failed checks or known incomplete items, instead of silently omitting those sections. An honest failed/blocked report is still a useful deliverable and should be pushed; it must not unlock dependent work.
