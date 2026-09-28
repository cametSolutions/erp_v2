# Receipt Frontend Flow (Detailed)

This document explains how receipt creation and receipt detail work in the frontend.

## 1) Entry Points

- `frontend/src/pages/Home/CreateReceiptPage.jsx`
  - Opens `CashTransactionScreen` with `voucher_type="receipt"`.
- `frontend/src/pages/cashTransaction/CashTransactionScreen.jsx`
  - Main create-receipt UI flow.
- `frontend/src/components/transactions/details/ReceiptDetailView.jsx`
  - Receipt detail rendering in transaction detail page.

## 2) Draft State and Persistence

- `frontend/src/hooks/useCashTransactionDraft.js`
  - Stores all in-progress receipt data in localStorage, scoped by company and voucher type.
  - Fields include:
    - transaction date + selected series
    - party and cash/bank account
    - instrument type
    - amount
    - bill settlement selection
    - narration / cheque fields
    - current step (`main` or `settlement`)

## 3) Main Screen Structure

`CashTransactionScreen` has 2 steps:

1. `main` step
   - Header (`TransactionHeader`)
   - Party selection
   - Amount entry trigger
   - Instrument/account selection
   - Narration
   - Create action
2. `settlement` step (`AmountSettlementStep`)
   - Enter total receipt amount
   - Load party outstanding bills
   - Auto-allocate amount to bills
   - Manual bill check/uncheck adjustment
   - Continue back to main step

## 4) Outstanding Settlement Flow

Outstanding data source:

- `useSettlementOutstandingQuery` (from `outstandingQueries.js`)

Settlement algorithm:

- Initial auto-allocation uses `calculateAutoSettlement(amount, bills)`
- Manual toggle uses:
  - `getRemainingAmountToAllocate(...)`
  - `redistributeCheckedBills(...)`
- On continue, selected bill rows are converted into `settlement_details` payload rows.
- The header Back action commits the same recalculated settlement rows as Continue.
  This prevents a changed amount from being paired with older settlement details.
- Create performs a final client check that total settlement does not exceed
  the Receipt amount. The backend repeats this validation authoritatively.

Backend settlement rules:

- The client supplies the Outstanding id and settled amount.
- The backend loads the active positive DR Outstanding for the selected company
  and party.
- Bill number, bill date, classification, previous amount, remaining amount,
  and settlement date are derived from backend data.
- One Outstanding id may appear only once in a Receipt.
- Total settlement must not exceed the Receipt amount.
- Excess Receipt amount is stored as a negative CR `advance_receipt`
  Outstanding row.

## 5) Create Payload Flow

- `cashTransactionService.buildCreateCashTransactionPayload(...)` builds final API body.
- Includes:
  - header payload from `TransactionHeader`
  - party + cash/bank ids/names
  - instrument fields
  - settlement details
  - narration and cheque metadata

Create mutation:

- `useCreateCashTransaction`
  - calls API create endpoint
  - invalidates:
    - voucher series list + next number
    - voucher summary totals
    - outstanding queries
    - party queries
  - shows success/error toast

## 6) Receipt Detail Flow

- `ReceiptDetailView` displays:
  - receipt header/status/amount
  - settlement details
  - narration
  - party/account/instrument sections
  - settled vs advance totals
- Cancel action uses `CancelVoucherDialog` and `useCancelCashTransaction`.

Cancel mutation effects:

- updates receipt detail cache
- invalidates transaction/outstanding/party lists
- invalidates voucher summary totals

## 7) Key Guard Rules

- Create disabled when:
  - no company
  - header not ready
  - party missing
  - cash/bank account missing
  - amount <= 0
  - cheque mode selected but cheque number/date missing
- Instrument change resets:
  - selected cash/bank account
  - cheque fields (when switching to cash)
- Backend payer/account rules:
  - Receipt payer must be a normal `party`, not a Cash or Bank master
  - cash instrument requires a Cash master
  - cheque, UPI, NEFT, and RTGS require a Bank master
  - cheque requires a non-empty number and valid date

## 8) Quick Example Trace

1. User opens Create Receipt.
2. Selects party.
3. Opens settlement step and enters amount.
4. Bills auto-settle oldest first.
5. User adjusts checked bills.
6. Continues back to main step.
7. Selects instrument + cash/bank account.
8. Clicks Create Receipt.
9. Payload is built and posted.
10. On success, draft is cleared and user is navigated to receipt detail.
