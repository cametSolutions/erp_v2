# Contributing Guide

## 1) Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB instance

## 2) Local Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 3) Environment

Backend env file:
- `backend/.env`

Frontend env files:
- `frontend/.env.development`
- `frontend/.env.production`

Do not commit secrets.

## 4) Project Conventions

### Backend layering
- `routes` should map endpoints only.
- `controllers` should validate and shape responses only.
- `services` should hold business logic and DB transactions.
- `Model` files define schemas and indexes.

### Frontend layering
- `api/services/*`: HTTP payload builders and API calls.
- `hooks/queries/*`: React Query reads.
- `hooks/mutations/*`: writes + cache invalidations.
- `pages/*`: screen orchestration.
- `components/*`: reusable UI blocks.
- `store/slices/*`: local draft/workflow state.

## 5) Access and Scoping Rules
- Always preserve `cmp_id` scope.
- Use existing auth/company middleware patterns.
- Staff visibility can be creator-scoped via `applyTransactionCreatorScope`.

## 6) Voucher/Transaction Rules
- Keep voucher numbering through `voucherIdentity.service`.
- Do not generate series/serial values manually in controllers/components.
- Prefer soft-cancel state transitions over hard delete for financial records.

## 7) When Editing Financial Flows
For sale order/receipt/outstanding/ledger changes:
1. Keep operations transactional in backend service layer.
2. Validate ownership (party/cash-bank/company).
3. Update all dependent records (ledger, outstanding, timeline, summary).
4. Ensure mutation hooks invalidate correct query keys.

## 8) Frontend Cache and Mutation Pattern
- After mutation success:
  - seed/update detail cache when possible
  - invalidate affected list/summary queries
  - invalidate related aggregates (outstanding/party/voucher summary)

## 9) Documentation Expectations
When adding a new feature:
- Add inline comments for non-obvious logic.
- Update one of:
  - `ARCHITECTURE.md`
  - `DATA_FLOW.md`
  - feature flow doc near page folder (example: `SALE_ORDER_FRONTEND_FLOW.md`)
- Add/extend glossary terms if new domain language is introduced.

## 10) Coding Practices
- Keep naming consistent with existing style (`snake_case` in many backend docs, mixed compatibility in payload mappers).
- Preserve backward compatibility for mixed key inputs where existing code expects it.
- Avoid silent behavior changes in shared utility functions.
- Keep comments focused on intent and data contracts.

## 11) Testing and Verification (Current State)
There is no unified automated test suite in this repository right now.

Minimum manual checks for critical changes:
1. Create and cancel Sale Order.
2. Create and cancel Receipt with settlement + advance.
3. Verify outstanding and balance effects.
4. Verify voucher number progression and series behavior.
5. Verify transaction detail pages render correctly.

## 12) First-Day Onboarding Checklist
1. Read:
   - `ARCHITECTURE.md`
   - `DATA_FLOW.md`
   - `GLOSSARY.md`
2. Run backend + frontend locally.
3. Create one sale order and one receipt end-to-end.
4. Trace related records in backend service files.
5. Review React Query mutation invalidation patterns before making data-flow changes.
