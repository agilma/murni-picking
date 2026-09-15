# AGENTS.md

## Project

**Murni Booth** is a mobile-first operational application used by Murni Booth operators for order picking and pickup operations.

The application is intended to be used primarily from a mobile/tablet device at a booth. The UI must therefore prioritize speed, clarity, touch interaction, and operational reliability over decorative complexity.

---

# 1. Core Development Principles

## 1.1 Do not break the existing flow

Before changing code:

1. Inspect the existing implementation.
2. Understand the current flow.
3. Identify dependencies between pages, contexts, services, API calls, and routing.
4. Make the smallest safe change necessary.
5. Do not rewrite working functionality without a clear reason.

Existing functionality must remain working unless the task explicitly requires changing it.

---

## 1.2 Read the project before coding

Before implementing a feature, inspect:

* `PROJECT.md`
* `IMPLEMENTATION_PLAN.md`
* `AI_CONTEXT.md`
* relevant source files
* API/service files
* routing
* context/state management
* CSS/design system
* `.env.example`

If a file or specification exists, use it as the source of truth before making assumptions.

---

## 1.3 Prefer incremental implementation

Do not implement a large feature as an uncontrolled rewrite.

Preferred workflow:

1. Analyze
2. Plan
3. Implement
4. Build
5. Inspect result
6. Fix issues
7. Report changes

For larger changes, create/update a task or implementation plan before coding.

---

# 2. Product Rules

## 2.1 Language

The user-facing application uses:

**Bahasa Indonesia**

Code, variable names, component names, comments, and technical documentation use:

**English**

---

## 2.2 UI direction

The application follows:

* Mobile-first
* Premium operational UI
* Clean typography
* High readability
* Clear hierarchy
* Touch-friendly controls
* Minimal unnecessary decoration
* Fast interaction
* Consistent spacing
* Consistent buttons and status indicators

Avoid generic "AI-generated" dashboard styling.

---

## 2.3 Operational priority

The application is used by booth operators.

Therefore prioritize:

1. Correctness
2. Speed
3. Visibility of operational status
4. Simple interaction
5. Error prevention
6. Visual polish

Do not sacrifice operational clarity for visual effects.

---

# 3. Current Main Flow

The current application flow is centered around:

```text
Login
  ↓
Home
  ↓
Start Picking
  ↓
Picking
  ↓
Success
  ↓
Pickup / Delivery Note / Pickup Code
```

The exact implementation may evolve, but the operational flow must remain coherent.

---

# 4. Home Page Rules

The Home page should focus on orders that are ready to be picked.

The previous `Pending SO` concept is being removed from the main Home UI.

Expected direction:

```text
Home
 ├── Header / user information
 ├── Ready to Pick information
 ├── Order list / picking queue
 ├── Refresh
 └── Logout / account action
```

Do not reintroduce `Pending SO` as a primary Home section unless explicitly requested.

---

# 5. Refresh Behavior

Home data must support refresh.

Preferred behavior:

* Pull-to-refresh may be supported.
* A visible refresh button may also be provided.
* Refresh must not unnecessarily navigate away from the page.
* Loading should be represented by an animation/loading state.
* Avoid blank-screen reload behavior.
* Avoid full browser reload when application state can be refreshed through React state/API calls.

The user should clearly understand:

```text
Loading
Refreshing
Loaded
Empty
Error
```

These states must not be visually ambiguous.

---

# 6. Picking Page

The Picking page is operationally critical.

Current requirements include:

* Scanner/camera should appear at the correct point in the picking flow.
* Picking progress indicator must be positioned correctly.
* Progress must accurately represent picking completion.
* Back navigation must be available where appropriate.
* Page title must not be clipped.
* Header must respect mobile safe areas.
* Scan errors must be understandable.
* Successful scans must provide clear feedback.

Example conceptual flow:

```text
Start Picking
    ↓
Picking Header
    ↓
Progress
    ↓
Scanner
    ↓
Scan item
    ↓
Validate
    ↓
Update progress
    ↓
Complete
```

Do not expose camera/scanner UI prematurely if the flow requires the operator to first enter the Picking page.

---

# 7. Authentication

Authentication must be treated as real application state.

The system should support:

* Login
* Authenticated session
* Active user
* Logout
* Unauthorized handling
* Session persistence where required

Do not rely on visual login state alone.

If an API is responsible for authentication, use the API contract rather than mocking successful authentication.

---

# 8. API Integration

The application integrates with backend services, including Thunder APIs.

API configuration must use environment variables.

Example:

```env
VITE_API_BASE_URL=
```

Do not hard-code production API URLs inside React components.

Prefer:

```text
UI
 ↓
Context / Hook
 ↓
Service layer
 ↓
API
```

instead of:

```text
UI component
 ↓
fetch()
```

unless the project architecture explicitly requires otherwise.

---

# 9. API Contract

When implementing an API:

1. Check existing documentation.
2. Check `BACKEND_CONTRACT_REQUEST.md` if available.
3. Confirm endpoint.
4. Confirm HTTP method.
5. Confirm request body.
6. Confirm headers/authentication.
7. Confirm response structure.
8. Handle loading/error/empty states.

Never invent response fields when an API contract is available.

If the backend contract is uncertain, isolate assumptions in the service layer.

---

# 10. Proxy / CORS

The project may use a frontend/backend proxy to avoid browser CORS problems.

Do not bypass the established proxy architecture by randomly changing API URLs.

When changing API connectivity, inspect:

* `.env`
* `.env.example`
* Vite configuration
* Nginx configuration
* API service
* proxy paths

The production architecture should remain understandable.

---

# 11. Environment Variables

Never commit secrets.

Use:

```text
.env
.env.example
```

`.env.example` should document required variables without exposing credentials.

Frontend variables intended for Vite must follow the appropriate `VITE_` naming convention.

---

# 12. Nginx / Deployment

The application is expected to be deployed behind Nginx.

SPA routing must work correctly.

Direct navigation to routes such as:

```text
/login
/
 /picking
 /success
 /pickup
```

must not result in an Nginx 404 when the React application owns the route.

Production configuration must distinguish:

* static frontend assets
* SPA fallback
* API proxying, if applicable

---

# 13. State Management

Before introducing new state:

1. Check existing Contexts.
2. Check existing hooks.
3. Check whether the state already exists.
4. Avoid duplicating the same business state in multiple components.

For example, order/picking state should have one clear source of truth.

Avoid unnecessary global state.

---

# 14. Error Handling

Every API-driven operation should consider:

```text
Loading
Success
Empty
Error
```

Errors shown to operators should be:

* understandable
* concise
* actionable where possible
* in Bahasa Indonesia

Do not expose raw stack traces or technical API errors to operators.

Technical errors may still be logged for debugging.

---

# 15. Loading States

Do not use loading states that make the UI look broken.

Prefer:

* skeletons
* progress indicators
* spinners
* subtle transition states

Avoid:

* completely blank pages
* flashing HTML
* unnecessary full-page reloads
* blocking the entire application when only one component is loading

---

# 16. Scanner / Camera

Camera/scanner functionality must:

* request permission appropriately
* handle permission denial
* avoid opening prematurely
* provide clear scanning state
* stop/release camera when no longer required
* avoid multiple camera instances
* handle scan success safely
* prevent accidental duplicate scans

Camera behavior should be tested on an actual mobile device where possible.

---

# 17. Navigation

Navigation must be intentional.

Each page should have:

* clear page title
* usable back navigation where required
* no clipped headers
* no inaccessible controls
* correct browser/app route

Do not rely exclusively on browser back behavior for operational navigation.

---

# 18. Responsive Design

Primary target:

```text
Mobile
```

Secondary:

```text
Tablet
Desktop
```

Do not design desktop-first and simply shrink it.

Touch targets should be comfortable.

Avoid controls that are too small or too close together.

---

# 19. Accessibility & Usability

At minimum:

* buttons must be identifiable
* text must remain readable
* contrast must be sufficient
* interactive elements must have clear states
* disabled/loading states must be understandable
* keyboard focus should not be broken
* camera permission/error states must be clear

---

# 20. Code Quality

Prefer:

* small components
* reusable components
* clear naming
* simple logic
* predictable state
* centralized API services
* minimal duplication

Avoid:

* huge components
* duplicated API calls
* duplicated business logic
* unnecessary dependencies
* magic strings scattered throughout the application
* temporary hacks left undocumented

---

# 21. Dependencies

Do not install a new dependency unless:

1. It solves a real problem.
2. The existing project cannot reasonably solve it.
3. It does not unnecessarily increase complexity.

Prefer the existing stack.

---

# 22. Build Verification

After meaningful code changes, run:

```bash
npm run build
```

A task is not considered complete if the project does not build successfully.

If tests/linting exist, run them as appropriate.

---

# 23. Visual Verification

After UI changes, inspect the actual application.

Check:

* mobile viewport
* header
* spacing
* buttons
* loading state
* empty state
* error state
* navigation
* scanner placement
* progress indicator
* text clipping

Do not assume a successful build means the UI is correct.

---

# 24. Git / Change Discipline

Keep changes focused.

Do not modify unrelated files merely because they are available.

For every implementation:

```text
What changed?
Why?
What files changed?
How was it verified?
Are there known limitations?
```

---

# 25. Working With AI Coding Agents

AI agents must not blindly implement a request.

Before coding:

```text
Understand → Inspect → Plan → Implement
```

After coding:

```text
Build → Verify → Report
```

When requirements conflict, prioritize:

1. Latest explicit user instruction
2. Current project specification
3. Existing architecture
4. Established UI/UX decisions
5. Older assumptions

Do not silently revert newer product decisions.

---

# 26. Important Existing Project Context

The project has previously included work involving:

* Login
* Active user
* Logout
* Pending Sales Order
* Ready-to-pick orders
* Picking flow
* Picking progress
* Camera/scanner
* Delivery Note submission
* Pickup Code after picking
* Customer Pickup QR
* API integration with Thunder
* Proxy/CORS
* Nginx
* Production environment configuration

Treat these as existing project history, not independent new features.

Before modifying them, inspect the current implementation.

---

# 27. Reporting Format

After completing work, report:

### Implemented

* feature/change 1
* feature/change 2

### Files Changed

* `path/to/file`
* `path/to/file`

### Verification

```bash
npm run build
```

Result:

```text
PASS / FAIL
```

### Notes

Mention:

* assumptions
* remaining work
* API dependencies
* known issues

Do not claim a feature works if it has not been verified.

---

# 28. Golden Rule

**Do not optimize for writing code quickly. Optimize for making the existing Murni Booth application more reliable without breaking its operational flow.**
