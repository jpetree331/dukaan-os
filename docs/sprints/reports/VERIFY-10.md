# VERIFY-10 — Store access, transfers and cumulative integration

Verdict: **passed after separate repairs, self-verified**. Build `9222d3f3e25549be46d64b764cca785d621c7fdb`; verified build/report remote `2cadd31d5e1993c6e9c2f1bdf531aab65692f460`; final runtime **`90236593930631d4831208bd539fd22071563a35`**. Date: 11 September 2026.

## Findings and actual checks

- Import validation lacked the command's expired-at-dispatch and unique-source-item checks. Adversarial tests now reject both, along with changed received-batch cost. A duplicate-line fixture initially reused the same array object and hit the existing object-bound check; deep-copying it exercised the intended JSON import condition.
- Two tiny received batches displayed 0.00030000000000000003 physical units. The shared itemStock total now normalizes to the established four-decimal quantity scale.
- The shell still hid the store picker from cashiers even when assignments permitted store selection. It now shows the assigned-store picker; a new browser journey proves actual PIN staff switching, filtered store choices and direct wrong-store denial.

**87 module tests and 77 browser groups passed** on the final repaired runtime. Browser groups: stores/transfers 8, adjustments 6, suppliers 6, returns 6, customer ledger 6, drafts 8, baseline 12, native repository 9, migration 16. All used disposable Edge 152.0.4191.66 profiles and synthetic books. Release `2c996035b8c5566483b4`; whitespace and plan checks passed. Final diff/schema/public assets reviewed.

## Every prior build

| Pair | Concrete evidence |
| --- | --- |
| 01-10 | Integer-unit allocation slices conserve fractional receipts across differently costed batches; cost 90 follows the early-expiry slice and remaining source stock returns exactly ten. Shared money/quantity regressions pass. |
| 02-10 | Failed dispatch/receipt restores exact prior book; repeated IDs are exactly once, stale context and delayed-write gates pass with two-store changes. |
| 03-10 | Both store projections and transit records commit/replay together; native abort/CAS/reopen suite passes. |
| 04-10 | Transfer/assignment/profile records survive migration and encrypted fresh-profile restore, which preserves local staff/payment settings and historical receipt snapshots. Staged recovery and old-reader fencing rerun. |
| 05-10 | Main/branch sales preserve their own receipt identity after profile switches; original draft/receipt pixel/retry suites pass through store changes. |
| 06-10 | Customer debt, collections, advance and corrections stay scoped; no transfer itself changes cash or customer balance. Customer ledger UI/CSV/recovery suite passes. |
| 07-10 | Transferred goods retain original batch cost; receipt/refund/quarantine regressions pass after shared stock normalization and store scoping. |
| 08-10 | Dispatch/recall retains purchase provenance; recalled source goods are supplier-returnable at original cost without changing supplier debt. Supplier return/refund/payment suites pass. |
| 09-10 | Disposal of received fractional stock does not consume pending transit; subsequent recall reconciles the remaining ten units. Adjustment/reversal/CSV/recovery regressions pass. |

All 36 earlier pairs were reopened for shared selector, quantity, identity, restore and schema changes. **45 pairs passed; 420 future pairs planned.** No N/A waiver. The combined dispatch → partial acceptance → sale/disposal → recall → restart/restore journey conserves stock and retains separate financial history.

Remaining runtime failures: **None**. Independent reviewer: **None**. No remote authorization, cross-device settlement, real payments, real-data migration activation or physical-goods movement is claimed. Legacy cashier assignment review remains explicit; new staff are unassigned by default. Store business-date/timezone and late-entry policy will be formalized in BUILD-11. Push this gate and confirm its remote SHA before starting that sprint, including the carried SEAM-07-11 closed-shift refund test.
