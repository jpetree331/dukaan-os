# Partial returns and explicit refund payments

Returns are owner commands linked to an original sale. They preserve that sale, use its original tax/discount and batch-cost allocations, and cap cumulative returned quantity per line. An identical operation-ID retry returns the existing return; changed reuse rejects. A sale with returns cannot also be voided. Missing or inconsistent legacy allocations produce an explicit reconciliation exception rather than a guessed refund.

For each line, taxable value, tax and gross are allocated by the difference between rounded cumulative returned proportions. Integer quantities and BigInt ratios ensure the final partial return gets the remaining paise. Loyalty earned and redeemed points reverse proportionally to original gross value, in hundredths of a point; full return restores the exact original points. Later price, tax or loyalty settings do not change those calculations. A return after points were spent can leave a disclosed negative points balance.

Restock preserves original batch identity, cost and expiry. Damaged goods go to separate quarantined batches: physical stock includes them, sellable stock and checkout exclude them. Expired returned stock remains unsellable even when restocked. Disposal is BUILD-09; receiving a damaged return does not silently dispose of it or invent an expense classification.

## Debt, credit and money paid back

- Credit-sale returns reduce the customer's balance first. The part exceeding positive debt becomes customer credit and may be refunded explicitly.
- For a paid sale, choosing Customer credit adds a credit movement to the named customer, offsetting any positive balance first. A walk-in sale cannot create unnamed customer credit.
- For a paid sale, choosing Refund due creates a separate refund liability without changing the customer's unrelated balance.
- A refund payment records cash or UPI already paid, with a receipt/reference. It never calls a bank or payment provider. The payment cannot exceed the return's remaining liability; ledger-backed refunds are also limited by current customer credit. Customer credits are fungible at account level, not a reconstructed per-invoice credit-allocation system.

Returns affect net sales/tax/cost on the return date. Cash changes only on the refund-payment date. Historical cash-count records remain unchanged. Formal cash shifts arrive in BUILD-11; the refund-after-close acceptance case must be repeated at SEAM-07-11 once that feature exists. Current evidence covers the pre-existing cash-count record and separate settlement, not a future shift lifecycle.

## Worked example

Two units at 100, discount 20 and loyalty redemption 20 give taxable 160, tax 8 at 5%, and total 168. With 50 opening points, the sale leaves 31 points. A credit collection of 100 leaves debt 68. Returning one unit gives value 84, tax 4, restores 10 redeemed points and reverses 0.5 earned points: balance -16, points 40.5. A second unit return gives another 84 and restores the final points to 50, with balance -100. Refund 16 cash and 84 UPI clears the credit; drawer cash is 84 (100 received minus 16 handed back).

## UI, reports and recovery

Original receipts offer Return / refunds. The form shows remaining quantities, disposition, destination and reason, plus prior returns. Each return has a downloadable note and explicit refund recording. Its identity/currency snapshot comes from the sale; the note also shows current settlement status. Reports distinguish original bill payment modes, net sales/returns and cash refunds. Tax tables subtract the original allocated return tax; charts support negative net periods.

Optional root `returns` and `refunds` arrays fence older readers through their strict unknown-field checks. Validation recomputes return allocations and quantity limits and checks linked customer movements and settlement limits. Backups and native replay retain both records. Rewind code only with a compatible data reader; never remove compensating records to force an older client to open. Real-data migration remains gated independently. Device-scoped storage is still plaintext.

No printer hardware, payment-provider verification, production cutover or independent accounting review is claimed. The incomplete legacy-allocation path preserves the sale for owner reconciliation; no automatic historical repair is supplied.
