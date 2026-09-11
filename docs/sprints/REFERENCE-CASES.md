# Reference cases and provisional domain rules

All records are synthetic. Amounts are rupees in these explanatory tables; calculations in BUILD-01 will use integer paise. These are product invariants, not tax-law certification.

## M01 — Mixed rates, fractional quantities, discount and redemption

| Line | Quantity | Price | Gross | Discount/redemption share | Taxable | Rate | Tax |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Rice | 1.25 | 80.00 | 100.00 | 10.00 | 90.00 | 5% | 4.50 |
| Soap | 2 | 50.00 | 100.00 | 10.00 | 90.00 | 18% | 16.20 |

Subtotal 200.00; manual discount 10.00; redemption 10.00; taxable 180.00; tax 20.70; payable 200.70. Customer starts with 20 points, point value 1.00, earns floor(200.70 / 100) = 2; ends with 12. Full void restores 20 points and exactly 1.25 rice + 2 soap. Changing current rates, item labels/prices or loyalty value must not recalculate this persisted invoice or its redemption.

## M02 — Last-paise allocation compatibility

Two 100.00 lines at 5% and 18%, manual discount 0.01: gross 200.00; net 199.99. Preserve the current rule: round proportional taxable bases, then assign the remaining paise to the last line. Bases 100.00 and 99.99; taxes 5.00 and 18.00; payable 222.99. A later rule change needs a different calculation version; do not rewrite old records.

## Q01 — Smallest legacy quantity

A stock of 1.0000, sale of 0.0001, then full void must produce 0.9999 then 1.0000. Quantities have four decimal places (scale 10,000), independently of two-decimal money. Quantities beyond this precision require rejection, never silent rounding. This case will be exercised in BUILD-01 and its verification; defining it here is not a baseline pass claim.

## Recovery and authority

- Failed persistence leaves the last committed book, bill counter, stock, points and balances unchanged. No receipt or success announcement precedes durable success.
- Invoice lines preserve prices/rates/cost allocations and names as sold. Corrections link to originals; they do not quietly rewrite earlier money facts.
- Actor, account, store, command ID and recorded time belong to the accepted operation. A client timestamp is metadata, not trusted server ordering.
- Legacy records missing exact allocations/identity are labelled legacy; missing history cannot be reconstructed by guessing.
- Current convenience roles protect normal client workflows only. Server authorization arrives in the cloud sprints.

## D01 provisional workload

The proposed 5,000-item/50,000-transaction fixture is a future stress target, not verified capacity. VERIFY-00 uses small synthetic records. Current per-collection, total-node, text and backup-size bounds can reject that stress target before localStorage capacity is reached. Measure and revise limits with the storage sprints and a named phone before making pilot capacity claims.
