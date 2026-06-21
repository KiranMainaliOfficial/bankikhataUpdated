# BankiKhata

BankiKhata is a MERN stack credit and debt management system for Nepal-focused small shops, pharmacies, hardware stores, grocery stores, and local businesses.

## Features

- JWT admin/staff authentication with bcrypt password hashing.
- Role-based API authorization.
- Customer CRUD with auto-generated customer IDs.
- Credit and payment ledger with running balances.
- Mobile-first React admin dashboard.
- English and Nepali UI switching with local persistence.
- Light and dark theme switching with local persistence.
- Dashboard summary cards and Recharts analytics.
- Customer profile with call and SMS reminder quick actions.
- Search, sort, pagination-ready APIs, and responsive tables.
- Daily, weekly, monthly, yearly, and custom report API support.
- XLSX/CSV import for customers and transactions.
- XLSX/CSV/PDF export for customers and transactions.
- Google Sheets manual sync hook using service-account credentials.
- Settings, user management, activity logs, PWA manifest, and deployment notes.

## Folder Structure

```text
bankikhata/
  client/                React + Vite + Tailwind frontend
  server/                Express + MongoDB backend
  .env.example           Shared environment template
  README.md              Setup and deployment guide
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
cp .env.example server/.env
cp .env.example client/.env
```

3. Start MongoDB locally or set `MONGO_URI` to a MongoDB Atlas connection string.

4. Seed the first admin:

```bash
npm run seed
```

Default seed credentials from `.env.example`:

```text
admin@bankikhata.local
ChangeMe123!
```

5. Start the full stack:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Health check: `http://localhost:5000/health`

## Environment Variables

`MONGO_URI` MongoDB connection string.

`JWT_SECRET` Long random secret used to sign auth tokens.

`CLIENT_URL` Frontend origin for CORS.

`VITE_API_URL` API base URL used by the React app.

`GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, and `GOOGLE_SHEETS_SPREADSHEET_ID` enable manual Google Sheets sync.

## Google Sheets Setup

1. Create a Google Cloud service account.
2. Enable Google Sheets API.
3. Share the target spreadsheet with the service-account email.
4. Put service-account values in `.env`.
5. Use the Sync Sheets button from Import / Export.

The sync route writes Customers and Transactions sheets. Two-way sync is intentionally left as a controlled extension point because conflict resolution needs business rules.

## Deployment Guide

### Backend

- Deploy `server/` to Render, Railway, Fly.io, or a VPS.
- Set all server environment variables.
- Use MongoDB Atlas for production.
- Run `npm run seed --workspace server` once after deployment.

### Frontend

- Deploy `client/` to Vercel, Netlify, Cloudflare Pages, or static hosting.
- Set `VITE_API_URL` to the production API URL.
- Run `npm run build --workspace client`.
- Serve `client/dist`.

### Production Checklist

- Replace default admin password immediately.
- Use a long random `JWT_SECRET`.
- Restrict CORS to the production frontend domain.
- Enable HTTPS.
- Configure automated MongoDB backups.
- Review rate-limit thresholds for your shop volume.
- Add SMS or WhatsApp provider keys before enabling external reminders.

## API Overview

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/customers`
- `GET|PUT|DELETE /api/customers/:id`
- `GET|POST /api/transactions`
- `PUT|DELETE /api/transactions/:id`
- `GET /api/dashboard`
- `GET /api/reports`
- `GET|PUT /api/settings`
- `GET|POST /api/users`
- `POST /api/import-export/customers`
- `POST /api/import-export/transactions`
- `GET /api/import-export/:resource?format=xlsx|csv|pdf`
- `POST /api/sync/google-sheets`

## Notes For Commercial Hardening

This codebase is structured as a production-ready starting point. Before handling real customer financial data, add formal audit logging retention, automated tests around ledger recalculation, end-to-end backup restore drills, and SMS/WhatsApp provider compliance review.
