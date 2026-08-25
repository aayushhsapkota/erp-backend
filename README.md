# Quartz ERP — Backend

A Node.js/Express REST API backed by MongoDB, powering the Quartz ERP small-business system: auth, customer/merchant management, inventory, sales/purchase invoicing (with returns), payments, a unified transactions ledger, expenses, and dashboard analytics.

This is the API for [`ERP-UI`](../ERP-UI), the React frontend that consumes it.


## Tech stack

- **Express 4** — HTTP server & routing
- **Mongoose 6** — MongoDB ODM
- **jsonwebtoken** + **bcryptjs** — auth (JWT bearer tokens, hashed passwords)
- **cors**, **morgan** — middleware
- **dotenv** — environment config
- **nodemailer** — email
- **nepali-date-converter** — Bikram Sambat (Nepali) date handling
- **nodemon** — dev auto-reload

## Prerequisites

- Node.js 16+ and npm
- A MongoDB database (Atlas cluster or local instance)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with:

   | Variable | Description |
   | --- | --- |
   | `CONNECTION_URL` | MongoDB connection string |
   | `signatureKey` | Secret used to sign/verify JWTs |
   | `PORT` | Port to listen on (optional, defaults to `80`) |
   | `TZ` | Server timezone — set to `Asia/Kathmandu`. All Nepali-date range logic assumes the process clock is on Nepal Standard Time (fixed UTC+5:45, no DST) |

   `.env` already exists locally for this project and is git-ignored — never commit real credentials.

3. Start the server:

   ```bash
   npm run dev
   ```

   | Script | Purpose |
   | --- | --- |
   | `npm run dev` / `npm start` | Start with nodemon (auto-reload) |
   | `npm run production` | Start with plain `node` |

On startup the app connects to MongoDB and logs `Database connected`, then starts listening on `PORT`.

## Authentication

- `POST /API/users/signin` / `POST /API/users/signup` issue a JWT signed with `signatureKey`, embedding `id` and `isAdmin`.
- Every other route is protected by the `auth` middleware ([middleware/auth.js](middleware/auth.js)), which expects `Authorization: Bearer <token>`.
- Routes further guarded by `checkAdmin` require `isAdmin: true` in the token (returns `403` otherwise) — used for destructive actions and admin-only analytics/settings.

## API overview

Base path: `/API`

| Resource | Base route | Notes |
| --- | --- | --- |
| Users | `/API/users` | `signin`, `signup` |
| Clients | `/API/clients` | CRUD for customers & merchants (single model, distinguished by `clientType`); `POST /multiple` for bulk import |
| Products | `/API/products` | CRUD, `/filter`, `PATCH /quantity/:id` to add/reduce stock |
| Invoices | `/API/invoices` | Sales/purchase invoices (and their returns) via `transactionType`; `/newInvoiceNo/:type`, `/client/:id` for purchase history, admin-only delete |
| Payments | `/API/payments` | Record/update/delete `PaymentIn` / `PaymentOut` entries |
| Transactions | `/API/transactions` | Unified ledger across invoices & payments; `/report/:id` for a client/merchant statement, `/product/:id` for stock movement history |
| Expenses | `/API/expenses` | CRUD + `/filter` |
| Dashboard data | `/API/dashData` | Admin-only analytics: revenue, purchases, expenses, revenue by category, stock, financials, cash flow, day book, monthly profit |
| Company | `/API/company` | Get/update business profile (update is admin-only) |

## Project structure

```
app.js                # Express app setup, DB connection, route mounting
routes/                # One router per resource
controller/             # Route handlers / business logic
models/                 # Mongoose schemas
middleware/auth.js      # JWT verification (`auth`) and role gate (`checkAdmin`)
Utils/                  # Shared helpers (pagination, Nepali date ranges)
scripts/                # One-off maintenance scripts
```

## Deployment

Currently deployed on Render; the frontend's default API base URL points at that instance. When running locally, point `ERP-UI` at `http://localhost:<PORT>/API/` instead (see the frontend README).
