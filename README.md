# ANECO Feedback System

Next.js 16 + Prisma + MySQL implementation for kiosk-based feedback collection, personnel analytics, and admin account/log management.

## Prerequisites

- Node.js 20+
- MySQL via XAMPP
- Existing MySQL database named `aneco_feedback_system`

## Environment Setup

1. Copy `.env.example` values into `.env`.
2. Update `DATABASE_URL` and `JWT_SECRET` for your environment.
3. Set initial admin credentials:
	- `ADMIN_INIT_USERNAME`
	- `ADMIN_INIT_PASSWORD`

## Database Setup (Schema + Migration + Initial Admin)

Run these commands in order:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

What this does:

- Applies the initial migration in `prisma/migrations/20260323010000_init/migration.sql`.
- Creates all required tables.
- Seeds initial admin credentials and logs the seed event.

## Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Current Implemented Foundation

- Shared login API for admin/personnel role routing.
- Proxy-based route protection for `/admin` and `/dashboard`.
- Admin pages for personnel list and system logs.
- Personnel pages for analytics snapshot and form listing.
- Kiosk form listing and smiley rating submission flow.
- 4-second recognition screen with fill-more-feedback reuse behavior.
