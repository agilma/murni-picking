# Murni-Booth — Backend Contract Verification Plan

## 1. Objective

The frontend implementation has passed the current implementation review.

The remaining risk is the ERPNext backend contract.

This phase is intended to verify whether the frontend assumptions actually match the ERPNext backend implementation.

The primary fields and behaviors to verify are:

1. Delivery Note order type
2. Delivery Note Item picked quantity
3. Pickup QR format
4. Sales Invoice pickup status
5. API method used to update picking data
6. API method used to confirm customer pickup

This phase must prioritize **verification over implementation**.

Do not modify the frontend unless a confirmed backend contract requires a correction.

---

# 2. Important Rule

Do not assume a field is correct merely because the frontend currently works.

Every backend field must be classified as:

```text
CONFIRMED
ASSUMED
NOT FOUND
BLOCKED
```

Evidence must come from:

* ERPNext backend source code
* ERPNext custom app source code
* DocType definition
* API documentation
* backend developer confirmation
* actual API response from the development environment

Do not mark a field as CONFIRMED based only on the frontend implementation.

---

# 3. Verification Scope

Investigate the following:

```text
Delivery Note
Delivery Note Item
Sales Invoice
Customer Pickup
Picking update API
Pickup confirmation API
QR generation
```

Search the available backend/project files if they are available in the workspace.

If the backend source is not available, report the item as:

```text
BLOCKED — Backend source/environment unavailable
```

Do not invent the answer.

---

# 4. Contract #1 — Delivery Note Order Type

## Current Frontend Assumption

The frontend currently expects:

```text
doc.custom_order_type
```

with values such as:

```text
DINE_IN
STATION_PICKUP
```

## Verify

Find the actual Delivery Note field used to determine the order type.

Verify:

* exact field name
* field type
* allowed values
* capitalization
* whether values are strings or another representation
* whether the field exists on all relevant Delivery Notes

Expected conceptual mapping:

```text
Delivery Note
      ↓
Order Type
      ↓
DINE_IN / STATION_PICKUP
```

## Required Report

Provide:

```text
Field name:
Field type:
Allowed values:
Example:
Source/evidence:
Status:
```

## Important

If the actual field is not:

```text
custom_order_type
```

do not modify frontend code in this phase.

Only report the confirmed field.

---

# 5. Contract #2 — Delivery Note Item Picked Quantity

## Current Frontend Assumption

The frontend currently expects:

```text
item.picked_qty
```

## Verify

Determine:

* whether `picked_qty` exists
* exact field name
* field type
* whether it exists in `Delivery Note Item`
* initial/default value
* whether it is editable through REST API
* whether backend validation exists
* whether quantity can exceed ordered quantity

## Critical Question

Determine how picking should actually be persisted.

Possibilities:

```text
PUT /api/resource/Delivery Note/<name>
```

or:

```text
PUT /api/resource/Delivery Note Item/<name>
```

or:

```text
/api/method/<custom_method>
```

or another custom backend method.

Do not assume the current frontend PUT approach is production-safe.

## Verify Business Logic

Determine whether changing picked quantity requires:

* stock validation
* permission checks
* workflow validation
* server-side business logic
* custom whitelisted method
* additional fields

## Required Report

```text
Field name:
Doctype:
Field type:
Writable:
Update method:
Server-side validation:
Recommended API:
Status:
```

---

# 6. Contract #3 — Pickup QR Format

## Current Frontend Assumption

The frontend currently expects something similar to:

```text
MURNI-PICKUP:INVOICE_NAME
```

with a fallback that may treat the entire QR value as an invoice identifier.

## Verify

Determine how the QR code is actually generated.

Search for:

* QR generation code
* customer-facing page
* Sales Invoice QR generation
* pickup QR generation
* QR payload definition

Determine:

```text
Actual QR payload:
Prefix:
Identifier:
Example:
Parser requirement:
```

## Critical Question

Is the identifier inside the QR actually:

```text
Sales Invoice.name
```

or:

```text
Delivery Note.name
```

or:

```text
custom QR identifier
```

or another value?

## Required Report

```text
QR format:
Example payload:
Identifier type:
Generating system:
Status:
```

If unavailable:

```text
BLOCKED — QR generation source not available
```

---

# 7. Contract #4 — Sales Invoice Pickup Status

## Current Frontend Assumption

The frontend currently expects:

```text
custom_picked_up
```

on Sales Invoice.

## Verify

Determine:

* exact field name
* field type
* default value
* allowed values
* whether it is writable
* whether setting it directly through REST API is allowed
* whether another backend method should be called instead

## Verify Business Meaning

Determine whether this field actually means:

```text
Customer has picked up the order
```

and not merely:

```text
Pickup process started
```

or another state.

## Required Report

```text
Field:
Type:
Meaning:
Writable:
Update method:
Server-side logic:
Status:
```

---

# 8. Contract #5 — Customer Pickup Confirmation

Inspect the backend process used when a customer scans/confirms pickup.

Determine:

```text
What document is looked up?
What document is updated?
What field is updated?
What endpoint/method is called?
What validation occurs?
What happens if already picked up?
What happens if QR is invalid?
```

Expected conceptual flow:

```text
Customer QR
     ↓
Identify order
     ↓
Validate order
     ↓
Check pickup eligibility
     ↓
Mark pickup completed
     ↓
Return success
```

Verify whether this flow is actually implemented server-side.

---

# 9. Contract #6 — Picking Completion API

Determine whether the current frontend's picking update approach is correct.

Inspect the current API implementation:

```text
src/api/deliveryNote.js
```

and compare it with the backend implementation.

Determine:

```text
Endpoint:
HTTP method:
Payload:
Required fields:
Authentication:
Permissions:
Server-side validation:
Response:
```

## Important

A frontend `PUT` request being technically accepted does not automatically mean it is the correct business operation.

The backend may require a custom method.

If a custom method exists, document it.

---

# 10. Contract #7 — Authentication Contract

Verify the existing:

```text
/api/method/frappe.auth.get_logged_user
```

behavior.

Confirm:

* valid authenticated session response
* Guest response
* invalid/expired session behavior
* HTTP status
* whether cookies are sufficient
* CORS requirements for local development
* whether `credentials: include` is correct

Do not change frontend auth unless evidence shows the current implementation is incompatible.

---

# 11. Contract #8 — CORS / Local Development

Verify whether the frontend development origin is allowed by the ERPNext backend.

Current environment may involve:

```text
localhost
```

calling:

```text
dev.thunderlab.id
```

Verify:

* allowed origins
* credentials support
* preflight behavior
* required headers
* cookie behavior
* SameSite requirements

This should be reported separately from frontend logic.

## Status

Use:

```text
CONFIRMED
BLOCKED
```

depending on whether the backend configuration can actually be inspected/tested.

---

# 12. Backend Contract Matrix

Produce a table:

| Contract    | Frontend Assumption | Actual Backend | Status | Risk |
| ----------- | ------------------- | -------------- | ------ | ---- |
| Order Type  | `custom_order_type` | ...            | ...    | ...  |
| Picked Qty  | `picked_qty`        | ...            | ...    | ...  |
| Pickup QR   | `MURNI-PICKUP:...`  | ...            | ...    | ...  |
| Pickup Flag | `custom_picked_up`  | ...            | ...    | ...  |
| Picking API | REST PUT            | ...            | ...    | ...  |
| Pickup API  | REST/API method     | ...            | ...    | ...  |
| Auth        | get_logged_user     | ...            | ...    | ...  |
| CORS        | credentials include | ...            | ...    | ...  |

---

# 13. Risk Classification

Use:

## P0 — Critical

Backend mismatch prevents core application flow or may cause incorrect business data.

## P1 — High

Backend mismatch breaks an important feature.

## P2 — Medium

Backend mismatch affects a secondary feature or requires adjustment.

## P3 — Low

Documentation/cleanup issue with minimal functional impact.

---

# 14. No Frontend Fix Yet

Do NOT immediately modify:

```text
OrderContext.jsx
Picking.jsx
salesInvoice.js
pickupService.js
AuthContext.jsx
```

just because a backend assumption is discovered.

First produce the contract verification report.

Frontend corrections will be handled in a separate implementation plan after the actual backend contract is known.

---

# 15. If Backend Source Is Available

If backend source exists in the workspace:

1. Search DocTypes.
2. Search custom fields.
3. Search backend methods.
4. Search API routes.
5. Search QR generation.
6. Search pickup completion logic.
7. Search Delivery Note picking logic.
8. Search Sales Invoice pickup logic.

Prefer actual backend code over assumptions.

---

# 16. If Backend Source Is NOT Available

Do not guess.

Report:

```text
BLOCKED — Backend source unavailable
```

and specify exactly what information is required from the backend team.

For example:

```text
Please confirm Delivery Note order type field.
Please confirm Delivery Note Item picked quantity field.
Please confirm Pickup QR payload.
Please confirm Sales Invoice pickup field.
Please confirm official picking update API.
Please confirm official pickup confirmation API.
```

---

# 17. Expected Final Report

Return exactly:

## Executive Summary

Briefly describe how many contracts were confirmed and how many remain unknown.

## Confirmed Contracts

List verified contracts with evidence.

## Assumed Contracts

List frontend assumptions that have not yet been verified.

## Backend Mismatches

List every mismatch between frontend and backend.

## Blocked / Unknown

List contracts that cannot be verified.

## API Contract Matrix

Provide the complete table.

## Critical Risks

List P0/P1 issues first.

## Frontend Changes Required

Only list changes that are objectively required based on verified backend contracts.

Do not implement them yet.

## Backend Changes Required

Only if the backend itself needs modification.

## Recommended Next Step

Recommend whether the next phase should be:

```text
A. Frontend Contract Alignment
B. Backend Fix
C. Both
D. No Changes Required
E. Still Blocked
```

---

# 18. Completion Criteria

This phase is complete when:

* Delivery Note order type is confirmed or explicitly blocked.
* picked quantity behavior is confirmed or explicitly blocked.
* Pickup QR format is confirmed or explicitly blocked.
* Sales Invoice pickup field is confirmed or explicitly blocked.
* Picking API contract is confirmed or explicitly blocked.
* Pickup API contract is confirmed or explicitly blocked.
* Authentication contract is verified.
* CORS/session behavior is verified where possible.
* No backend assumption is incorrectly reported as confirmed.

The output of this phase is a **backend contract report**, not a code change.
