# Domain Glossary

## A

### Advance Amount
In receipt flow, the amount left after settling selected outstanding bills.  
Formula: `advance = receipt amount - total settled amount`.

## B

### Bill Pending Amount
Remaining unpaid amount on an outstanding bill (`bill_pending_amt`).

### Bill Settlement
Allocating receipt/payment amount to specific outstanding bills.

## C

### Cash/Bank Ledger
Ledger entry collection that tracks movement in cash or bank accounts for vouchers.

### Classification (`dr` / `cr`)
Outstanding direction marker:
- `dr`: debit-side pending (receivable context)
- `cr`: credit-side pending (payable/refund context)

### Company Scope (`cmp_id`)
Tenant boundary. Most queries and writes must be restricted by company id.

## D

### Draft
In-progress frontend form state, often persisted in localStorage (for receipt) or Redux (sale order).

## L

### LSP (Last Sale Price)
Party-level last sale price used as a rate fallback in sale-order item selection.

### GSP (Global Last Sale Price)
Global/default last sale price fallback when party-level price is unavailable.

## O

### Outstanding
A bill-level record used for settlement tracking (`backend/Model/oustandingShcema.js`).

## P

### Party
Business counterparty (customer/vendor/account) selected for vouchers.

### Price Level
Named pricing tier. Product rows may define `priceLevels[]` with level-specific rates.

## R

### Receipt
Incoming-money voucher type in current flow (`voucher_type = "receipt"`), stored using `Receipt` model.

### Round Off
Final adjustment applied to totals where configured/used.

## S

### Sale Order
Order voucher with items, taxes, charges, and totals, before/independent of cash receipt.

### Series
Voucher numbering bucket with prefix/suffix/current number settings.

### Settlement Details
Per-bill rows attached to receipt/payment indicating how amount was allocated.

### Status
Lifecycle field for vouchers:
- sale order: `open`, `converted`, `cancelled`
- receipt/payment: `active`, `cancelled`

## T

### Timeline Entry
Unified voucher timeline/index record for listing and daybook-style views.

### Transaction Header
Shared frontend header block for date + voucher series/number selection.

## U

### User-level Serial Number
Serial counter scoped to creator user + transaction type.

## V

### Voucher
Generic term for transaction document (sale order, receipt, etc.).

### Voucher Identity
Combined numbering output:
- display voucher number
- series number
- company-level serial
- user-level serial
