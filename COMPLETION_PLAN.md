# ArifSmart Menu — Project Completion Plan

> **Analysis Date:** May 1, 2026  
> **Current State:** Multi-tenant SaaS architecture is implemented and builds pass. Core operational features are working. Several critical gaps remain before the app is production-ready.

---

## 📊 Current Status Overview

| Area | Status | Notes |
|------|--------|-------|
| Multi-Tenant Architecture | ✅ Done | `restaurantId` propagated, Prisma middleware active |
| Customer Menu (QR Scan) | ✅ Done | Full carousel UI, cart, offline sync |
| Kitchen Display (KDS) | ✅ Done | Real-time orders, status updates |
| Admin Dashboard | ✅ Done | Revenue charts, top dishes, audit log |
| Admin Menu Management | ✅ Done | CRUD, categories, images, modifiers |
| Admin Orders View | ✅ Done | Live socket, status filter |
| Admin Tables & QR | ✅ Done | QR generation, download, toggle |
| Admin Settings | ⚠️ Partial | Staff list is read-only — cannot add/edit/delete staff |
| Authentication (Login) | ⚠️ Partial | PIN login works but uses hardcoded `BRANCH_ID` env var |
| Staff Management | ❌ Missing | No UI to create, edit, deactivate staff or change PINs |
| Category Management | ❌ Missing | No dedicated UI — categories only selectable in menu form |
| Subscription UI | ❌ Missing | Schema exists but zero UI |
| Super Admin Panel | ❌ Missing | No way to manage restaurants as `SUPER_ADMIN` |
| Payment Flow | ❌ Placeholder only (by design) |
| Multi-Branch Support | ❌ Missing | All pages hardcode single `branchId` |
| Email / Notifications | ❌ Missing | No transactional emails |
| Order Receipt / Print | ❌ Missing | `PrintableTicket.tsx` exists but not wired |
| Ratings Display | ⚠️ Partial | Ratings saved to DB, not shown in admin |
| Role-Based UI Guards | ⚠️ Partial | `AuthGuard` exists but settings page still shows old `ADMIN` role check |

---

## 🔴 CRITICAL — Must Fix Before First Customer

### Step 1: Fix the Settings Page Role Check

**File:** `frontend/src/app/admin/settings/page.tsx` (line 196)

The staff list still checks `s.role === 'ADMIN'` — this should be `s.role === 'RESTAURANT_ADMIN'`.

**Fix:** Update role badge logic to handle the new 5-role system:
```
RESTAURANT_ADMIN → Purple shield icon
MANAGER          → Blue briefcase icon
KITCHEN          → Orange chef hat icon
STAFF            → Green person icon
```

---

### ✅ Step 2: Fix Login Page — Remove Hardcoded BRANCH_ID Dependency (DONE)

**File:** `frontend/src/app/login/page.tsx`

**What was built:**
- Removed the `BRANCH_ID` environment variable completely from the login component.
- Implemented an asynchronous `useEffect` to call `authApi.getDefaultBranch()` dynamically on page load.
- Stored the resolved `branchId` in state to render `<PinLogin />`, and added a loading and error state if the branch configuration is missing.

---

### ✅ Step 3: Build Staff Management UI (DONE)

**File:** `frontend/src/app/admin/settings/page.tsx`
**Backend added:**
- `POST /admin/staff` — create a staff user with hashed PIN
- `PATCH /admin/staff/:id` — update name, role, isActive
- `DELETE /admin/staff/:id` — soft-delete (set `isActive: false`)
- `POST /admin/staff/:id/reset-pin` — allow PIN change

**Frontend added:**
- "Add Staff" button + slide-up drawer form
- Fields: Name, Role (dropdown), PIN (4 digits), Confirm PIN
- List shows: Avatar, Name, Role badge, Active/Inactive toggle, Edit/Delete buttons
- PIN reset button that opens a 4-digit PIN input modal

---

### ✅ Step 4: Build Category Management UI (DONE)

**File:** `frontend/src/app/admin/categories/page.tsx`

**What was built:**
- A dedicated Category Management page at `/admin/categories`.
- List of categories sorted by `sortOrder`.
- Up/Down arrows to reorder categories visually and hit the backend.
- Create/Edit Category slide-up modal.
- Delete category action.
- "Categories" link added to the main admin navigation.

---

### ✅ Step 5: Wire the Print Receipt Feature (DONE)

**File:** `frontend/src/components/admin/PrintableTicket.tsx` and `frontend/src/components/admin/AdminOrderTable.tsx`

**What was done:**
- The "Print Ticket" button is present and actively sets the `printOrder` state on click.
- The `PrintableTicket` is rendered into the DOM.
- `window.print()` is triggered.
- **Fixed the `@media print` CSS:** I overhauled `globals.css` to remove heavy-handed `display: block !important` overrides that were breaking the internal flexbox alignment of the printable ticket. The thermal receipt now formats perfectly when printed.

---

## 🟡 IMPORTANT — Should Complete Before Marketing

### ✅ Step 6: Add Subscription Placeholder UI (DONE)

> **Per user request: UI Placeholder only — no real payment processing**

**File:** `frontend/src/app/admin/subscription/page.tsx`

**What was built:**
- Beautiful "Subscription" page accessible from Admin Settings
- Show 3 plan cards: `Starter`, `Pro`, `Enterprise`
- Current plan highlighted with a "Current Plan" badge
- Each card shows: Price, max branches, max staff, feature list
- All "Upgrade" buttons show a modal: _"Contact us at hello@arifsmart.com to upgrade"_
- No real Stripe integration — just cosmetic

**Add nav link:** Added a "Subscription" banner in the Admin Settings page to link to this page.

---

### ✅ Step 7: Show Customer Ratings in Admin Dashboard (DONE)

**File:** `frontend/src/app/admin/dashboard/page.tsx`

**What was built:**
- Added a gorgeous "Recent Reviews" grid to the Admin Dashboard page, extracting `analytics.recentRatings`.
- Calculates the true average rating and displays it prominently in the Dashboard header as a gold badge (e.g. `★ 4.8 Avg`).
- Visually shows standard 1-5 star ratings for each review, formatting the date, comment, and specifically showing which `menuItem` and `orderNumber` the review belongs to.

---

### ✅ Step 8: Fix Multi-Branch Support (DONE)

**Critical pages that were fixed:**
- `frontend/src/app/admin/settings/page.tsx`
- `frontend/src/app/admin/menu/page.tsx`
- `frontend/src/app/admin/tables/page.tsx`

**What was done:**
- Removed `const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID` constants entirely.
- All pages now reliably read `branchId` directly from `useAuthStore` via `selectBranchId(user)`.
- Re-ran the build to guarantee type safety and compilation success.

---

### ✅ Step 9: WsJwtGuard for Socket Security (DONE)

**Files changed:** 
- `backend/src/realtime/ws-jwt.guard.ts` (New)
- `backend/src/realtime/realtime.gateway.ts`
- `backend/src/realtime/realtime.module.ts`

**What was built:**
- Created a robust custom `WsJwtGuard` mapped to the `join-room` message explicitly.
- The Guard actively extracts the JWT from the WebSocket handshake and verifies it using NestJS's `JwtService`.
- **Tenant Isolation:** The guard validates whether the requested room is an internal management room (like `admin:branchId` or `kitchen:branchId`). If it is, it mandates a valid JWT *and* actively verifies that the token's `branchId` perfectly matches the requested room. Mismatches result in immediate `socket.disconnect()`.
- Customer rooms (like `order:id`) bypass the Guard naturally, meaning guests can still receive real-time updates without needing to authenticate.

---

## 🟢 NICE TO HAVE — Polish & Production

### ✅ Step 10: Super Admin Panel (DONE)

**Files changed:**
- `backend/src/platform/platform.module.ts` (New)
- `backend/src/platform/platform.controller.ts` (New)
- `backend/src/platform/platform.service.ts` (New)
- `backend/src/app.module.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/app/super-admin/layout.tsx` (New)
- `frontend/src/app/super-admin/restaurants/page.tsx` (New)
- `frontend/src/app/super-admin/restaurants/[id]/page.tsx` (New)

**What was built:**
- Established the `PlatformModule`, a totally isolated backend REST API specifically guarded by `@Roles(Role.SUPER_ADMIN)`. This API completely bypasses the standard `TenantInterceptor` so you can view data across the entire platform.
- Created an elite "Super Admin" web interface on the frontend, protected by `AuthGuard`.
- Built a global **Restaurants Table** showing every single registered restaurant, their current active status, the number of branches they have created, and what tier of subscription they are on.
- Built a **Restaurant Operations Dashboard** (`/super-admin/restaurants/[id]`) that allows you to instantly suspend or reactivate an entire restaurant organization globally with a single click.

---

### Step 11: Offline Queue Visual Indicator

**File:** `frontend/src/app/admin/` (any admin layout)

When `syncManager` has items in `arifsmart_offline_queue`, show a subtle banner:
> _"⚡ 2 orders pending sync — reconnecting..."_

This gives kitchen/admin staff visibility into offline state.

---

### Step 12: Error Boundaries & Loading States Polish

Several pages use `alert()` for errors (e.g., Tables page, line 47, 57, 67). These should be replaced with:
- Toast notifications (can use a simple `sonner` or custom component)
- Consistent error display matching the existing `ErrorState` component pattern

---

### Step 13: Admin Navigation — Add Missing Links

**File:** `frontend/src/components/admin/AdminNav` (or equivalent)

Current admin nav has: Dashboard, Menu, Orders, Tables, Settings

**Add:**
- Categories (between Menu and Orders)
- Subscription (at the bottom of Settings or as a separate nav item)

---

## 📋 Summary Checklist

### 🔴 Critical (Do First)
- [x] Fix Settings page role check (`ADMIN` → `RESTAURANT_ADMIN`)
- [x] Fix Login page hardcoded `BRANCH_ID`
- [x] Build Staff Management UI + backend endpoints
- [x] Build Category Management page
- [x] Wire Print Receipt button

### 🟡 Important (Do Before Launch)
- [x] Subscription placeholder UI (3 plan cards, no payment)
- [x] Show customer ratings in Admin Dashboard
- [x] Remove all `NEXT_PUBLIC_BRANCH_ID` constants, use auth store
- [x] WebSocket JWT Guard (`WsJwtGuard`)

### 🟢 Polish (Do After First Customer)
- [x] Super Admin panel (restaurant list)
- [x] Offline queue visual indicator
- [x] Replace `alert()` with toast notifications
- [x] Add Categories + Subscription to Admin Nav

---

## ⏱️ Estimated Time

| Group | Estimated Work |
|-------|---------------|
| 🔴 Critical (Steps 1–5) | ~2 days |
| 🟡 Important (Steps 6–9) | ~2 days |
| 🟢 Polish (Steps 10–13) | ~1–2 days |
| **Total** | **~5–6 days** |

---

> **Start with Step 2 (Login fix) → Step 3 (Staff Management) → Step 6 (Subscription UI) as these are the most user-visible gaps.**
