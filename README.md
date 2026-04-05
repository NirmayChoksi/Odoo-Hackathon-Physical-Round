# Odoo Hackathon — Physical Round (Subscription & Commerce)

Monorepo with an **Angular** staff/customer frontend and an **Express + MySQL** backend for subscriptions, products, quotations, billing configuration, and a storefront-style external API.

## Prerequisites

- **Node.js** (LTS recommended; project uses modern Angular 21)
- **MySQL 8+** (subscriptions dummy script uses window functions)
- **npm**

## Repository layout

| Path | Description |
|------|-------------|
| `Backend/` | Express API, SQL schema, DB setup, optional dummy seed files |
| `Frontend/` | Angular SPA (login, subscription workspace, portal routes) |
| `Backend/subscription_management.sql` | Core schema |
| `Backend/subscription_triggers.sql` | e.g. auto `subscription_number` (`SOxxx`) |
| `Backend/sql/pre-schema/`, `Backend/sql/patches/` | Optional pre-schema and ordered patches (used by setup when present) |

## Backend

### Environment

Create `Backend/.env` (never commit real secrets). Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=subscription_management_system

PORT=3000
JWT_SECRET=use_a_long_random_string_in_production
CLIENT_URL=http://localhost:4200

# Signup assigns this DB role by name unless DEFAULT_SIGNUP_ROLE_ID is set
DEFAULT_SIGNUP_ROLE_NAME=External User

# Optional: email (password reset, etc.)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=
```

### Database setup (first time)

From `Backend/`:

```bash
npm install
npm run setup-db
```

This creates the database (default name above), runs `subscription_management.sql`, patches, triggers, and performance index helpers where configured.

### Run API

```bash
npm run dev
```

- Listens on `http://localhost:3000` by default (or `PORT`).
- Health check: `GET http://localhost:3000/health`
- On startup, `ensureDbPatches` runs; the process exits if the database is unreachable or base tables are missing.

### Production-style build

```bash
npm run build
npm start
```

Runs compiled output from `dist/` (after `tsc`).

### API surface (summary)

- **`/api/auth`** — signup, login, JWT, password reset flows
- **`/api/external/*`** — shop, cart, checkout, orders, invoices, profile (customer-facing)
- **`/api/internal/*`** — customers, contacts, products, variants, recurring plans, quotation templates, subscriptions, taxes, discounts, attributes, users, reports, payment terms, etc.

Postman: `Backend/postman/Odoo-Hackathon-API.postman_collection.json` and environment JSON alongside it.

## Frontend

From `Frontend/`:

```bash
npm install
npm start
```

The app proxies **`/api`** to **`http://localhost:3000`** via `proxy.conf.json`, so run the backend on that port (or adjust the proxy).

Production build:

```bash
npm run build
```

Output under `Frontend/dist/`.

### Routes

- Public: login, signup, password reset, portal pages as configured in `app.routes.ts`
- **`/subscription`** — internal subscription workspace (guarded); configuration modules (products, taxes, discounts, quotation templates, etc.)

## Development tips

- Keep **backend** and **frontend** running together for full UI flows; API calls go to `/api/...` and are proxied during `ng serve`.
- If subscription inserts fail on numbering, ensure `subscription_triggers.sql` has been applied (handled by `setup-db` when configured).
- Use `GET /health` to confirm the API is up before debugging the SPA.

## License

See project / team instructions for hackathon submission terms.
