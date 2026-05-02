# ArifSmart Menu SaaS Architecture & Migration Blueprint

This document outlines the architectural blueprint and step-by-step migration strategy to transform the single-tenant ArifSmart Menu project into a production-grade, multi-tenant SaaS platform. This plan adheres strictly to the modular monolith pattern, preserving the existing operational UX while introducing rigorous tenant isolation, role-based access control, and scalability readiness.

## 1. Full SaaS Architecture Plan

### Domain Architecture
The core hierarchy shifts from a Branch-centric model to a Tenant-centric model:
**`Restaurant (Tenant)`** → **`Branch (Location)`** → **`DiningTable` / `Category` / `MenuItem`** → **`Order`**

### Tenancy Model (Logical Isolation)
We will use **Logical Isolation (Row-Level Tenancy)** within a shared PostgreSQL database. Every tenant-scoped entity will contain a `restaurantId`. Tenant isolation will be enforced at three layers:
1. **Routing/Context Layer**: `AsyncLocalStorage` (ALS) to hold the current tenant context.
2. **Data Access Layer**: Prisma Client Extensions to automatically inject `restaurantId` filters.
3. **Application Layer**: NestJS Guards to validate JWT scopes against the requested resources.

### Module Structure additions
- **`TenantModule`**: Handles onboarding, subscription oversight, and tenant resolution.
- **`PlatformAdminModule`**: Super-admin endpoints for managing the SaaS (suspensions, global analytics).
- **`IamModule` (Identity & Access)**: Replaces simple PIN auth with robust JWT generation handling roles, `restaurantId`, and optional `branchId` scoping.

---

## 2. Updated Prisma Schema

We introduce `Restaurant`, `SubscriptionPlan`, and refactor `StaffUser` to a more robust `User` model. We also denormalize `restaurantId` down the chain to prevent expensive joins and ensure query safety.

```prisma
// ─── Enums ────────────────────────────────────────────────────────────────────
enum Role {
  SUPER_ADMIN        // Platform Owner
  RESTAURANT_ADMIN   // Tenant Owner
  MANAGER            // Branch Manager
  KITCHEN            // Kitchen Staff
  STAFF              // Floor Staff
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

// ─── SaaS Core Models ─────────────────────────────────────────────────────────

model SubscriptionPlan {
  id             String       @id @default(uuid())
  name           String       // "Starter", "Pro", "Enterprise"
  maxBranches    Int          @default(1)
  maxStaff       Int          @default(5)
  priceMonthly   Float
  features       Json?        // Feature gating flags
  restaurants    Restaurant[]
  createdAt      DateTime     @default(now())

  @@map("subscription_plans")
}

model Restaurant {
  id                 String             @id @default(uuid())
  slug               String             @unique // For subdomains: tenant.arifsmart.com
  name               String
  isActive           Boolean            @default(true)
  subscriptionStatus SubscriptionStatus @default(TRIALING)
  planId             String
  plan               SubscriptionPlan   @relation(fields: [planId], references: [id])
  
  users              User[]
  branches           Branch[]
  categories         Category[]
  menuItems          MenuItem[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@map("restaurants")
}

model User {
  id           String     @id @default(uuid())
  restaurantId String?    // Nullable ONLY for SUPER_ADMIN
  branchId     String?    // Nullable if user is RESTAURANT_ADMIN (has access to all branches)
  name         String
  email        String?    @unique // Added for admin login
  pinHash      String     // Kept for rapid staff terminal login
  role         Role
  isActive     Boolean    @default(true)
  
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  branch       Branch?     @relation(fields: [branchId], references: [id], onDelete: SetNull)
  createdAt    DateTime    @default(now())

  @@index([restaurantId])
  @@index([email])
  @@map("users")
}

// ─── Tenant-Scoped Domain Models ──────────────────────────────────────────────

model Branch {
  id           String      @id @default(uuid())
  restaurantId String      // [NEW] Tenant Isolation
  name         String
  // ... existing fields ...
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  tables       DiningTable[]
  users        User[]
  categories   Category[]

  @@index([restaurantId])
  @@map("branches")
}

model DiningTable {
  id           String       @id @default(uuid())
  restaurantId String       // [NEW] Denormalized for security
  branchId     String
  tableNumber  Int
  qrCode       String       @unique
  // ... existing fields ...
  
  @@index([restaurantId])
  @@index([branchId])
  @@unique([branchId, tableNumber])
  @@map("dining_tables")
}

model Category {
  id           String      @id @default(uuid())
  restaurantId String      // [NEW]
  branchId     String
  // ... existing fields ...
  
  @@index([restaurantId])
  @@map("categories")
}

// Order and OrderAudit MUST also receive `restaurantId` for tenant-safe aggregations
model Order {
  id            String       @id @default(uuid())
  restaurantId  String       // [NEW] Strict isolation
  tableId       String
  // ... existing fields ...
  
  @@index([restaurantId])
  @@index([tableId])
  @@map("orders")
}
```

---

## 3. NestJS Module Restructure & Context Strategy

We will use `AsyncLocalStorage` (ALS) to pass the tenant context down to the Prisma layer without polluting every service method signature.

### Tenant Context Implementation
```typescript
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  restaurantId: string;
  userId: string;
  role: Role;
}
export const tenantStorage = new AsyncLocalStorage<TenantContext>();
```

### Request Flow
1. **`JwtAuthGuard`**: Validates JWT, extracts `restaurantId` and `role`.
2. **`TenantInterceptor`**: Wraps the request execution in `tenantStorage.run({ restaurantId, ... }, () => next.handle())`.
3. **`PrismaService`**: Uses a Prisma Client Extension to read `tenantStorage.getStore()` and append `where: { restaurantId }`.

---

## 4. Authorization Design

### JWT Payload Structure
```json
{
  "sub": "user_uuid",
  "restaurantId": "tenant_uuid",
  "role": "MANAGER",
  "branchId": "branch_uuid_or_null",
  "exp": 1714521600
}
```

### Guards
- **`TenantGuard`**: Ensures `req.user.restaurantId` matches the `restaurantId` of the resource being accessed (if passed in URL). However, the Prisma Extension makes this almost foolproof.
- **`RolesGuard`**: 
  - `@Roles(Role.SUPER_ADMIN)` for platform routes.
  - `@Roles(Role.RESTAURANT_ADMIN, Role.MANAGER)` for branch settings.
  - `@Roles(Role.KITCHEN)` for kitchen endpoints.

---

## 5. Realtime Architecture

Socket.io rooms must be strictly hierarchical to prevent cross-tenant data leakage.

### Room Hierarchy
- **`rest:${restaurantId}:admin`**: Global restaurant stats.
- **`rest:${restaurantId}:branch:${branchId}:kitchen`**: Kitchen workflow.
- **`rest:${restaurantId}:branch:${branchId}:pos`**: Front-of-house staff.

### Connection Security
When a socket connects, the `jwt` must be validated in the `WsGuard` or middleware. The socket object is then tagged with `socket.data.restaurantId`.
```typescript
// tenant-safe emit
this.server.to(`rest:${restaurantId}:branch:${branchId}:kitchen`).emit('new_order', order);
```
Clients must explicitly join rooms, and the gateway will verify `client.data.restaurantId === requestedRestaurantId` before allowing the join.

---

## 6. Database Query Safety Strategy

To guarantee zero cross-tenant leakage, we will implement a **Prisma Client Extension**. This intercepts all queries and automatically applies the tenant filter.

```typescript
// In PrismaService setup
this.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = tenantStorage.getStore();
        
        // Models that require tenant isolation
        const tenantModels = ['Branch', 'Category', 'MenuItem', 'DiningTable', 'Order', 'OrderAudit'];
        
        if (context && context.role !== 'SUPER_ADMIN' && tenantModels.includes(model)) {
          // Deeply inject restaurantId into the where clause
          args.where = { ...args.where, restaurantId: context.restaurantId };
        }
        return query(args);
      },
    },
  },
});
```
*Note: Public endpoints (like scanning a QR code) will execute outside the `tenantStorage` context, but will explicitly lookup via `qrCode` which is globally unique, then resolve the tenant.*

---

## 7. Frontend SaaS Changes

1. **Routing Strategy**: 
   - Customers: Keep `/menu/[branchId]/[tableId]`. The backend resolves `restaurantId` from the `branchId`.
   - Staff/Admin: Move to `/app/...` or subdomain `tenant.arifsmart.com/admin`.
2. **Authentication**: Admin panel gets a full email/password login. Staff maintain PIN login tied to a specific branch URL/Terminal.
3. **Platform Admin UI**: A new Next.js route `/platform` accessible only to `SUPER_ADMIN` to view all tenants, MRR, and suspend accounts.
4. **Zustand Stores**: Update `cartStore` and `localOrderStore` keys to include `restaurantId` (`cart:${restaurantId}:${branchId}:${tableId}:${sessionId}`).

---

## 8. Scaling Strategy

- **Horizontal Scaling**: The modular monolith is perfectly suited for horizontal scaling behind a load balancer (e.g., AWS ALB or Render native routing).
- **Redis Readiness**: As traffic grows, Socket.io will require the `@nestjs/platform-socket.io` Redis adapter to sync events across multiple Node.js instances.
- **Caching**: TanStack query handles read-heavy client state. For backend menu fetching, implement CacheManager (in-memory or Redis) scoped by `restaurantId`.

---

## 9. Security Strategy

- **Zero-Trust**: Prices are NEVER trusted from the frontend. `totalPrice` is calculated via `restaurantId` + `menuItemId` database lookups.
- **Idempotency & Replay Protection**: The offline retry queue (frontend `localOrderStore`) uses a local UUID (`localOrderId`). The backend will check `OrderAudit` or an `idempotencyKey` column on `Order` to prevent duplicate charges if a network hiccup causes a double-send.
- **Audit Logging**: `OrderAudit` will now require `restaurantId` to generate tenant-specific audit trails.

---

## 10. Step-by-Step Migration Plan (Minimal Downtime)

This migration must be phased to prevent breaking the existing operational restaurant.

### Phase 1: Schema Expansion (No Downtime)
1. Deploy Prisma schema updates adding `SubscriptionPlan`, `Restaurant`, and `restaurantId` to all models as **NULLABLE** (`String?`).
2. Generate Prisma Client. Application ignores these fields for now.

### Phase 2: Data Backfill (No Downtime)
1. Create a migration script that:
   - Creates the default `SubscriptionPlan` (e.g., "Legacy Plan").
   - Creates a `Restaurant` record for the current single tenant (e.g., "ArifSmart Original").
   - Updates all existing `Branch`, `DiningTable`, `Category`, `MenuItem`, `Order`, `StaffUser` records to set `restaurantId = new_restaurant_id`.

### Phase 3: Enforce Constraints (Brief Maintenance Window)
1. Update Prisma schema to make `restaurantId` **REQUIRED** (`String`) on all scoped models.
2. Add `@index([restaurantId])` to all scoped tables.
3. Run `prisma migrate deploy`.

### Phase 4: Application Layer Rollout (Rolling Update)
1. Deploy NestJS code with `TenantInterceptor`, updated JWT payload, and Prisma Client Extension.
2. Update the frontend Zustand stores to factor in `restaurantId`.
3. Existing staff sessions will need to be invalidated (force re-login to get the new JWT payload).

### Phase 5: SaaS Onboarding & Admin Panel (No Downtime)
1. Release the Super Admin platform UI.
2. Enable self-serve signups for new restaurants, creating isolated data boundaries natively.

---

## 11. Critical SaaS Architecture Decisions

### 1. Tenant Routing Strategy
**Recommendation: Hybrid Routing (Subdomain for Admin, Immutable Path/ID for Customers)**

*   **Customer QR Menu**: `arifsmart.com/menu/[branchId]/[tableId]` (Path-based using immutable UUIDs)
*   **Staff/Admin Dashboard**: `[tenant-slug].arifsmart.com` (Subdomain-based)

**Technical Reasoning:**
*   **Operational Reliability (The Physical Constraint)**: QR codes are printed and glued to physical tables. If a restaurant rebrands or changes its subdomain, a subdomain-based QR code (e.g., `oldname.arifsmart.com/menu/t1`) becomes a dead link, requiring expensive physical reprints. By using a permanent, globally unique `branchId` in the path, the physical QR code is immortal. The backend seamlessly resolves the new branding.
*   **Admin UX**: Subdomains provide a strong psychological sense of isolation and ownership for staff. It also isolates authentication cookies, preventing session bleed if a manager is switching between environments.
*   **Scalability & CDN**: Path-based customer routing allows aggressive edge caching on a single domain without managing thousands of SSL certificates for every tiny restaurant client immediately.

### 2. User Account Centralization
**Recommendation: Globally Centralized Identity with Scoped Memberships**

Instead of isolated user accounts per tenant, the system will use a single global `User` table, with permissions defined via a `UserRestaurantMembership` junction table (or role arrays).

**Technical Reasoning:**
*   **Franchise & Multi-Brand Operators**: Restaurant owners often manage multiple brands. Forcing them to maintain separate credentials for each brand is a hostile UX. A single identity allows a "Switch Restaurant" dropdown.
*   **Platform Support**: `SUPER_ADMIN` users need a single identity to "assume" a tenant's context for troubleshooting without creating dummy accounts in every restaurant.
*   **Staff Mobility**: Gig economy or floating staff can use one identity across multiple branches or even different restaurant brands using ArifSmart.
*   **Security Impact**: The JWT payload must encode the *currently active* `restaurantId`. When a user switches restaurants, the client requests a fresh JWT scoped to the new tenant. This guarantees that a leaked token for Restaurant A cannot be used to access Restaurant B.

### 3. Tenant Resolution Strategy
**Recommendation: Multi-Layered Deterministic Resolution with AsyncLocalStorage**

The backend must definitively know the current tenant without explicit parameter passing in every function.

*   **Web Requests (Admin/Staff)**: Resolved via the authenticated JWT. The `JwtAuthGuard` extracts the `restaurantId` from the token payload.
*   **Web Requests (Customer QR)**: Resolved via database lookup. A middleware intercepts the request, looks up the `branchId` from the URL parameter, resolves the parent `restaurantId`, and caches it for the request lifecycle.
*   **WebSockets**: Handshake validation. The initial socket connection requires the JWT. `WsGuard` validates it and explicitly tags the socket connection: `socket.data.tenantId = decoded.restaurantId`.
*   **Context Propagation**: Once resolved, the `restaurantId` is injected into NestJS's `AsyncLocalStorage` (ALS). Deep down the stack, the Prisma Client Extension reads the ALS and appends `where: { restaurantId: ctx.restaurantId }` to every query, making cross-tenant data leaks nearly impossible.

### 4. Future White-Label Readiness
**Recommendation: Prepare Data Structures Now, Postpone Infrastructure Complexity**

*   **Do Now (Data & UI)**: Update the `Restaurant` model to store a `themeConfig` JSON block (primary colors, logo URLs, font preferences). Update the Next.js frontend to parse this config on load and dynamically inject CSS variables (`--brand-primary`). This allows instant, cheap "branded" experiences on the shared `arifsmart.com` domain.
*   **Postpone (Infrastructure)**: Full custom domains (e.g., `menu.mcdonalds.com` mapping to your servers). This requires automated SSL provisioning (e.g., Cloudflare API or Vercel Custom Domains API) and complex DNS verification flows. Architect the system to lookup tenants by custom domain eventually, but do not build the automated provisioning pipeline until Enterprise customers demand it.

### 5. Final SaaS Strategy Conclusion

The recommended architecture—**Modular Monolith + Hybrid Routing + Centralized Identity + Prisma RLS-style Extensions**—is the optimal path for scaling ArifSmart Menu. 

Why this is best for a QR SaaS:
1.  **Immortality of Physical Assets**: Decoupling the printed QR code (path-based) from the tenant's brand name (subdomain/theme) saves restaurants thousands in reprint costs.
2.  **Operational Simplicity**: You avoid the DevOps nightmare of managing Kubernetes microservices or Kafka event buses before reaching $10M ARR. A well-structured NestJS monolith on a robust PostgreSQL instance can scale to thousands of restaurants.
3.  **Ironclad Security**: By centralizing tenant filtering in the Prisma Extension layer rather than relying on developers to remember to add `where: { restaurantId }` in every service method, you eliminate the most common cause of SaaS data leaks.

---

> [!IMPORTANT]
> User Review Required: Please review the **Hybrid Routing Strategy** and the **Centralized Identity** approach. These decisions fundamentally shape the URL structure and login flows. If you approve, the architecture plan is complete and we can proceed to execution.
