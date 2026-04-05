# SubSync — Subscription & Commerce Platform

A full-stack subscription and billing workspace built for the **Odoo Hackathon**. SubSync covers staff operations and customer-facing flows: products, recurring plans, quotation templates, taxes, discounts, subscriptions, carts, checkout, orders, invoices, payment terms, reporting, and internal CRM-style users and contacts — aligned with subscription and Odoo-inspired configuration patterns.

---

## Tech Stack

| Layer | Technology |
|------|-------------|
| **Frontend** | Angular 21 (standalone components), Tailwind CSS v4, TypeScript, Angular Material, NgRx Signals (`@ngrx/signals`) |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database access** | `mysql2` (pools + queries; schema from SQL files, not an ORM) |
| **Validation** | Zod |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` |

---

## Project Structure

```
Odoo-Hackathon-Physical-Round/
├── Backend/                    — Express REST API
│   ├── src/
│   │   ├── config/             — MySQL pool (`db.ts`)
│   │   ├── db/                 — Patches / index helpers
│   │   ├── middlewares/        — Auth, roles, validation, errors
│   │   ├── modules/
│   │   │   ├── auth/           — Signup, login, password reset
│   │   │   ├── external/       — Shop, cart, checkout, orders, invoices, profile
│   │   │   └── internal/       — Customers, products, subscriptions, taxes, …
│   │   ├── shared/             — Mailer, utilities
│   │   ├── setupDatabase.ts    — One-shot schema load
│   │   └── index.ts            — Entry (patches + listen)
│   ├── sql/
│   │   ├── pre-schema/         — Optional pre-migration SQL (ordered)
│   │   └── patches/            — Ordered DB patches
│   ├── subscription_management.sql
│   ├── subscription_triggers.sql
│   ├── package.json
│   └── tsconfig.json
│
└── Frontend/                   — Angular SPA
    ├── src/app/
    │   ├── auth/               — Login, signup, reset / update password
    │   ├── dashboard/          — Internal dashboard shell & portal pages
    │   ├── external/           — Storefront (shop, cart, checkout, …)
    │   ├── internal/           — Subscription workspace (`/subscription/*`)
    │   └── shared/             — Shared UI (dialogs, cards, …)
    ├── proxy.conf.json         — Proxies `/api` → backend
    ├── package.json
    └── tsconfig.json
```

---

## Prerequisites

Install the following before you begin:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node)
- **MySQL** 8.0+ — [mysql.com](https://dev.mysql.com/downloads/mysql/)
- **Angular CLI** v21 (optional; you can use `npx ng` instead):

```bash
npm install -g @angular/cli
```

---

## Database Setup

1. Start your MySQL server.
2. Configure credentials in `Backend/.env` (see below). The default database name is **`subscription_management_system`**.
3. From `Backend/`, run the setup script once:

```bash
npm run setup-db
```

This creates the database (if needed), runs `subscription_management.sql`, optional files under `sql/pre-schema/` and `sql/patches/`, applies `subscription_triggers.sql` (e.g. auto `subscription_number` like `SO001`), and ensures performance indexes where configured.

> **Note:** Schema is **not** auto-synced from code. Use `setup-db` and SQL patches for structural changes.

---

## Backend Setup

### 1. Go to the backend folder

```bash
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create **`Backend/.env`**:

```env
# Server
PORT=3000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=subscription_management_system

# JWT
JWT_SECRET=your_super_secret_key_here

# Frontend URL (e.g. password-reset links)
CLIENT_URL=http://localhost:4200

# New signups: assign role by name in DB (unless DEFAULT_SIGNUP_ROLE_ID is set)
DEFAULT_SIGNUP_ROLE_NAME=External User

# Optional: email (reset flows)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=
```

> Replace `your_mysql_password` and use a strong `JWT_SECRET` in production.

### 4. Run the database setup (first time only)

```bash
npm run setup-db
```

### 5. Run the backend in development

```bash
npm run dev
```

The API listens at **`http://localhost:3000`**.

You should see something like:

```text
Server listening on http://localhost:3000
```

Startup runs DB patch checks; if MySQL is down or tables are missing, the process may exit with an error.

---

## Frontend Setup

### 1. Open a new terminal and go to the frontend folder

```bash
cd Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm start
```

This runs `ng serve` with **`proxy.conf.json`** (proxies `/api` to `http://localhost:3000`) and opens the browser.

The app is available at **`http://localhost:4200`** (or the port Angular prints).

---

## Running Both Together

Use two terminals:

| Terminal 1 (Backend) | Terminal 2 (Frontend) |
|----------------------|-------------------------|
| `cd Backend && npm run dev` | `cd Frontend && npm start` |

Then open **`http://localhost:4200`**.

---

## First-Time Access

1. **`/signup`** — create an account (assigned the role from `DEFAULT_SIGNUP_ROLE_NAME` / `DEFAULT_SIGNUP_ROLE_ID`).
2. **`/login`** — sign in with JWT-backed sessions for API calls.

Internal subscription tools under **`/subscription`** are protected (staff guard). Ensure your user has the appropriate **role** in the `roles` / `users` tables (e.g. Admin / Internal User) to access that area.

---

## Features

### Customer / storefront (`/api/external/*`)

- **Shop** — browse catalog
- **Cart & checkout** — lines, plans, totals
- **Orders & invoices** — order history and billing views
- **Profile** — account profile

### Staff / subscription workspace (`/subscription`, `/api/internal/*`)

- **Subscriptions** — create and manage subscription lifecycle
- **Products & variants** — catalog management
- **Recurring plans** — billing cadence and pricing
- **Quotation templates** — template headers and line items
- **Taxes & discounts** — rate rules and coupons
- **Attributes** — product options / values
- **Payment terms** — due rules and configuration
- **Customers & contacts** — CRM-style records
- **Users** — internal user listing (where implemented)
- **Reporting** — operational reports
- **Dashboard** — internal dashboard entry

---

## API Reference (summary)

Public health check (no auth):

| Method | Path |
|--------|------|
| `GET` | `/health` |

**Auth** (`/api/auth` — no JWT required):

| Method | Path | Description |
|--------|------|----------------|
| `POST` | `/api/auth/signup` | Register |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/reset-password` | Request reset |
| `POST` | `/api/auth/verify-reset` | Verify token / complete reset |

Most **`/api/internal/*`** and **`/api/external/*`** routes expect a **`Authorization: Bearer <token>`** header after login. Exact paths include:

| Area | Base path (examples) |
|------|----------------------|
| External shop | `/api/external/shop` |
| Cart / checkout / orders / invoices / profile | `/api/external/cart`, `…/checkout`, `…/orders`, `…/invoices`, `…/profile` |
| Internal dashboard | `/api/internal/dashboard` |
| Customers / contacts | `/api/internal/customers`, `…/contacts` |
| Products / variants | `/api/internal/products`, `…/variants` |
| Recurring plans | `/api/internal/recurring-plans` |
| Quotation templates | `/api/internal/quotation-templates` |
| Subscriptions / items | `/api/internal/subscriptions`, `…/subscription-items` |
| Invoices / payments / reports | `/api/internal/invoices`, `…/payments`, `…/reports` |
| Payment terms | `/api/internal/config/payment-terms` |
| Taxes / discounts / attributes | `/api/internal/taxes`, `…/discounts`, `…/attributes` |
| Users | `/api/internal/users` |

For detailed request bodies, use **`Backend/postman/Odoo-Hackathon-API.postman_collection.json`** (and the matching environment file in the same folder).

---

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with `ts-node-dev` (hot restart) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled app (`node dist/index.js`) |
| `npm run setup-db` | Create DB + schema + triggers + patches |
| `npm run db:patch` | Apply DB patch helper (`applyDbPatches.ts`) |

### Frontend

| Command | Description |
|---------|-------------|
| `npm start` | `ng serve` with API proxy + open browser |
| `npm run build` | Production build → `dist/` |
| `npm test` | Unit tests (`ng test`) |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP port |
| `DB_HOST` | No | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | No | `root` | MySQL user |
| `DB_PASSWORD` | No | `""` | MySQL password |
| `DB_NAME` | No | `subscription_management_system` | Database name |
| `JWT_SECRET` | Yes* | fallback in code | JWT signing secret (*use a real value in prod) |
| `CLIENT_URL` | No | `http://localhost:3000` | Base URL for links in emails |
| `DEFAULT_SIGNUP_ROLE_ID` | No | — | Numeric role id for new signups |
| `DEFAULT_SIGNUP_ROLE_NAME` | No | `External User` | Role name resolved in DB for signups |
| `SMTP_*` | No | Ethereal defaults in code | Outbound email for reset flows |

CORS is enabled broadly in code for development; tighten for production as needed.

---

## Troubleshooting

**`ER_NOT_SUPPORTED_AUTH_MODE` (MySQL 8)**  
In MySQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

**Port 3000 already in use**  
Change `PORT` in `.env` and update **`Frontend/proxy.conf.json`** `target` to the same port.

**Backend exits on startup**  
Confirm MySQL is running, `DB_*` is correct, and `npm run setup-db` completed without errors.

**`npm install` peer dependency warnings**  
Try `npm install --legacy-peer-deps` if installs fail.

**Angular CLI not found**  

```bash
npm install -g @angular/cli
```

or use `npx ng serve` from `Frontend/`.

**403 / redirect on `/subscription`**  
Your user needs an internal staff role in the database; signups default to the external role unless you change env or DB.

---

## License

See your team / hackathon rules for submission and usage terms.
