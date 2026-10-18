# FieldOps

A field service management platform for commercial dispatch, technician scheduling, work order lifecycles, and automated complaint triage.

Built with Express, Prisma, PostgreSQL, Next.js 16, and Tailwind CSS.

---

## Features

- **Work Order Lifecycle**: Deterministic state machine (`DRAFT` &rarr; `SCHEDULED` &rarr; `DISPATCHED` &rarr; `IN_PROGRESS` &rarr; `COMPLETED`) with strict transition rules (e.g. requires at least one labor line item before completing, mandatory reasons for holds or cancellations).
- **Conflict-Free Scheduling**: Validates technician availability against active time slots before assigning to prevent overlapping bookings.
- **Line Items & Billing**: Add parts and labor to jobs with automatic sales tax (8.25%) calculation and cent-accurate rounding.
- **AI Complaint Triage**: Analyzes customer service requests to predict urgency, category, and matching technician. Uses an LLM with an automatic rule-based fallback when offline or unconfigured.
- **Audit Trails**: Every state change, timestamp, and AI prediction is logged with dispatcher override tracking.
- **Role-Based Access Control**: Pre-configured roles for Admins, Dispatchers, and Field Technicians.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express 5.3, TypeScript, Prisma 7.10, Zod, Jest, Supertest |
| **Database** | PostgreSQL |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons |
| **Tooling** | pnpm, Biome (linter/formatter) |

---

## Project Structure

```
.
├── backend/
│   ├── prisma/             # Schema & database seed script
│   ├── src/
│   │   ├── ai/             # AI triage engine & fallback heuristic matrix
│   │   ├── config/         # Environment configuration (Zod validated)
│   │   ├── controllers/    # Request handlers (auth, orders, customers, ai)
│   │   ├── db/             # Prisma client singleton
│   │   ├── middleware/     # Auth, RBAC, error handling, rate limiting
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # State machine, pricing, schedule validator
│   │   └── utils/          # AppError classes, logger
│   └── tests/              # Jest integration & unit test suites
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (orders, customers, technicians, triage)
│   │   ├── components/     # UI components (sidebar, order drawer, modals, badges)
│   │   ├── context/        # Auth context & session provider
│   │   └── lib/            # API client & TypeScript interfaces
│   └── public/             # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+ (local or hosted instance)

---

### 1. Database Setup

Ensure PostgreSQL is running and you have an empty database ready.

```sql
CREATE DATABASE fieldops;
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

Edit `backend/.env` with your database connection:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/fieldops?schema=public"
JWT_SECRET="replace-with-a-secure-random-string-min-32-chars"
JWT_EXPIRES_IN="24h"

# Optional: LLM configuration (Groq, OpenAI, or any compatible endpoint)
# Leave empty to run the built-in rule-based heuristic engine
AI_API_KEY=""
AI_API_URL="https://api.groq.com/openai/v1/chat/completions"
AI_MODEL="openai/gpt-oss-120b"
```

Push the database schema and seed initial data:

```bash
# Push Prisma schema to the database
pnpm db:push

# Seed demo users, customers, technicians, and work orders
pnpm db:seed
```

Run tests to verify the setup:

```bash
pnpm test
```

Start the backend development server:

```bash
pnpm dev
```

The API will be running at `http://localhost:5000`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

Ensure `frontend/.env.local` points to your backend:

```env
BACKEND_URL=http://127.0.0.1:5000
```

Start the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

The database seed provides three pre-configured accounts covering each role. You can log in using the credentials below or click any of the **Quick Demo Personas** buttons on the login page:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fieldops.local` | `AdminPass123!` | Full access to work orders, customers, pricing, and system settings |
| **Dispatcher** | `dispatcher@fieldops.local` | `DispatchPass123!` | Work order intake, scheduling, technician assignment, AI triage review |
| **Technician** | `tech.mike@fieldops.local` | `TechPass123!` | Assigned job execution, status updates, labor and parts logging |

---

## AI Triage System

The triage engine analyzes incoming customer complaints to automate classification and dispatch suggestions:

- **Urgency Prediction**: Evaluates text severity into `LOW`, `MEDIUM`, `HIGH`, or `EMERGENCY`.
- **Trade Category**: Maps issues to `HVAC`, `PLUMBING`, `ELECTRICAL`, `REFRIGERATION`, or `APPLIANCE`.
- **Symptom Extraction**: Extracts specific symptoms (e.g. `water leak`, `compressor noise`, `sparking`).
- **Technician Matching**: Recommends the best available technician based on trade skills and current active workload.

### Dual-Engine Design

```
Customer Request ──► [ AI Triage Pipeline ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Live LLM Engine ]             [ Heuristic Matrix ]
   - Groq / OpenAI completions     - Deterministic keyword matching
   - Structured JSON response      - Sub-5ms execution
   - 3,000ms timeout guard         - Automatic fallback if no API key,
                                      rate-limited, or network error
```

1. **Primary (LLM)**: Sends the complaint to the configured model (e.g. Groq `openai/gpt-oss-120b`). Returns structured JSON with confidence score and diagnostic reasoning.
2. **Fallback (Heuristic)**: If the API key is missing, times out (>3 seconds), or fails, the system automatically falls back to a weighted keyword matching matrix. The dispatch workflow never breaks due to external API failures.
3. **Telemetry & Feedback**: All predictions are saved to `ai_triage_logs`. Dispatchers can inspect predictions in the **AI Triage** view, record agreements, or override urgency levels. Telemetry tracks fallback rate and dispatcher concordance over time.

---

## Business Logic & Rules

### State Machine Transitions

Work orders follow an explicit lifecycle enforced in the backend:

- `DRAFT` &rarr; `SCHEDULED`, `CANCELLED`
- `SCHEDULED` &rarr; `DISPATCHED`, `CANCELLED`
- `DISPATCHED` &rarr; `IN_PROGRESS`, `SCHEDULED` (recall), `CANCELLED`
- `IN_PROGRESS` &rarr; `PENDING_PARTS`, `COMPLETED`, `CANCELLED`
- `PENDING_PARTS` &rarr; `IN_PROGRESS`, `CANCELLED` (requires a hold reason)
- `COMPLETED` &rarr; Terminal state (requires at least one labor item on the order)
- `CANCELLED` &rarr; Terminal state (requires a cancellation reason)

Invalid transitions (such as jumping from `DRAFT` directly to `COMPLETED`) return HTTP `422 Unprocessable Entity`.

### Scheduling Conflict Prevention

When scheduling a technician, the system checks for overlapping time ranges with their existing active jobs:

```
existingStart < newEnd && existingEnd > newStart
```

If an overlap is detected, the API returns HTTP `409 Conflict` with details of the conflicting job.

### Billing & Pricing

- **Line Items**: Orders support `LABOR` and `PART` line items with quantity and unit price.
- **Tax Calculation**: Automatically calculates 8.25% sales tax on the subtotal.
- **Locking**: Line items cannot be added or deleted once an order is marked `COMPLETED` or `CANCELLED`.

---

## API Overview

All protected endpoints require an `Authorization: Bearer <token>` header. RBAC rules strictly enforce role permissions (rejecting unauthorized roles with HTTP `403 Forbidden`).

### System Health
- `GET /api/v1/health` - Service health and operational status check `(Public)`

### Authentication & Users
- `POST /api/v1/auth/login` - Authenticate user credentials and receive JWT `(Public)`
- `GET /api/v1/auth/me` - Retrieve current authenticated user profile `(All roles)`
- `GET /api/v1/users/technicians` - List technicians with trade skills, workload, and assignments `(Admin, Dispatcher)`
- `POST /api/v1/users/technicians` - Register a new field technician with trade competencies `(Admin only)`
- `PATCH /api/v1/users/technicians/:id` - Update technician details, trade skills, and active status `(Admin only)`

### Work Orders
- `GET /api/v1/work-orders` - List work orders with pagination, search, and filters `(Role-scoped for Technicians)`
- `POST /api/v1/work-orders` - Create work order with automated code generation `(Admin, Dispatcher)`
- `GET /api/v1/work-orders/:id` - Get full work order details, items, customer, and audit history `(All roles)`
- `PATCH /api/v1/work-orders/:id` - Update work order details, technician, and schedule with conflict checking `(Admin only)`
- `PATCH /api/v1/work-orders/:id/status` - Transition work order status (enforces state machine & schedule conflict checks) `(All roles)`
- `POST /api/v1/work-orders/:id/items` - Add a labor or part line item with auto-calculated 8.25% sales tax `(All roles)`
- `DELETE /api/v1/work-orders/:id/items/:itemId` - Remove a line item and recalculate order financial totals `(All roles)`

### Customers
- `GET /api/v1/customers` - List customer accounts with active work order counts `(Admin, Dispatcher)`
- `GET /api/v1/customers/:id` - Retrieve customer profile with associated work orders `(Admin, Dispatcher)`
- `POST /api/v1/customers` - Create a new customer profile `(Admin, Dispatcher)`
- `PATCH /api/v1/customers/:id` - Update customer profile and site details `(Admin only)`

### AI Triage
- `POST /api/v1/ai/triage` - Run AI triage analysis & technician recommendation on complaint text `(Admin, Dispatcher)`
- `GET /api/v1/ai/metrics` - Retrieve aggregate triage telemetry (fallback frequency, agreement rate) `(Admin, Dispatcher)`
- `GET /api/v1/ai/logs` - Retrieve recent triage audit logs `(Admin, Dispatcher)`
- `PATCH /api/v1/ai/logs/:id/evaluate` - Submit dispatcher concordance review or urgency override `(Admin, Dispatcher)`
