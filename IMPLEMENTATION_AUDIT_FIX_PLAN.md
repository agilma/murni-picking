# Murni-Booth — Implementation Audit Fix Plan

## 1. Objective

This document defines the implementation tasks required to fix the issues identified during the implementation audit of Murni-Booth.

The goal is to bring the current implementation closer to the requirements defined in `PROJECT.md` while keeping the existing architecture intact.

This is a **targeted fix plan**, not a full rewrite or major refactor.

---

# 2. Important Rules

Before making changes:

1. Read and understand:

   * `PROJECT.md`
   * `IMPLEMENTATION_PLAN.md`
   * existing source code
   * existing routing
   * existing API/service layer
   * existing contexts
   * existing CSS/design system

2. Do not rewrite working features unnecessarily.

3. Do not introduce a new framework or UI library.

4. Continue using:

   * React
   * Vite
   * Vanilla CSS
   * existing project architecture

5. Keep UI language in Bahasa Indonesia.

6. Keep source-code naming, variables, functions, and comments in English unless an existing convention requires otherwise.

7. Do not invent ERPNext backend fields as confirmed facts.

8. Existing ERPNext field assumptions must be isolated and clearly marked with:
   `TODO: VERIFY ERPNext FIELD`

9. Do not change backend/ERPNext configuration unless explicitly required by the existing project specification.

10. After implementation, run the available build/lint/test checks and fix regressions.

---

# 3. Current Audit Findings

## Completed

The following functionality already exists and should be preserved:

* React + Vite project structure
* API layer
* Authentication foundation
* `AuthContext`
* ERPNext authentication using cookies
* API client wrapper
* Delivery Note API service
* Sales Invoice API service
* Protected routes
* Bahasa Indonesia UI
* Vanilla CSS
* Delivery Note → `activeOrder` mapping foundation

## Partial

The following requires improvement:

* Delivery Note → `activeOrder` mapping
* Manual product selection
* Loading states

## Missing

The following must be implemented:

* Success Screen
* Persistent ERPNext session validation

## Known Logic Issue

Current `Picking.jsx` routing logic is reversed.

Required behavior:s

* `DINE_IN` → `/pickup`
* `STATION_PICKUP` → Success Screen

Current implementation must be corrected.

## Backend Contract Unknowns

Do not treat these as confirmed backend contracts:

* Delivery Note order type field
* picked quantity field
* Pickup QR format
* Sales Invoice pickup/completed field

These must remain isolated so they can be changed easily after backend confirmation.

---

# 4. Implementation Order

Implement tasks in this exact order:

1. Fix Picking routing
2. Create Success Screen
3. Implement persistent session validation
4. Implement proper manual product Text Search
5. Add
