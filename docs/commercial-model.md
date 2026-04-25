# Commercial Model

This product is operated as a managed, single-tenant rental platform.

## Current model

- The product owner keeps ownership of the codebase, infrastructure, and release process.
- Each company rents a private instance of the system on a monthly basis.
- Each company receives their own app deployment and their own Supabase project.
- Company data is not mixed with any other company's data.
- A future full handoff is possible only under a separate buyout agreement.

## Single-tenant approach

For this product, the working rule is:

- `1 company = 1 deployment = 1 Supabase project`

This is the default operating model because it is simpler to secure and easier to support than a shared multi-tenant database.

## Ownership boundaries

### Product owner controls

- Source code repository
- Deployment platform accounts
- Supabase project ownership
- Environment variables and secrets
- Update and release process
- Backup and recovery process
- Suspension, export, and handoff workflow

### Each company receives

- Admin access inside their own instance
- Their own client, driver, delivery, inventory, and audit data
- Their own operational workspace
- Ongoing support under the monthly agreement

## Company isolation

Every company instance should be isolated by infrastructure, not just by UI.

That means:

- A separate Supabase project for each company
- Separate secrets for each company
- Separate deployment configuration for each company
- Separate domain or subdomain for each company

This avoids cross-company data exposure and keeps support simpler.

## Branding model

The application should eventually support company-specific branding and company information while keeping one shared codebase.

Expected company-specific settings:

- Company name
- Logo
- Support email
- Support phone
- Business address
- Optional theme values

These settings should live in the company's own database, not in the shared codebase.

## Billing and access model

The intended commercial setup is:

- The company pays monthly for access to their private system
- The product owner continues to operate the infrastructure
- If payment stops, the company can be suspended according to the agreement
- If a full buyout is agreed later, infrastructure and source handoff can happen separately

## Recommended contract points

The commercial agreement should define:

- Monthly price
- Whether hosting and Supabase costs are included
- What support is included
- What happens on late or missed payment
- Whether data export is available on exit
- What a full handoff includes

## Current product direction

Before deeper Supabase completion work, the product should move toward:

- Multiple admin accounts per company
- Company-specific settings
- Clean provisioning for new company instances
- Clear export and handoff process
