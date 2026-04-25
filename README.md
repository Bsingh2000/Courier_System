# RouteGrid Courier

RouteGrid Courier is a Vercel-ready Next.js operations app for a courier business. It gives you:

- A public onboarding site where businesses can submit an inquiry
- A protected client portal for approved businesses to create deliveries and review their own history
- A protected driver workspace for viewing assigned runs, updating stop statuses, and recording road notes
- A protected admin portal with company admin users, role access, a mobile drawer shell, compact delivery list, dedicated order workspace, driver management, inventory controls, planning tools, and audit export
- A demo mode that works immediately
- A Supabase-backed mode for persistent production data

## Operating model

This repository is being structured for a managed rental model:

- The product owner keeps ownership of the codebase and infrastructure
- Each company rents a private instance monthly
- Each company gets their own deployment and their own Supabase project
- Company data is isolated by infrastructure, not just by UI

Reference docs:

- [Commercial model](docs/commercial-model.md)
- [Company provisioning](docs/company-provisioning.md)

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase (optional but recommended for production persistence)
- Vercel deployment target

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If you do nothing else, the app runs in demo mode with seeded in-memory data.

## Demo admin access

When Supabase is not configured, the admin page uses the seeded owner account:

- Email: `admin@routegrid.local`
- Password: `dispatch123`

Open `http://localhost:3000/admin`.

## Demo client access

- Email: `ops@nikoautoparts.com`
- Password: `client123`

Open `http://localhost:3000/sign-in`.

## Demo driver access

- Email: `asha@routegrid.local`
- Password: `driver123`

Open `http://localhost:3000/driver-sign-in`.

## Production setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run [supabase/schema.sql](supabase/schema.sql).
3. Optionally run [supabase/seed.sql](supabase/seed.sql) for a starter owner account, clients, drivers, and inventory.
4. Copy `.env.example` to `.env.local` for local work.
5. Set `APP_URL` to the full URL you want password setup emails to return to. For local work, use `http://localhost:3000`.
6. In Supabase Auth URL settings, add your `/set-password` URL to the allowed redirect list. Examples:
   - `http://localhost:3000/set-password`
   - `https://your-domain.com/set-password`
7. Add the same environment variables in Vercel.
8. Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` so server-side password login can use the proper Supabase Auth client.
9. Use the bootstrap owner credentials to sign in once, then create company admin users from the `Admins` tab.
10. Deploy the repository from GitHub to Vercel.

If you want a demo-ready live instance after Supabase is configured, run:

```bash
npm run seed:live-demo
```

That command loads a reusable sample dataset into the connected Supabase project:
owner account, client accounts, drivers, deliveries, activity feed, and audit history.

For company-specific production setup, use the checklist in [docs/company-provisioning.md](docs/company-provisioning.md).

## Environment variables

See `.env.example`.

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `APP_URL` for password setup email redirects
- `COURIER_ADMIN_EMAIL` for the bootstrap owner login
- `COURIER_ADMIN_PASSWORD` for the bootstrap owner login
- `SESSION_SECRET`

The app uses server-side Supabase access for writes and admin reads, and Supabase Auth for admin, client, and driver identities. Existing seeded or legacy accounts migrate into `auth.users` on their next successful password login. If Supabase keys are missing, the app falls back to demo mode automatically.

## Account onboarding

Admins can now onboard company admins, clients, and drivers in two ways:

- `Send setup email` sends a Supabase password setup link to the user
- `Generate temp password` shows a one-time password for manual handoff

In demo mode, setup email requests fall back to a generated temporary password automatically because no mail delivery is available.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run seed:live-demo
```

## Project structure

```text
src/
  app/
    admin/                admin login
    dashboard/            admin dashboard
    driver/               driver workspace
    portal/               client workspace
    api/                  inquiries, auth, dispatch, audit export, and admin management routes
  components/
    public/               public forms and landing-page widgets
    dashboard/            admin controls, planning, audit, and management tools
    driver/               driver workspace controls
    shell/                shared brand and workspace shell components
  lib/
    auth.ts               signed admin, client, and driver session helpers
    audit.ts              audit diff and CSV helpers
    repository.ts         demo/live data access
    validators.ts         zod request validation
```

## Deployment notes

- The UI is designed to remain usable at phone widths down to `360px`.
- Demo mode is useful for previews, but it is not persistent.
- Production persistence requires Supabase.
- Admin, client, and driver workspaces are protected with signed cookie sessions.
- Audit exports are available from the admin audit tab.
- The intended commercial model is single-tenant: `1 company = 1 deployment = 1 Supabase project`.
