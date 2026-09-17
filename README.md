# RenovaFlow

Customer-facing construction project management for small contractors. Teams plan jobs, track tasks and budgets, share photo updates with customers, and collect approvals on change orders — all from one app.

Built with **Next.js 14 (App Router)**, **Prisma + PostgreSQL**, **NextAuth v5 (beta, JWT)**, **Zod**, and **Tailwind CSS**.

## Features

**Team app** (`/app`)
- Project board with status, progress, and customer/manager assignments
- Per-project modules: Tasks, Budget & expenses, Files, Updates, Timeline, Settings
- Kanban-style task tracking with priorities, notes, and status transitions
- Category budgets with change orders; manager/owner approval workflow
- Expense log per category with estimated vs. actual tracking
- Photo and document uploads (protected storage, image thumbnails)
- Post customer-facing progress updates with threaded comments
- Org-wide dashboards for budget, files, and notifications

**Customer portal** (`/portal`)
- My projects overview with live progress and approved budget
- Progress updates feed with reply comments
- Photos & files shared by the contractor
- Change order reviews — approve or reject with a note
- Transparent budget & cost summary

**Auth & access**
- Email/password sign in with session JWT
- Roles: Admin, Manager, Worker, Customer
- Workers only see projects they're assigned to (project membership)
- Customers only see their own projects and customer-visible files/updates

## Getting started

Requirements: Node 18+, and a PostgreSQL database (local install, or a hosted
offering like **Neon**, **Supabase**, or **Vercel Postgres**). SQLite is no
longer used — the app needs Postgres, including on Vercel.

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#    Set DATABASE_URL to your Postgres connection string, e.g.
#    DATABASE_URL="postgresql://renovaflow:password@host:5432/renovaflow?sslmode=require"
#    Set NEXTAUTH_SECRET (random string) and NEXTAUTH_URL

# 3. Apply the schema (uses prisma/migrations)
npm run db:migrate-deploy

# 4. (Optional) Load demo data
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first registered account becomes the organization owner; it can then add team members and customers from the app.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Create a hosted Postgres database (Neon, Supabase, or Vercel Postgres).
3. In **Vercel → Project → Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `NEXTAUTH_SECRET` — a long random string
   - `NEXTAUTH_URL` — your deployment URL (e.g. `https://renovaflow.vercel.app`)
4. In **Vercel → Project → Settings → Build & Deployment**, the deploy uses
   the `vercel-build` script automatically, which runs
   `prisma migrate deploy && prisma generate && next build`. This applies
   migrations to your database on each deploy.
5. Deploy. After the first successful deploy, run the seed once:
   `npx prisma db seed` locally against your remote `DATABASE_URL`, or use
   `npm run db:seed` with the production connection string in `.env`.

## Demo accounts

After `npm run db:seed`:

| Role     | Email                     | Password  |
| -------- | ------------------------- | --------- |
| Admin    | `admin@lakeside.example`  | `demo1234`|
| Manager  | `marcus@lakeside.example` | `demo1234`|
| Worker   | `sofi@lakeside.example`   | `demo1234`|
| Worker   | `gabe@lakeside.example`   | `demo1234`|
| Customer | `ben.foster@example.com`  | `demo1234`|

## Useful scripts

```bash
npm run dev            # start the dev server
npm run build          # production build (runs `prisma generate`)
npm run vercel-build   # Vercel build: migrate deploy + generate + next build
npm run lint           # ESLint
npm run db:generate    # (re)generate the Prisma client
npm run db:push        # sync schema.prisma to the database (dev)
npm run db:seed        # load demo data (idempotent — wipes demo tables first)
npm run db:migrate     # create/apply migrations (dev)
npm run db:migrate-deploy  # apply migrations (prod)
npm run db:studio      # open Prisma Studio
```

## Project structure

```
prisma/
  schema.prisma        # data model
  migrations/          # SQL migrations (applied via prisma migrate deploy)
  seed.js              # demo seed (npm run db:seed)
src/
  app/
    (auth)/            # login, register, forgot/reset password
    (team)/app/        # contractor-facing app
    (customer)/portal/ # customer portal
    api/               # route handlers (Next.js server actions are not used)
  components/
    ui/                # primitives (button, card, dialog, badge, input…)
    shared/            # shell layout, status badges, file uploader
    projects/ tasks/ budget/ files/ updates/ settings/ customers/
  lib/
    auth.ts            # NextAuth config (JWT)
    permissions.ts     # role/scoping guards (team, project, customer)
    api.ts             # ok / created / apiError / parseBody helpers
    validation.ts      # Zod schemas shared by routes and forms
    activity.ts        # activity timeline recording
    notifications.ts   # in-app notification fan-out
    money.ts           # budget snapshot/summary math
    files.ts           # protected file storage + thumbnail generation
```

## Security notes

- Uploaded files live outside `public/` (`data/uploads/`) and are served only
  through authenticated route handlers with per-role authorization.
- Every API route re-validates the session, organization, and resource scope —
  the UI never grants access on its own.
- Passwords are hashed with bcrypt (`bcryptjs`, cost 12).
- PostgreSQL is the only supported database (SQLite was used early in the MVP
  for local demos but is incompatible with Vercel's serverless filesystem).

## Tech notes

- NextAuth v5 beta uses a JWT session strategy; user id + role are carried on
  the token and resolved server-side against Prisma.
- Route groups `(auth)`, `(team)`, `(customer)` share layouts without adding
  path segments.
- Notification `link` values keep team and customer views on their OWN side of
  the app (`/app/...` vs `/portal/...`) to enforce separation.