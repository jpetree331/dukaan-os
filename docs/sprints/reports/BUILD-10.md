# BUILD-10 — Store assignments and stock transfers

Status: **built-unverified at build checkpoint**. Runtime `9222d3f3e25549be46d64b764cca785d621c7fdb`; predecessor verified remote `683f613d176527208fd338f473589c74bbf88cd9`. Date: 11 September 2026.

## Changes and rationale

Owners can review cashier-to-store assignments before activation; new staff default unassigned. Staff/store selection and action boundaries respect those assignments. Existing legacy cashiers retain current-store access until the explicit review; they cannot select other stores themselves. Owners retain full local-book store access. Profile overrides provide store-specific receipt identity/payment details and daily targets, with immutable sale snapshots and a store/day target celebration key. Restore keeps local staff/payment settings and removes assignments to missing stores. [Policy and compatibility](../STORES-AND-TRANSFERS.md).

Dispatch stages sellable stock into durable in-transit records. Destination catalog mapping is explicit and unit-checked. Partial receipts and source recalls consume original allocation slices, preserve batch cost/expiry/purchase provenance and commit both stores atomically. Recall records only remainder physically returned to source; already received goods need a reverse-direction transfer. Owner controls expose dispatch, partial acceptance, recall and history. No financial payment is generated.

## Actual evidence

- **85 module tests passed.** Six of ten units dispatch, two arrive, one sells at original cost 60 and four are recalled: source eight + destination one + sold one = ten. Supplier debt stays 600 and source-attributable supplier-returnable stock is eight. Failure/retry, over-receipt, changed destination unit, assignment denial, profile snapshot and encrypted recovery pass.
- **Six browser groups passed** on the final UI/runtime in disposable Edge 152.0.4191.66 profiles: assignment/profile/dispatch/partial-receipt/recall controls, store identity and targets, migration/replay and encrypted restore on both storage modes. The UI fixture has two separate sales, leaving seven source + one destination + two sold = ten, with zero transit.
- Inspected the desktop transfer history, then improved its wording to remove operation-ID terminology and show individual line quantities/units instead of summing unlike units. Reran the browser suite on that final change.
- Public release `b53e2bd255b359e2cd17`; plan and diff checks passed.

## Limits and handoff

The short UI dispatches one item per action; the domain supports multiple distinct items atomically. This is local-book access and settlement, not remote tenant enforcement or network delivery. Assignment/profile version markers and transfer collections fence older readers. Legacy access is not silently migrated; owner review supplies the mapping. Existing receipt snapshots remain historical, including their payment address; current restored store payment settings use local values.

Final failed checks: **None**. Independent review: **None**. No real goods, payments, provider services, production deployment or migration activation. VERIFY-10 must assess nine new pairs, reopen the prior 36 pairs, check adversarial transfer imports and staff switching, and pin the final repaired runtime before BUILD-11.
