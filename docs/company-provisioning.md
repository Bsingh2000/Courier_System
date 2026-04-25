# Company Provisioning

This document defines the repeatable setup process for a new company.

## Provisioning goal

Each company should receive a private, isolated RouteGrid instance with:

- Their own Supabase project
- Their own app deployment
- Their own secrets
- Their own initial admin access

## Standard setup flow

1. Create a new Supabase project for the company.
2. Apply [supabase/schema.sql](../supabase/schema.sql).
3. Optionally apply [supabase/seed.sql](../supabase/seed.sql) if starter data is useful.
4. Create a new deployment for the company from the same codebase.
5. Add company-specific environment variables to that deployment.
6. Set the company's first admin credentials.
7. Connect the company's domain or subdomain.
8. Run a full smoke test.

## Company-specific environment values

Every company deployment needs its own values for:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SESSION_SECRET`
- `COURIER_ADMIN_EMAIL`
- `COURIER_ADMIN_PASSWORD`

These values must never be reused across companies.

## Recommended deployment pattern

Use:

- One shared Git repository
- One deployment per company
- One Supabase project per company

Do not fork the codebase for normal company onboarding.

## Naming convention

Use a predictable company identifier for:

- Supabase project naming
- Deployment naming
- Environment variable records
- Internal support notes

Example:

- Company key: `northshore-courier`
- App deployment: `routegrid-northshore`
- Supabase project: `routegrid-northshore-db`

## Initial admin bootstrap

At provisioning time, create a first admin identity for the company.

Current bootstrap method:

- Admin email and password are configured by environment variables

Planned improvement:

- Replace single env-based admin auth with database-backed `admin_accounts`

## Smoke test checklist

After provisioning, confirm:

1. Public site loads correctly
2. Admin login works
3. Inquiry submission works
4. Direct client creation works
5. Client sign-in works
6. Driver sign-in works
7. Delivery creation works
8. Delivery updates persist
9. Audit entries are written

## Company-specific customization

The codebase should stay shared. Company-specific identity should come from configuration and database settings.

Planned company settings:

- Company name
- Logo
- Support details
- Address
- Optional color/theme values

## Suspension and offboarding

If a company stops paying, define a standard process.

Recommended order:

1. Suspend access
2. Retain data for the agreed retention period
3. Provide export only if included in the agreement
4. Archive or delete infrastructure after the retention period

## Full handoff case

If a company later purchases the system outright, the handoff process should be separate from normal monthly rental.

A full handoff should define:

- Whether source code is transferred
- Whether infrastructure ownership is transferred
- Whether Supabase ownership is transferred
- Whether post-handoff support is included

## Next technical work

After documenting this model, the next architecture tasks are:

1. Add `admin_accounts`
2. Add company-specific `company_settings`
3. Replace env-only admin bootstrap with proper admin management
4. Continue production Supabase alignment using the single-company-per-project model
