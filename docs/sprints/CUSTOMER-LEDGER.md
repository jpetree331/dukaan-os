# Customer balance entries

Positive balance means the customer owes the shop; negative balance means credit owed to the customer. Each converted customer's `ledger` starts with an explicit dated opening or a disclosed legacy balance checkpoint. Subsequent credit sales, voids, collections, advances and signed owner corrections append entries. The stored balance is a paise projection of those entries; validation rejects a scalar value that disagrees. Reading an unconverted customer displays a virtual legacy checkpoint without rewriting the book. The first new financial command persists that checkpoint together with its new entry. Earlier movements are not invented or counted again.

An explicit opening is available only before financial history exists. Later mistakes require a reasoned correction, which changes debt/credit but does not represent cash received or paid. Collections cannot exceed current positive debt and may link to one live credit bill belonging to the same customer/store; linked amounts cannot exceed that bill. Unlinked collections apply to the customer balance. Advances record actual money received and may create credit; they are included in the existing payment-method cash projection. This sprint does not automatically allocate all historic payments across invoices or verify payment-provider settlement.

Every new collection/advance/correction/opening accepts an operation ID. The UI retains one ID for each form submission and retry. An identical retry returns the existing result; changed contents or customer/store reuse reject. Legacy callers omitting an ID get a new command and must not assume retry safety. Existing sale-draft idempotency and void idempotency remain in force.

## Worked reference

Opening debt 50 + credit sale 100 - cash collection 40 - UPI collection 30 - cash advance 100 + owner correction 5 = **customer credit 15** (balance -15). Cash received is **140**, because neither the credit sale, UPI collection nor balance correction puts cash in the drawer. A linked collection is also limited by the selected invoice's uncollected amount. The independent UI fixture instead collects 100 by UPI and receives 100 cash advance, giving balance -45 and cash 100 after the same opening/sale/correction.

## Evidence and compatibility

Customer detail shows the latest 40 balance entries; Balance CSV includes all entries and running balances. The existing complete transaction-history CSV remains available separately. UI and CSV escape user text/formulas through the existing helpers. Owner-only opening/correction checks execute at the command boundary; cashiers retain their existing collection permission for recording advances.

`customerLedgerVersion: 1` is an explicit root marker. Older clients reject this unknown field rather than silently editing a scalar balance while ignoring its entries. Legacy business books without the marker remain readable. Backups, IndexedDB journal replay and migration retain the marker and entries. Rollback must use a compatible reader or forward recovery; deleting entries to make an old version open is not supported. Real-data storage migration remains disabled pending independent review. This is an internal operational ledger, not a new statutory tax/accounting certification.
