# AI_CONTEXT.md

## Murni Booth — AI Project Context

This document provides persistent technical and product context for AI coding agents working on the Murni Booth project.

It should be read before making significant changes.

---

# 1. Project Identity

**Project:** Murni Booth

**Purpose:** Operational booth application for handling order picking and customer/order pickup workflows.

**Primary users:** Booth operators / operational staff.

**Primary platform:** Mobile / tablet.

**Frontend direction:** React-based mobile-first application.

**UI language:** Bahasa Indonesia.

**Code language:** English.

---

# 2. Product Goal

Murni Booth is not a generic e-commerce frontend.

It is an operational tool.

The operator should be able to quickly:

1. Login.
2. See orders ready for picking.
3. Start picking.
4. Scan items.
5. Track picking progress.
6. Complete picking.
7. Continue to delivery/pickup confirmation.
8. Obtain/use pickup information when required.
9. Logout safely.

The interface should minimize operator confusion and unnecessary actions.

---

# 3. Current Architecture Direction

Conceptual architecture:

```text
React UI
   ↓
Pages / Components
   ↓
Context / Hooks
   ↓
Service Layer
   ↓
Thunder API / Backend
```

Infrastructure:

```text
Browser
   ↓
Nginx / Web Server
   ↓
Frontend SPA
   ↓
API / Proxy
   ↓
Thunder Backend
```

---

# 4. Main Pages / Flows

The project has historically included or is expected to include:

```text
/login
/
 /picking
 /success
 /pickup
```

The exact route names must be verified from the current router before implementation.

---

# 5. Authentication Flow

Expected conceptual flow:

```text
Login
 ↓
Authenticate
 ↓
Store authenticated user/session
 ↓
Home
```

Logout:

```text
User action
 ↓
Clear authentication/session state
 ↓
Return to Login
```

Authentication must not be treated as merely a frontend visual state.

---

# 6. Home Flow

The Home page is focused on operational picking.

Previous product direction included a `Pending SO` section.

The latest direction is:

> Remove Pending SO from Home.

Home should instead primarily expose orders that are ready for picking.

Conceptually:

```text
Home
 ├── Header
 ├── User/account information
 ├── Ready to Pick
 ├── Orders
 └── Refresh
```

---

# 7. Home Refresh

The Home page should be able to refresh order data without a full browser reload.

Possible interaction:

```text
Pull down
   ↓
Refresh animation
   ↓
API request
   ↓
Update list
```

or:

```text
Refresh button
   ↓
Loading animation
   ↓
API request
   ↓
Update list
```

Important:

**Refresh should not simply reload the entire HTML page.**

---

# 8. Picking Flow

The picking flow has received several UI/UX corrections.

Known requirements:

### Scanner

When entering/starting picking, the camera/scanner should not appear at the wrong stage.

The scanner must appear according to the intended picking state.

### Progress

Picking progress needs a visually appropriate position and should clearly communicate:

```text
Current progress / Total
```

### Navigation

The Picking page needs a usable back button where appropriate.

### Header

The page title must not be clipped.

Mobile safe-area and header spacing must be considered.

---

# 9. Picking State

Conceptual state:

```text
Ready to Pick
     ↓
Picking Started
     ↓
Waiting for Scan
     ↓
Item Scanned
     ↓
Item Validated
     ↓
Progress Updated
     ↓
All Items Complete
     ↓
Success
```

The implementation should prevent duplicate/invalid scans where possible.

---

# 10. Success / Post-Picking Flow

The project has previously implemented a **Pickup Code After Picking** direction.

Conceptually:

```text
Picking Complete
      ↓
Success
      ↓
Pickup Code / Delivery information
```

The exact API behavior must be checked against the current implementation and backend contract.

Do not assume that the old mock implementation is still authoritative.

---

# 11. Customer Pickup

The project also has a dedicated Customer Pickup direction.

Historical implementation plan included:

```text
/pickup
```

The purpose is to scan a QR code from the Murni website and fetch/confirm an order for pickup.

Conceptual flow:

```text
Customer QR
    ↓
Scan
    ↓
Fetch order
    ↓
Show order information
    ↓
Confirm pickup
```

This should remain conceptually separate from the operator picking workflow unless the current implementation explicitly combines them.

---

# 12. API Integration

The project is integrating with Thunder backend services.

Historical work included environment configuration such as:

```env
VITE_API_BASE_URL=
```

API calls should be centralized rather than scattered across UI components.

Preferred:

```text
api/
services/
contexts/
hooks/
```

Exact folder structure must be checked in the current repository.

---

# 13. Thunder API

Thunder is the backend/API source used by Murni Booth.

When implementing an API integration:

* inspect existing service code
* inspect `.env`
* inspect `.env.example`
* inspect backend contract documentation
* inspect current request/response handling

Do not invent API contracts.

Relevant historical documentation includes:

```text
BACKEND_CONTRACT_REQUEST.md
```

if it still exists in the repository.

---

# 14. Proxy / CORS

The project has previously addressed browser CORS through proxy configuration.

Important principle:

```text
Frontend
   ↓
Configured proxy
   ↓
Thunder API
```

Do not randomly switch between:

```text
/api/...
```

and direct Thunder URLs without checking the intended architecture.

---

# 15. Environment Configuration

`.env` may contain environment-specific configuration.

`.env.example` documents the required configuration.

Never expose secrets in:

* source code
* Git
* frontend constants
* documentation
* screenshots
* AI prompts

Remember that Vite `VITE_*` variables are exposed to the frontend and therefore must not contain secrets.

---

# 16. Nginx

The project is expected to run behind Nginx in deployment.

Nginx needs to support:

1. Static frontend assets.
2. React SPA fallback.
3. API proxy if the deployment architecture uses one.

A direct route such as:

```text
/picking
```

must not fail simply because Nginx cannot find a physical file named `picking`.

---

# 17. Existing Development History

The project has gone through several implementation stages.

### Stage 1 — Prototype

A React mobile-first prototype was established with:

* Vanilla CSS
* Indonesian UI
* mobile-first design
* operational booth flow

### Stage 2 — Login

Login page and authentication flow were introduced.

### Stage 3 — Pickup QR

A Customer Pickup feature was planned/implemented around QR scanning.

### Stage 4 — Backend/API

Thunder API integration began.

Environment variables and API configuration were introduced.

### Stage 5 — Proxy/CORS

Proxy architecture was addressed to avoid frontend CORS problems.

### Stage 6 — Active User / Logout

Authentication state was expanded toward active-user handling and logout.

### Stage 7 — Picking

Picking flow became the main operational workflow.

### Stage 8 — Pickup Code

After successful picking, the flow was extended toward pickup-code handling.

### Stage 9 — Current UI Refinement

Current refinement includes:

* removing Pending SO from Home
* Ready to Pick as the main Home focus
* refresh without full reload
* scanner timing
* picking progress placement
* back button
* title/header clipping fixes

---

# 18. Important Recent Product Direction

The latest known direction is:

```text
LOGIN
  ↓
HOME
  ↓
READY TO PICK
  ↓
START PICKING
  ↓
SCAN
  ↓
PICKING PROGRESS
  ↓
SUCCESS
  ↓
PICKUP / DELIVERY INFORMATION
```

Do not design new work around the old Pending SO-first Home flow.

---

# 19. UI Design Context

The intended visual direction is:

* premium
* clean
* modern
* vibrant but controlled
* operational
* mobile-first
* touch-friendly

Avoid:

* excessive gradients
* generic dashboard cards
* unnecessary glassmorphism
* oversized decorative elements
* desktop-centric layouts
* dense tables on mobile
* excessive animations

Every visual element should support the operator's task.

---

# 20. UI State Model

For API-driven screens, think in these states:

```text
INITIAL
LOADING
SUCCESS
EMPTY
ERROR
REFRESHING
```

For picking:

```text
READY
STARTED
SCANNING
VALIDATING
PROGRESS
COMPLETED
ERROR
```

The UI should represent the actual state instead of relying on arbitrary timers.

---

# 21. Important Files to Inspect

Before modifying the project, look for:

```text
PROJECT.md
IMPLEMENTATION_PLAN.md
AI_CONTEXT.md
AGENTS.md
BACKEND_CONTRACT_REQUEST.md
.env
.env.example
package.json
vite.config.*
src/
```

Then locate:

```text
router
Home
Picking
Success
Login
Pickup
OrderContext
API/service layer
mockService
authentication/session logic
```

File names may differ. Search before assuming.

---

# 22. Mock Data

The project has previously used mock services.

A known historical file was:

```text
mockService.js
```

Mocks are useful for development but must not silently override real API behavior in production.

When replacing mocks:

```text
Mock
 ↓
Real service
 ↓
Real API
```

must be intentional.

---

# 23. Order Context

Historical code included:

```text
OrderContext.jsx
```

This suggests order/picking state has been centralized through React Context.

Before introducing duplicate state, inspect the current `OrderContext`.

Avoid creating separate competing sources of truth for:

* selected order
* picking order
* picked items
* progress
* pickup code
* completion state

---

# 24. Delivery Note

The project has previously included work around submitting a Delivery Note.

This is an operational backend action and should:

* show loading state
* prevent accidental duplicate submission
* handle API failure
* confirm successful submission
* transition the user to the correct next state

Do not assume a successful HTTP request always means the operation is complete; inspect the API response.

---

# 25. Build Verification

The project has historically used:

```bash
npm run build
```

This should be run after significant implementation changes.

A successful build is necessary but not sufficient.

UI behavior must also be inspected.

---

# 26. Debugging Strategy

When something unexpectedly becomes plain HTML, loses styling, or looks different after an AI implementation:

Check in this order:

```text
1. npm run build
2. Browser console
3. Network errors
4. CSS import
5. main entry file
6. App/root component
7. routing
8. asset paths
9. CSS file paths
10. environment configuration
```

Do not immediately rewrite the entire UI.

---

# 27. AI Agent Workflow

Recommended workflow for every significant task:

```text
READ CONTEXT
    ↓
INSPECT CURRENT CODE
    ↓
IDENTIFY IMPACT
    ↓
WRITE PLAN
    ↓
IMPLEMENT
    ↓
BUILD
    ↓
VERIFY
    ↓
REPORT
```

AI agents should preserve existing functionality unless the user explicitly requests its removal or replacement.

---

# 28. Decision Priority

When conflicting information exists:

```text
Latest explicit user requirement
        ↓
Current implementation plan
        ↓
Current project specification
        ↓
Current code architecture
        ↓
Historical implementation
        ↓
Old prototype assumptions
```

Historical code should never automatically override a newer requirement.

---

# 29. Current Known Priorities

Unless the user states otherwise, the current priority direction is:

### P0

* Application builds.
* Login works.
* Authentication/session works.
* Home loads real operational data.
* Ready-to-pick flow works.
* Picking works.
* Scanner works correctly.
* Picking completion works.

### P1

* Pickup Code flow.
* Delivery Note.
* Customer Pickup QR.
* Logout.
* Refresh UX.
* Error/loading states.

### P2

* Visual refinement.
* Animations.
* Secondary responsive improvements.
* Additional operational conveniences.

---

# 30. Agent Safety Rules

Never:

* delete working functionality without instruction
* replace real API with mock silently
* hard-code credentials
* expose secrets
* invent backend response fields
* claim testing was performed when it was not
* introduce unrelated dependencies
* rewrite the whole project to solve a small UI issue
* remove existing architecture without explaining why

---

# 31. Expected AI Report

Every meaningful implementation should end with:

```text
## Implemented

- ...

## Files Changed

- ...

## Verification

- npm run build: PASS/FAIL

## Notes

- ...
```

If something could not be verified, state it explicitly.

---

# 32. Final Context

Murni Booth should be treated as an operational production-oriented application, not a static prototype.

The primary goal is:

> Make the booth operator's workflow fast, obvious, reliable, and difficult to misuse.

Any future feature should fit into that principle.
