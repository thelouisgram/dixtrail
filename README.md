# Dixtrail

A sales CRM built with Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma + MongoDB, Auth.js, TanStack Query, and Zustand.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components
- **Prisma 6 + MongoDB Atlas**
- **Auth.js** (Credentials, JWT sessions)
- **TanStack Query** (server state)
- **Zustand** (UI state)
- **React Hook Form + Zod**

## Getting Started

### 1. Configure environment

Copy `.env.example` to `.env` and set your MongoDB Atlas connection string and Auth secret:

```bash
cp .env.example .env
```

Generate an auth secret (required in production — must be at least 32 characters):

```bash
openssl rand -base64 33
```

Paste the output into `AUTH_SECRET` in `.env`. The app will refuse to start in production if this is missing or still a placeholder.

### 2. Install dependencies

```bash
npm install
```

### 3. Push schema & seed data

Set a real MongoDB Atlas connection string in `.env` first, then:

```bash
npm run db:setup
```

Or step by step:

```bash
npm run db:generate   # if you see "@prisma/client did not initialize yet"
npm run db:push
npm run db:seed
```

This creates an admin user (defaults shown below). To customize, set these in `.env` **before** running seed:

```bash
SEED_ADMIN_EMAIL="admin@yourcompany.com"
SEED_ADMIN_PASSWORD="your-strong-password"
SEED_ADMIN_NAME="Admin User"
```

Then run `npm run db:seed`.

**Defaults** (when env vars are not set):
- **Email:** `admin@dixtrail.com`
- **Password:** `admin123`

### Changing the admin password later

**Option A — re-seed with a new password**

Add to `.env`:

```bash
SEED_ADMIN_PASSWORD="your-new-password"
```

Keep `SEED_ADMIN_EMAIL` matching the existing admin email, then run:

```bash
npm run db:seed
```

The upsert will update the password hash for that user.

**Option B — create a new admin in the app**

Log in as admin → Users → create a new admin account → sign in as the new user → delete the old admin (optional).

**Option C — database direct**

Use MongoDB Atlas / Prisma Studio to update the user record (password must be bcrypt-hashed — prefer Option A).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Authentication** — Email/password login with JWT sessions and role-based access
- **Roles** — Admin, Manager, Sales Rep
- **Territories** — Country → State hierarchy
- **Locations/Events** — Full CRUD with status pipeline tracking
- **Search Before Create** — Prevents duplicate events by normalized name
- **Dashboard** — Pipeline stats and recent activity
- **Filters & Pagination** — Search, filter by status/territory/rep

## Project Structure

```
src/
  app/
    (auth)/login/       # Login page
    dashboard/          # Protected dashboard routes
    api/                # REST API routes
  components/           # UI and feature components
  hooks/                # TanStack Query hooks
  lib/                  # Utilities, validations, auth helpers
  stores/               # Zustand UI state
  services/             # Business logic layer
  prisma/               # Database schema & seed
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/users` | List/create users (Admin) |
| GET/POST | `/api/locations` | List/create locations |
| PATCH/DELETE | `/api/locations/:id` | Update/delete location |
| GET | `/api/locations/search?q=` | Search events by name |
| GET/POST | `/api/countries` | List/create countries |
| GET/POST | `/api/states` | List/create states |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/reps` | Sales reps list |

## Deploy on Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set `DATABASE_URL` and `AUTH_SECRET` environment variables
4. Deploy
