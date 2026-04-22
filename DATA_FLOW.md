# Data Flow Guide

This document explains how data moves through the system from UI to DB and back.

## 1) Generic Request Lifecycle

1. UI builds payload from local draft state.
2. Frontend service sends API request.
3. Backend middleware resolves:
   - auth (`protect`)
   - company access (`requireCompanyAccess`)
4. Controller validates payload and calls service.
5. Service performs business logic and DB writes (often in a transaction).
6. Controller returns normalized response envelope.
7. Frontend mutation updates/invalidates React Query caches.
8. UI re-renders from updated query/store state.

## 2) Sale Order Create/Update Flow

Frontend:
- Draft state in Redux `transactionSlice`
- Create page: `frontend/src/pages/sales/SaleOrderCreatePage.jsx`
- Item selection and pricing: `frontend/src/pages/sales/ProductSelectPage.jsx`
- Payload build: `frontend/src/api/services/saleOrder.service.js`
- Mutation: `frontend/src/hooks/mutations/useCreateSaleOrder.js`

Backend:
- Route: `backend/routes/saleOrder/saleOrderRoute.js`
- Controller: `backend/controllers/saleOrderController.js`
- Service: `backend/services/saleOrder.service.js`
- Payload mapping: `backend/services/saleOrderDocument.service.js`
- Model: `backend/Model/SaleOrder.js`

Critical steps:
- Validate party ownership by company.
- Issue voucher identity (series + serials).
- Recompute totals server-side.
- Insert sale order + timeline entry.

## 3) Receipt Create/Cancel Flow

Frontend:
- Screen: `frontend/src/pages/cashTransaction/CashTransactionScreen.jsx`
- Draft persistence: `frontend/src/hooks/useCashTransactionDraft.js`
- Auto settlement: `frontend/src/utils/calculateAutoSettlement.js`
- Payload build: `frontend/src/api/services/cashTransaction.service.js`
- Create mutation: `frontend/src/hooks/mutations/useCreateCashTransaction.js`
- Cancel mutation: `frontend/src/hooks/mutations/useCancelCashTransaction.js`

Backend:
- Route: `backend/routes/cashTransaction/cashTransactionRoute.js`
- Controller: `backend/controllers/cashTransactionController.js`
- Service: `backend/services/cashTransaction.service.js`
- Doc builders: `backend/services/cashTransactionDocument.service.js`
- Models: `backend/Model/CashTransaction.js`, `backend/Model/Receipt.js`

Critical steps (create):
- Validate party and cash/bank ledger ownership.
- Issue voucher identity.
- Insert receipt.
- Insert party ledger and cash/bank ledger entries.
- Apply settlement against outstanding bills.
- Create advance-outstanding row when amount remains after settlements.

Critical steps (cancel):
- Mark receipt cancelled.
- Reverse monthly balance and ledger statuses.
- Restore outstanding pending amounts for settled bills.
- Zero advance-outstanding rows created by that receipt.

## 4) Outstanding Settlement Flow

Frontend query:
- `useSettlementOutstandingQuery` in `frontend/src/hooks/queries/outstandingQueries.js`

Frontend behavior:
- Amount entered -> auto-allocates to bills.
- User can adjust bill selection manually.
- Selected bills become `settlement_details` in payload.

Backend behavior:
- For each settlement row:
  - validate bill exists and belongs to same company/party
  - ensure settled amount <= pending amount
  - reduce pending on create
  - increase pending on cancel

## 5) Voucher Number and Serial Flow

Entry point:
- `backend/services/voucherIdentity.service.js`

Outputs:
- voucher number (series-based)
- company-level serial number
- user-level serial number

Used by:
- sale order create
- receipt create

## 6) Cache Invalidation Flow (Frontend)

Sale order create/update/cancel hooks invalidate:
- sale order detail/list caches
- voucher series number caches
- voucher summary totals

Receipt create/cancel hooks invalidate:
- cash transaction detail/list caches
- outstanding caches
- party caches
- voucher summary totals

## 7) Error and Validation Flow

Frontend:
- API errors are surfaced via toast and error state components.

Backend:
- Controllers return `400/401/403/404` for domain validation/access issues.
- Services throw status-aware errors for business rule violations.

## 8) Where to Debug by Symptom

- Wrong voucher number:
  - `voucherIdentity.service.js`
- Totals mismatch:
  - sale: `saleOrderDocument.service.js`, `salesCalculation.js`
  - receipt: settlement mapping in `cashTransaction.service.js`
- Outstanding not updating:
  - `cashTransaction.service.js` settlement loops + cancel reversal loop
- UI not refreshing after mutation:
  - relevant hook in `frontend/src/hooks/mutations/*` and query keys used there
