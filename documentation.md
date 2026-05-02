# ArifSmart Menu — Project Documentation

Comprehensive technical documentation for the **ArifSmart Menu** system: a production-grade, QR-based multi-restaurant ordering platform.

---

## 1. System Architecture

The project is architected as a **Monorepo** using `pnpm` workspaces to ensure strict contract sharing and ease of deployment.

### Workspace Structure
- **`backend`**: NestJS backend providing the core RESTful services and real-time state management.
- **`frontend`**: Next.js (App Router) mobile-first frontend designed for customer ordering and staff operations.
- **`backend/shared`**: The "Source of Truth" containing shared Zod validation schemas, API DTOs (Data Transfer Objects), and Type Definitions.

---

## 2. Core Workflows & Logic

### 2.1 Table Context & Session Flow
Unlike traditional e-commerce, ArifSmart is context-aware:
1. **Entry**: Customer scans a QR code leading to `/menu/[branchId]/[tableId]`.
2. **Context Resolution**: The frontend calls `GET /table-context/:branchId/:tableId`. 
   - If a table has an active session, it is returned. 
   - If no session exists, the backend initializes a new `isActive: true` session.
3. **Session Binding**: Every action (Cart, Order) is bound to the current `sessionId`.

### 2.2 Order Lifecycle & Validation
Order creation follows a zero-trust model:
- **Linear State Transitions**: Status can only move forward `CREATED -> CONFIRMED -> PREPARING -> READY -> DELIVERED`. Skipping states is forbidden at the service level.
- **Price Security**: The backend ignores frontend-sent prices. It fetches live menu items from PostgreSQL, re-calculates the `totalPrice` server-side, and snapshots the `unitPrice` at the moment of order for audit integrity.
- **Display Numbers**: Every order receives a human-friendly string (e.g., `#4921`) generated at creation for kitchen tracking.

### 2.3 Cart & Data Isolation
- **Strict Isolation Key**: Local cart state is keyed as `cart:${branchId}:${tableId}:${sessionId}:${customerRef}`. This prevents "cross-talk" if a user switches tables or restaurants on the same device.
- **Price Snapshots**: The cart stores a `priceAtAdd` snapshot to prevent UI flickering if prices are updated while a customer is browsing.

---

## 3. Real-time & Offline Strategy

### 3.1 Hybrid Synchronization
The system prioritizes reliability over novelty:
- **Baseline**: High-frequency polling (every 3 seconds) using TanStack Query handles the state synchronization for Orders and Kitchen dashboards.
- **Enhancement**: Socket.io provides instantaneous "push" updates, triggering queries to refetch immediately when a change occurs.

### 3.2 Offline Retry Queue
To handle unstable restaurant networks:
- Failed `orders.create` requests (network errors/503/504) are pushed into an `arifsmart_offline_queue` in `localStorage`.
- A global listener in the `Providers` component detects the browser `online` event and flushes the queue automatically, ensuring no order is lost.

---

## 4. Security & Access Control

### 4.1 Multi-level Isolation
- **Branch Isolation**: Every database query (Menu, Categories, Orders) includes `branchId` filtering to prevent data leakage between different restaurants.
- **Session Lockdown**: Tables are locked to a single `activeSession`. New orders cannot be created if the session is closed.

### 4.2 Staff Authentication
- **PIN-based Logic**: Staff (Kitchen/Admin) log in using a 4-digit PIN associated with their `StaffUser` record.
- **JWT Guards**: Route access is protected by `JwtAuthGuard` and `RolesGuard`. Admins cannot access Kitchen views, and unauthorized users are completely blocked from staff endpoints.

---

## 5. Development & Deployment

### Tech Stack
- **ORM**: Prisma (PostgreSQL).
- **Styling**: Tailwind CSS + Vanilla CSS variables for theming.
- **Animations**: Framer Motion (scoped to transitions and modals only for maximum list performance).

### Environment Configuration
| Variable | Description | Location |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `backend/.env` |
| `JWT_SECRET` | Secret key for staff tokens | `backend/.env` |
| `NEXT_PUBLIC_API_URL` | Backend REST endpoint | `frontend/.env.local` |
| `NEXT_PUBLIC_BRANCH_ID` | Default branch for testing | `frontend/.env.local` |

### Getting Started
1. **Infrastructure**: Run `docker-compose up -d` to start the PostgreSQL instance.
2. **Setup**: Run `pnpm install` in the root.
3. **Database**: Run `pnpm --filter api run db:migrate` then `pnpm --filter api run db:seed`.
4. **Development**: Run `pnpm dev` to start both API and Web servers concurrently.

---

---

## 6. Production Deployment

### 6.1 Backend (Railway / Render / VPS)
The backend uses a multi-stage Docker build for efficiency.
1.  **Infrastructure**: Provision an always-on PostgreSQL database (e.g., Railway Postgres, Supabase).
2.  **Deploy**: 
    - Connect your repo to **Railway**.
    - Set the **Root Directory** to `/backend`.
    - Provide the Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`.
    - The `Dockerfile` in `/backend` will be auto-detected.

### 6.2 Frontend (Vercel)
1.  **Deploy**: 
    - Connect your repo to **Vercel**.
    - Set the **Root Directory** to `/frontend`.
    - Provide the Environment Variables: `NEXT_PUBLIC_API_URL` (URL of your backend) and `NEXT_PUBLIC_BRANCH_ID`.

### 6.3 CI/CD Pipeline
A GitHub Action is configured in `.github/workflows/deploy.yml`:
- **Triggers**: On push to `main` or `master`.
- **Requirements**: Add the following secrets to GitHub:
    - `RAILWAY_TOKEN`: For backend updates.
    - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`: For frontend updates.

---

*ArifSmart Menu — Building the future of Ethiopian hospitality.*
