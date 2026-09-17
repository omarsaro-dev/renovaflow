# RenovaFlow

Customer-facing construction project management for small contractors. Teams plan jobs, track tasks and budgets, share photo updates with customers, and collect approvals on change orders — all from one app.

Built with **Next.js 14 (App Router)**, **Prisma + SQLite**, **NextAuth v5 (beta, JWT)**, **Zod**, and **Tailwind CSS**.

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

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
#    Copy .env.example to .env (or reuse existing .env)
#    DATABASE_URL="file:./dev.db"  (SQLite)

# 3. Create the database schema
npx prisma db push

# 4. (Optional) Load demo data
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first registered account becomes the organization owner; it can then add team members and customers from the app.

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
npm run build          # production build
npm run lint           # ESLint
npm run db:generate    # (re)generate the Prisma client
npm run db:push        # sync schema.prisma to the database
npm run db:seed        # load demo data (idempotent — wipes demo tables first)
npm run db:migrate     # create/apply migrations
npm run db:studio      # open Prisma Studio
```

## Project structure

```
prisma/
  schema.prisma        # data model
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
- SQLite is used for local development/demo; the Prisma schema is portable to
  PostgreSQL (`file:` → connection string).

## Tech notes

- NextAuth v5 beta uses a JWT session strategy; user id + role are carried on
  the token and resolved server-side against Prisma.
- Route groups `(auth)`, `(team)`, `(customer)` share layouts without adding
  path segments.
- Notification `link` values keep team and customer views on their OWN side of
  the app (`/app/...` vs `/portal/...`) to enforce separation.