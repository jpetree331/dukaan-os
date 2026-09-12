# PLAN-00 — Build/verification roadmap planning report

Status: planning package completed; future feature work **not started**.

Date: 11 September 2026. Reviewed application baseline: `74dfc18282d0faaff9db03ff2453e8cdb9c18935` on `fix/audit-reported-bugs` in the user's fork. The user explicitly selected “Create and push the plan first.”

## What changed and why

- Reviewed the current README, implementation boundaries, original future-design report and both completed repair/security reports. Archived the original design review with a historical-status notice so the plan is understandable inside the repository.
- Created 29 core build cards and 29 paired verification cards, plus VERIFY-00 and two conditional local-vault build/verify cycles. Every build specifies its reason, bounded scope, exclusions, prerequisites, acceptance contract, likely code areas, recovery constraints and required pushed report.
- Separated completed repairs from new work. The plan does not rebuild encrypted backups or pretend that the old design review's repaired defects remain open feature tasks.
- Chose gradual command/persistence extraction over a framework rewrite, and a verified local counter before live cloud writes. The provisional backend direction is a locally proved Postgres/Supabase design with explicit authorization and atomic commands; provider/cost/region choices remain decision-gated.
- Created every unordered build pair explicitly: 465 total, comprising 406 core pairs and 59 conditional-vault pairs. Rows have recipe IDs, a responsible verification gate and empty evidence fields; no future seam is marked passed.
- Added cumulative journeys through money, stock, permissions, backups, languages, printing, offline concurrency and updates. Shared-contract changes reopen older pair evidence, addressing failures that a simple “test only the latest feature” approach would miss.
- Added decision gates for actual hardware, native review, pilot scope, financial semantics, cloud operations and encryption recovery. Dependency-compatible tracks may proceed separately when hardware is unavailable, but their combined code needs integration verification.
- Defined separate build and verification reports, exact-code evidence, remote-push checks and failed/blocked statuses. Pushing is distinct from merging or deploying; a build's own tests do not become an independent verification claim.
- Added `npm run plan:check` and a CI step to catch missing cards, broken links, dependency cycles, missing/duplicate seam pairs and inconsistent evidence/matrix statuses.
- Corrected stale README wording about the removed raw recovery download, development versus deployment builds, and already-completed security hardening. Linked the new plan from the README roadmap.

## Verification performed for this planning deliverable

Checks performed on the completed planning tree:

| Check | Actual result |
| --- | --- |
| `npm run plan:check` | Passed: 31 build cards, 32 verify cards, all 465 unique pairs, and relative links across 72 Markdown files checked. Dependency graph has no cycle; matrix statuses/gates agree with the structured inventory. |
| `node --check scripts/check-sprint-plan.cjs` | Passed. |
| `npm run build` | Passed; public artifact version `cfe762d8b4473c003e78`. Planning documents/tooling are excluded from the public-asset allowlist. |
| `git diff --check` | Passed. |
| Diff of runtime files versus `74dfc18` | No changes to application scripts, styles, HTML, server, service worker, public asset list, security headers or release-builder code. |

These are the relevant checks for this documentation/tooling-only pass. The previous security pass's 36-test result remains historical evidence; this planning report does not claim that VERIFY-00 or any future feature tests have run. CI has been configured to check this package on future pushes; its remote outcome is separate from these local results.

The planner is a structural check, not proof that a test recipe is sufficient, a feature works, a translation is correct, or a printer/backend has been validated. Pair recipes are starting obligations; each future verifier must record concrete assertions and observed results for the named features.

## Deviations and reasons

The original request could be read as either planning only or beginning implementation. The user clarified planning only, so no feature sprint was started. Instead of blindly rerunning every possible combination after every change, the plan uses complete pair accountability, targeted contract tests, invalidation of affected prior evidence and periodic multi-feature journeys. This retains the user's every-sprint integration requirement while making repeated verification tractable.

The two local-vault sprints are conditional. They require product/recovery decisions and independent review because encrypting the only local copy without an agreed key lifecycle can make the books unrecoverable.

## Incomplete or uncertain work

All future BUILD/VERIFY cards remain planned. Hardware/printer selection, native reviewers, field participants, exact accounting policy, backend production plan/region/budget, offline allocation policy and optional vault recovery remain explicit decisions. No provider account, production resource, new app feature, deployment, participant message or new independent review was created by this pass.

## Push and next gate

The planning package is to be committed and pushed to the existing `fix/audit-reported-bugs` branch. The final handoff records the resulting commit and remote verification, avoiding a self-referential hash inside this report. Nothing is merged or deployed. When implementation is requested, begin with [VERIFY-00](../cards/VERIFY-00.md), then [BUILD-01](../cards/BUILD-01.md) after its gate passes.
