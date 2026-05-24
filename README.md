# PharmaTrack: Enterprise Multi-Tenant Pharmacy Chain SaaS Platform

PharmaTrack is an enterprise-grade, highly scalable multi-tenant SaaS platform built for modern pharmacy chains. It provides robust capabilities to resolve critical pharmacy pain points: expired medicine financial losses, inventory mismatches, manual stock tracking, purchase order failures, inter-branch transfers, GST-compliant invoicing, and AI-driven predictive demand forecasting.

The platform is designed to look, feel, and scale like a modern combination of **Zoho Inventory**, **Netmeds Admin**, and **ERPNext**.

---

## 1. System Design & Architectural Blueprint

PharmaTrack uses a modern, high-performance, modular system design:

```
                                  +---------------------------------------+
                                  |         React + Vite Frontend         |
                                  |      (tenant.pharmatrack.in)         |
                                  +-------------------+-------------------+
                                                      | HTTP / WSS
                                                      v
                                  +-------------------+-------------------+
                                  |         NestJS Backend API            |
                                  |      (Tenant Resolution & RBAC)       |
                                  +--------+---------------------+--------+
                                           |                     |
                  Internal REST (API Key)  |                     |  Prisma ORM
                                           v                     v
                        +------------------+---+      +----------+------------+
                        | Go Inventory Engine  |      |   PostgreSQL Database  |
                        | (FEFO Logic, Locks)  |      |   (Multi-Tenant RLS)  |
                        +---------+------------+      +----------+------------+
                                  |                              ^
                                  | pgx Conn Pool                |
                                  +------------------------------+
```

### Architectural Decisions
1. **Hybrid Core**: High-level orchestrations, API routing, user authentications, audit logs, AI forecasting, and integrations are managed via a modular **NestJS Monolith**. Concurrency-heavy inventory calculations (e.g., locking batches, calculating FEFO deductions, validating inter-branch transfer quantities) are offloaded to an internal **Go Inventory Microservice** for high performance and minimal memory footprint.
2. **Subdomain-Driven Multi-Tenancy**: The application resolves tenant scopes dynamically from the requested hostname (e.g., `apollo.pharmatrack.in` -> resolved as tenant `apollo`).
3. **Database Security (RLS)**: Enforced via PostgreSQL Row-Level Security policies to prevent any analytical query or batch processing leakage across isolated corporate boundaries.
4. **Fast Synchronizations**: Redis Streams are utilized as an event broker. Socket.io instances connected to NestJS push real-time updates (low stock warnings, near expiry notifications, pending transfer requests) directly to branch screens.

---

## 2. Complete Folder Structure

Below is the directory tree for the complete platform, showing where components reside:

```
pharmatrack/
├── compose.yaml                      # Unified orchestration for development
├── README.md                          # Main project architecture and documentation
├── .env.example                       # System-wide configuration templates
├── backend/                           # NestJS Monolith API
│   ├── src/
│   │   ├── main.ts                    # NestJS boostrapper with security middlewares
│   │   ├── app.module.ts              # Core module registering all imports
│   │   ├── common/                    # Custom filters, decorators, and guards
│   │   │   ├── filters/               # Global exception filters
│   │   │   ├── guards/                # JWT Auth and RBAC Roles guards
│   │   │   ├── interceptors/          # Response modifiers & logging
│   │   │   └── middleware/            # Subdomain & tenant resolution logic
│   │   └── modules/                   # Feature-specific modules
│   │       ├── tenant/                # Tenant context & billing limits
│   │       ├── auth/                  # JWT token management & rotation
│   │       ├── drug/                  # Drug Catalog Management
│   │       ├── batch/                 # FEFO Inventory Batch management
│   │       ├── dispensing/            # Invoicing & GST calculators
│   │       ├── alert/                 # Redis Streams and Socket.io gateway
│   │       ├── transfer/              # Inter-Branch transfer managers
│   │       ├── billing/               # Stripe billing checkout & webhooks
│   │       └── forecast/              # Claude AI Analytics & predictions
│   ├── prisma/
│   │   ├── schema.prisma              # Global schema mapping with RLS requirements
│   │   └── migrations/                # Database migrations
│   ├── Dockerfile
│   └── package.json
├── go-inventory/                      # Concurrency-Safe Go Inventory Engine
│   ├── cmd/
│   │   └── server/
│   │       └── main.go                # Gin Gonic microservice bootstrapper
│   ├── internal/
│   │   ├── handlers/                  # Gin REST route controllers
│   │   ├── services/                  # Core FEFO locking and deductions
│   │   └── models/                    # SQL mapped structures
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
└── frontend/                          # React + Vite client app
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                    # Route registrations and theme provider
    │   ├── index.css                  # Tailored dark-mode css system & tokens
    │   ├── components/                # Modular reusable components
    │   │   ├── ui/                    # ShadCN interactive modules (Dialog, Table)
    │   │   ├── Layout.tsx             # Responsive sidebar & header shell
    │   │   └── ProtectedRoute.tsx     # Session & RBAC validations
    │   ├── pages/                     # Specific application page interfaces
    │   │   ├── Dashboard.tsx          # Real-time indicators & charts
    │   │   ├── DrugCatalog.tsx        # Search, filters, and bulk operations
    │   │   ├── BatchManagement.tsx    # Expiry trackers & FEFO queues
    │   │   ├── BillingCounter.tsx     # POS Interface with barcode simulator
    │   │   ├── ExpiryHeatmap.tsx      # Heatmap and calendar representations
    │   │   ├── Settings.tsx           # Configurations & user role manager
    │   │   └── Subscription.tsx       # Pricing tiers and Stripe status
    │   ├── store/                     # Zustand state management
    │   │   └── useAppStore.ts         # Global active user, tenant, and cart stores
    │   └── utils/                     # GST formatting & calculators
    ├── tailwind.config.js
    ├── Dockerfile
    └── package.json
```

---

## 3. Database ER Diagram & Schema Logic

The database maps pharmaceutical inventory relations cleanly while carrying `tenantId` across all relational steps to enable strict RLS.

### Relational Schema Diagram (ERD Logic)

```
+------------------+         +------------------+         +------------------+
|      Tenant      | <-----+ |      User        | <-----+ |     AuditLog     |
+------------------+         +------------------+         +------------------+
    |           |                |                            |
    |           +------------+   | (Belongs to branch)        | (Triggered by user)
    v                        v   v                            v
+------------------+         +------------------+         +------------------+
|      Branch      | <-----+ |      Batch       | <-----+ |   InventoryLog   |
+------------------+         +------------------+         +------------------+
                             | (Tracks expiry)            | (Audits change)
                             v                            v
+------------------+         +------------------+         +------------------+
|      Drug        | <-----+ |    SaleItem      | <-----+ |      Sale        |
+------------------+         +------------------+         +------------------+
                             | (Tracks sold items)        | (GST billing)
```

### Critical Prisma Schema Concepts
* **Composite Indexes**: Models such as `Batch` implement index compositions like `@@index([tenantId, branchId, drugId])` to speed up stock checks inside the Go microservice.
* **Days-to-Expiry Tracking**: Batch models contain `expiryDate` datetimes, queried with index-level ranges to support quick visual heatmaps.
* **Row-Level Security Setup**: All tables have a DB migration statement enforcing RLS:
  ```sql
  ALTER TABLE "Batch" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON "Batch"
    USING (tenant_id = current_setting('app.current_tenant_id', true));
  ```

---

## 4. Multi-Tenant Authentication & Session Flow

The login and signup pathways dynamically adapt to subdomains:

```
  User Browses                 System Checks              Authentication
  to Subdomain                Tenant Identity                 Process
+---------------+            +---------------+            +---------------+
| apollo.       |            | Resolve       |            | Validate User |
| pharmatrack.  | ---------> | tenant:       | ---------> | Credentials   |
| in            |            | "apollo"      |            | & Subcription |
+---------------+            +---------------+            +---------------+
                                                                  |
                                                                  v
                                                          +---------------+
                                                          | Return JWT    |
                                                          | with Tenant & |
                                                          | RBAC payload  |
                                                          +---------------+
```

### RBAC Guards Implementation
User roles are validated at the middleware level in NestJS:
- **`RoleType.SUPER_ADMIN`**: Can query global settings, create new Tenants, and override Stripe plans.
- **`RoleType.CHAIN_OWNER`**: Complete management scope over all branches under their resolved Tenant ID.
- **`RoleType.BRANCH_MANAGER`**: Can execute internal branch inventory edits, approve transfers, and request purchase orders.
- **`RoleType.PHARMACIST`**: Manages batches, checks generic substitutes, and registers prescription codes.
- **`RoleType.CASHIER`**: Restricted POS billing scope; cannot execute bulk adjustments or approve transfers.

---

## 5. Stripe Billing & Lifecycle Integration

To operate as a SaaS, the platform implements complete Stripe Checkout and Webhook integrations:

* **Tiers & Caps**:
  * **Starter Plan**: Limit of 1 branch, 500 orders/month.
  * **Professional Plan**: Limit of 5 branches, 5,000 orders/month.
  * **Enterprise Plan**: Unlimited branches and orders, advanced AI analytics.
* **Stripe Webhook Flow**:
  1. User initiates checkout inside `/settings/billing`.
  2. Stripe registers payment -> sends a signed webhook containing `invoice.payment_succeeded`.
  3. NestJS `BillingModule` handles webhook payload -> parses customer's metadata -> updates/extends `Subscription` validity inside PostgreSQL.
  4. Middleware dynamically blocks actions (e.g. creating a new branch) if user's subscription limits are exceeded.

---

## 6. Go Inventory Service & Atomic FEFO Mechanics

Dispensing drugs safely requires a First-Expiry, First-Out (FEFO) strategy. When cashiers checkout, the Go microservice locks relevant records and executes deductions:

1. **Transaction Isolation**: Requests target `/deduct-stock`.
2. **Row Locking**: Queries the DB using Postgres `SELECT * FROM "Batch" WHERE "drugId" = $1 AND "branchId" = $2 AND "quantity" > 0 ORDER BY "expiryDate" ASC FOR UPDATE`.
3. **Atomic Deduction**: The service deducts the target quantity sequentially:
   - If Batch A has `qty = 10` and the order needs `15`, it sets Batch A to `0` and seeks Batch B for the remaining `5`.
   - If the total stock across all active batches is insufficient, the transaction rolls back immediately, returning an error payload (`400 Bad Request: Insufficient Stock`).
4. **Log Triggers**: Detailed `InventoryLog` records are committed in the same database transaction.

---

## 7. Event-Driven Real-Time Alerts

Notifications are handled asynchronously via a fast caching layer:

- **Redis Streams**: When a batch inventory level goes below target parameters or a near-expiry item is cataloged, the backend publishes an alert event to a Redis Stream (`alerts:stream`).
- **WebSocket Push**: A NestJS WebSocket gateway runs a background consumer loop reading from the Redis Stream, immediately pushing events to all clients connected to that tenant's channel:
  ```typescript
  // Real-time notifications pushed directly to branch cashiers
  this.server.to(tenantId).emit('notification', alertPayload);
  ```

---

## 8. AI demand Forecasting & Anomaly Detection

PharmaTrack incorporates Anthropic's Claude API to build an advanced AI system:

* **Demand Forecasting**: Analyzes a 90-day history of sales, factoring in drug categories, seasonal changes, and current stock, to predict reorder requirements and projected stock-out dates.
* **Dispensing Anomaly Detection**: Tracks cashier sales to flag unusual transaction patterns, high-frequency refunds, or mismatches, helping prevent internal leakage.
* **Substitute Engine**: Identifies substitute medicines sharing the same generic components and dosage forms when a requested brand name is out of stock.
* **Daily Expiry Digest**: A cron job runs every night to collect expiring drugs, low-stock batches, and pending transfers. Claude converts this data into a formatted email summary for the branch manager.

---

## 9. Production Scale & Deployment Blueprint

```
                     +---------------------------------------+
                     |         Global CDN / Cloudflare       |
                     +-------------------+-------------------+
                                         |
                                         v
                     +-------------------+-------------------+
                     |       Kubernetes Ingress (NGINX)      |
                     +-------------------+-------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             +---------+-----------+             +---------+-----------+
             |  NestJS API Pods    |             |   Go Engine Pods    |
             |  (Autoscaled HPA)   |             |  (Memory Efficient) |
             +---------+-----------+             +---------+-----------+
                       |                                   |
                       v                                   v
             +---------+-----------+             +---------+-----------+
             |    Redis Cluster    |             |  Supabase Postgres  |
             |   (Upstash Cache)   |             | (Connection Pooler) |
             +---------------------+             +---------------------+
```

### Scaling Strategy
1. **Database Connection Pooling**: Enforced via Prisma Accelerate or PgBouncer to prevent database exhaustion under high thread loads.
2. **Horizontal Pod Autoscaling (HPA)**: NestJS API pods are configured to autoscale based on CPU usage (>70%), while Go inventory pods are set to scale on memory thresholds.
3. **Stateless Operations**: Session data is fully packaged into JWT tokens, allowing any server node to resolve any API request without local state dependencies.

---

## 10. Development & Startup Quickstart

### Prerequisites
- Docker & Docker Compose
- Node.js v18+ & npm
- Go v1.21+

### Step-by-Step Launch Procedure
1. **Clone & Environment Setup**:
   ```bash
   cp .env.example .env
   # Customize DATABASE_URL, REDIS_URL, STRIPE_API_KEY, and ANTHROPIC_API_KEY
   ```
2. **Orchestrate Local Dependencies**:
   ```bash
   docker compose up --build -d
   ```
3. **Initialize Database Schemas**:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init_saas_schema
   ```
4. **Launch Local Servers**:
   * **Backend**: `npm run start:dev` (runs on `http://localhost:3000`)
   * **Go Inventory**: `go run cmd/server/main.go` (runs on `http://localhost:8080`)
   * **Frontend**: `npm run dev` (runs on `http://localhost:5173`)

---
