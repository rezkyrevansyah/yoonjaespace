# Plan: Auto-update Payment Status for Add-ons Added to PAID Bookings

## Problem
When add-ons are added to a booking that's already marked as PAID, the `totalAmount` increases but `paymentStatus` remains PAID. This is incorrect because the additional charges haven't been paid yet.

## Solution Overview
Automatically detect when `totalAmount` changes on a PAID booking and update `paymentStatus` to PARTIALLY_PAID if the new total exceeds existing payments.

## Implementation Steps

### 1. Update Booking Update API Logic
**File**: [src/app/api/bookings/[id]/route.ts](src/app/api/bookings/[id]/route.ts)

Current behavior (lines 141-184):
- Recalculates `totalAmount` when add-ons, package, or discount changes
- Does NOT check or update `paymentStatus`

**Changes needed**:
- Before updating the booking, fetch existing payment records
- Calculate `totalPaid` from payment records
- After calculating new `totalAmount`, compare with `totalPaid`
- If `paymentStatus === 'PAID'` and `totalAmount > totalPaid`, set `paymentStatus = 'PARTIALLY_PAID'`

```typescript
// Pseudo-code logic:
const existingBooking = await prisma.booking.findUnique({
  where: { id },
  include: { payments: true }
})

const totalPaid = existingBooking.payments.reduce((sum, p) => sum + p.amount, 0)
const newTotalAmount = newPackagePrice + addOnsTotal - discount

let updatedPaymentStatus = existingBooking.paymentStatus
if (existingBooking.paymentStatus === 'PAID' && newTotalAmount > totalPaid) {
  updatedPaymentStatus = 'PARTIALLY_PAID'
}

// Include updatedPaymentStatus in the prisma.booking.update() call
```

### 2. Update Invoice Display Logic
**File**: [src/app/api/public/invoice/[id]/route.ts](src/app/api/public/invoice/[id]/route.ts)

Already correctly calculates:
- `totalPaid` from payment records (line 32)
- `outstandingBalance` as difference (line 33)

No changes needed here - invoice will automatically show correct unpaid amount.

### 3. Add Warning UI When Modifying PAID Bookings
**File**: [src/app/dashboard/bookings/[id]/page.tsx](src/app/dashboard/bookings/[id]/page.tsx)

Add a warning before allowing add-on modifications on PAID bookings:
- Check if `booking.paymentStatus === 'PAID'` in `handleAddAddOn` function (line 225)
- Show a confirmation dialog: "This booking is marked as PAID. Adding items will change status to PARTIALLY PAID. Continue?"
- Only proceed if user confirms

### 4. Handle Other totalAmount Changes
Also apply the same logic for:
- Package changes (upgrades/downgrades)
- Discount modifications
- Any other field that affects `totalAmount`

All these go through the same PATCH endpoint, so the fix in step 1 covers all cases.

## Files to Modify
1. [src/app/api/bookings/[id]/route.ts](src/app/api/bookings/[id]/route.ts) - Core payment status logic
2. [src/app/dashboard/bookings/[id]/page.tsx](src/app/dashboard/bookings/[id]/page.tsx) - Warning UI

## Testing Scenarios
1. Add add-on to PAID booking → Status becomes PARTIALLY_PAID
2. Add add-on to UNPAID booking → Status remains UNPAID
3. Add add-on to PARTIALLY_PAID booking → Status remains PARTIALLY_PAID
4. Change package on PAID booking → Status updates if new total > paid
5. Invoice displays correct outstanding balance in all cases

## Edge Cases Handled
- If new `totalAmount` equals `totalPaid` exactly, keep status as PAID
- If new `totalAmount` is less than `totalPaid` (e.g., discount added), keep as PAID (overpaid scenario)
- Only downgrade from PAID to PARTIALLY_PAID, never upgrade automatically
