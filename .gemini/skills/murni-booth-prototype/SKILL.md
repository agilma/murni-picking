# Murni-Booth Prototype

Read PROJECT.md first.

## Current Phase

PROTOTYPE ONLY.

Goal:
Create and validate the UX/UI before production implementation.

Do not implement:
- backend
- API
- database
- ERPNext
- authentication
- production architecture

## Core Flows

DINE_IN:

Order
→ Picking
→ Pickup QR
→ Confirmation
→ Completed

STATION_PICKUP:

Order
→ Picking
→ Completed

## Order Discovery

User can:

- Scan Order QR
- Search Order Number

## Picking

User can:

- Scan item barcode
- Search/select item
- Increase qty
- Decrease qty
- Edit qty

Rule:

pickedQty <= orderedQty

Complete Picking only when:

pickedQty == orderedQty
for every order item.

## DINE_IN

After picking:

Complete Picking
→ Scan Customer Pickup QR
→ Verify Order
→ Confirm Pickup

## STATION_PICKUP

After picking:

Complete Picking
→ Picking Completed

No pickup QR.

## UX Priority

1. Fast
2. Clear
3. Low error
4. Minimal interaction
5. Mobile usability

Do not add features not specified in PROJECT.md.