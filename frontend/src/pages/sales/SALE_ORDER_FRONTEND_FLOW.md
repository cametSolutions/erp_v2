# Sale Order Frontend Flow (Detailed)

This document explains how the sale-order frontend works end-to-end, including how item rate is determined.

## 1) Entry Points

- `frontend/src/routes/appRoutes.jsx`
  - Route `ROUTES.createOrder` loads `SaleOrderCreatePage`.
  - Route `ROUTES.salesSelectItems` loads `ProductSelectPage`.
  - Route `ROUTES.saleOrderEdit` loads `SaleOrderEditPage`.
- `frontend/src/pages/sales/SaleOrderCreatePage.jsx`
  - New order creation shell.
- `frontend/src/pages/sales/SaleOrderEditPage.jsx`
  - Existing order edit shell.

## 2) Shared Draft State (Redux)

- `frontend/src/store/slices/transactionSlice.js`
  - Holds current sale-order draft:
    - company, transaction date, series
    - party
    - items
    - additional charges
    - totals
  - Recalculates item amounts and totals whenever:
    - item is added/updated/removed
    - party/tax type changes
    - additional charges change
    - global re-price is triggered

## 3) Create Page Composition

- `SaleOrderCreatePage` renders:
  - `TransactionHeader` (date + voucher series/number)
  - `PartySection`
  - `DetailsSection`
  - `ItemsSection`
  - `AdditionalChargesSection`
  - `SummarySection`
- When user clicks Create:
  1. Reads latest header payload from `TransactionHeader`.
  2. Reads draft data from Redux.
  3. Calls `saleOrderService.buildCreateSaleOrderPayload(...)`.
  4. Sends request with `useCreateSaleOrder` mutation.
  5. On success clears local draft and opens transaction detail.

## 4) Edit Page Composition

- `SaleOrderEditPage` first fetches document via `useSaleOrderDetailQuery`.
- Hydrates Redux with `loadSaleOrderForEdit`.
- Uses the same UI sections as create page.
- Uses `saleOrderService.buildUpdateSaleOrderPayload(...)` on submit.
- Allows update only if status is `open`.

## 5) Item Selection Flow

- `ItemsSection` is the launcher/preview only.
- Real item selection happens in `ProductSelectPage`:
  - Loads product list with pagination.
  - Supports filters (price level, brand, category, subcategory).
  - Keeps staged item edits locally until user taps Continue.
  - On Continue:
    - new items are added with `addItemsFromSelection`
    - existing items are updated with `updateItem`
    - then returns to create/edit page.

## 6) Rate Resolution Flow (Important)

Rate is resolved in `ProductSelectPage` inside `resolveInitialRate(...)` when adding a new item.

Priority order:

1. Price level rate
   - If a price level is selected and product has a matching entry in `product.priceLevels`, use that rate.
2. Party LSP
   - Else call `productService.fetchPartyLsp(partyId, productId)`.
3. Global LSP
   - Else call `productService.fetchGlobalLsp(productId)`.
4. Manual fallback
   - Else default to `0` with source `"manual"`.

Stored source values:

- `"priceLevel"`
- `"lsp"` (party-level last sale price)
- `"gsp"` (global last sale price)
- `"manual"`

## 7) What Happens When Price Level Changes

- If staged items already exist and price level changes:
  - User gets confirmation modal.
  - On confirm, each staged item is re-priced from selected price level.
  - If an item has no matching price level, its rate becomes `0`.
  - `initialPriceSource` becomes `"priceLevel"`.

## 8) Calculation Engine

- `frontend/src/utils/salesCalculation.js`
  - `calculateItemAmounts(...)` computes per-line:
    - base price
    - discount
    - taxable amount
    - CGST/SGST/IGST
    - cess and addl cess
    - total amount
  - `calculateItemsWithTotals(...)` aggregates order totals.
- `transactionSlice` calls these functions so totals are always derived, not manually typed.

## 9) Additional Charges Flow

- `AdditionalChargesSection` reads charge masters via `useAdditionalChargesQuery`.
- User selects charges and sets:
  - amount
  - action (`add`/`subtract`)
  - tax percentage (from master)
- `setAdditionalCharges` stores normalized rows in Redux.
- Net charge impact is included in final amount during `recalculateTotals`.

## 10) API Payload Build and Submission

- `frontend/src/api/services/saleOrder.service.js`
  - Normalizes optional voucher prefix/suffix.
  - Builds item payload in backend-compatible shape.
  - Sends POST/PUT/cancel API calls.
- Frontend sends totals for reference, but backend recalculates before saving.

## 11) Quick Trace Example (Single Item)

1. User selects party.
2. User opens item selector and taps `+` on Product A.
3. `resolveInitialRate` picks rate (price level -> party LSP -> global LSP -> 0).
4. Staged item is created with quantity `1`, rate, tax metadata, and source.
5. User edits discount/rate in item edit sheet.
6. On Continue, item is committed to Redux via `addItemsFromSelection`.
7. Reducer recalculates row + totals.
8. Summary shows updated final amount.
9. Create builds API payload and submits.
10. Backend recomputes and saves sale order.
