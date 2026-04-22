# ERP v2 Architecture

## Overview
ERP v2 is a full-stack MERN-style app with:
- `backend/`: Express + Mongoose API
- `frontend/`: React + Vite SPA
- `shared/`: cross-app utilities (small/common helpers)

Core transaction domains currently implemented:
- Sale Order
- Receipt (cash transaction flow, currently receipt-focused)
- Outstanding settlement and ledger impacts

## Runtime Topology
- Frontend runs as SPA (`vite` in dev, static `dist/` in production).
- Backend exposes REST APIs under `/api/*`.
- In production, backend serves frontend build from `../frontend/dist`.

Main backend bootstrap:
- `backend/server.js`

Main frontend bootstrap:
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`

## Backend Architecture

### Layering Pattern
Most features follow:
1. `routes/*` -> HTTP endpoint mapping
2. `controllers/*` -> request validation + response envelope
3. `services/*` -> business logic + transactions
4. `Model/*` -> schema and indexes

### Important Cross-Cutting Modules
- Auth:
  - `backend/middleware/authMiddleware.js`
- Company scoping/access control:
  - `backend/middleware/companyAccessMiddleware.js`
  - `backend/utils/companyScope.js`
  - `backend/utils/authScope.js`
- Voucher identity/numbering:
  - `backend/services/voucherIdentity.service.js`
  - `backend/utils/getNextVoucherNumber.js`
  - `backend/utils/getNextTransactionSerialNumbers.js`
- Transaction lifecycle rules:
  - `backend/services/transactionState.service.js`

### Key Business Domains
- Sale order:
  - Route: `backend/routes/saleOrder/saleOrderRoute.js`
  - Controller: `backend/controllers/saleOrderController.js`
  - Services: `backend/services/saleOrder.service.js`, `backend/services/saleOrderDocument.service.js`
  - Model: `backend/Model/SaleOrder.js`
- Receipt / cash transaction:
  - Route: `backend/routes/cashTransaction/cashTransactionRoute.js`
  - Controller: `backend/controllers/cashTransactionController.js`
  - Services: `backend/services/cashTransaction.service.js`, `backend/services/cashTransactionDocument.service.js`
  - Models: `backend/Model/CashTransaction.js`, `backend/Model/Receipt.js`
- Outstanding:
  - Route: `backend/routes/outstanding/outstandingRoute.js`
  - Model: `backend/Model/oustandingShcema.js`

### Data Consistency Strategy
- High-impact financial flows use MongoDB sessions + `withTransaction(...)`.
- Side effects (ledger updates, outstanding adjustments, timeline entries) are committed in the same DB transaction where applicable.
- Statuses are soft state transitions (for example cancellation), not hard deletes.

## Frontend Architecture

### Core Libraries
- Routing: `react-router-dom`
- Server state: `@tanstack/react-query`
- Client state: `@reduxjs/toolkit` + `react-redux`
- Notifications: `sonner`

### Application Shell
- Route registry:
  - `frontend/src/routes/appRoutes.jsx`
  - `frontend/src/routes/authRoutes.jsx`
  - `frontend/src/routes/masterRoutes.jsx`
  - `frontend/src/routes/paths.js`
- Layout and guards:
  - `frontend/src/components/Layout/HomeLayout.jsx`
  - `frontend/src/components/Layout/ProtectedRoute.jsx`
  - `frontend/src/components/Layout/PublicRoute.jsx`

### State Responsibilities
- Redux (`frontend/src/store/slices/*`):
  - local transaction drafting and UI workflow state
- React Query (`frontend/src/hooks/queries/*`, `frontend/src/hooks/mutations/*`):
  - API reads, mutations, cache invalidation

### Feature UI Structure
- Sale order UI: `frontend/src/pages/sales/*`, `frontend/src/components/sales/*`
- Receipt UI: `frontend/src/pages/cashTransaction/*`, `frontend/src/components/transactions/details/ReceiptDetailView.jsx`

## Config and Security
- API-level protections include:
  - JWT/cookie auth
  - company access checks
  - helmet, hpp, rate-limit, mongo sanitize
- Backend env config: `backend/.env` (local)
- Frontend envs:
  - `frontend/.env.development`
  - `frontend/.env.production`

## Existing Deep Flow Docs
- Sale order frontend flow:
  - `frontend/src/pages/sales/SALE_ORDER_FRONTEND_FLOW.md`
- Receipt frontend flow:
  - `frontend/src/pages/cashTransaction/RECEIPT_FRONTEND_FLOW.md`

## Known Architecture Notes
- `frontend/src/store/slices/saleOrderSlice.js` exists as a legacy/alternate slice; current create/edit flow relies on `transactionSlice`.
- Receipt and payment share schema/hook structure, but current controller validation is receipt-oriented.
