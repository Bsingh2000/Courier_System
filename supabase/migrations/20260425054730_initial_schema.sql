create extension if not exists pgcrypto;

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  business_name text not null,
  email text not null unique,
  phone text not null,
  business_address text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  password_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null default 'owner' check (role in ('owner', 'admin', 'dispatcher', 'viewer')),
  status text not null default 'active' check (status in ('active', 'paused')),
  password_hash text not null,
  last_login_at timestamptz,
  created_by_admin_id uuid references public.admin_accounts(id) on delete set null,
  created_by_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  business_name text not null,
  phone text not null,
  email text not null,
  business_address text not null,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'invited', 'archived')),
  invited_client_id uuid references public.client_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text not null unique,
  zone text not null check (zone in ('east', 'west', 'north', 'south')),
  status text not null default 'available' check (status in ('available', 'on_run', 'off_duty')),
  access_status text not null default 'active' check (access_status in ('active', 'paused')),
  password_hash text not null,
  current_run text not null default '',
  today_deliveries integer not null default 0,
  cash_on_hand numeric(12, 2) not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid references public.client_accounts(id) on delete set null,
  tracking_code text not null unique,
  client_name text not null,
  client_phone text not null,
  client_email text,
  recipient_name text not null,
  recipient_phone text not null,
  pickup_address text not null,
  dropoff_address text not null,
  parcel_description text not null,
  item_count integer not null default 1,
  declared_value numeric(12, 2) not null default 0,
  quoted_price numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'bank_transfer')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  dispatch_zone text not null check (dispatch_zone in ('east', 'west', 'north', 'south')),
  status text not null default 'new' check (status in ('new', 'queued', 'dispatched', 'in_transit', 'delivered', 'issue')),
  priority text not null default 'standard' check (priority in ('standard', 'express', 'fragile')),
  driver_id uuid references public.drivers(id) on delete set null,
  driver_name text,
  scheduled_for timestamptz not null,
  eta timestamptz not null,
  notes text,
  driver_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.delivery_orders
add column if not exists client_account_id uuid references public.client_accounts(id) on delete set null;

alter table public.drivers
add column if not exists email text;

alter table public.drivers
add column if not exists access_status text not null default 'active'
check (access_status in ('active', 'paused'));

alter table public.drivers
add column if not exists password_hash text;

alter table public.drivers
add column if not exists last_login_at timestamptz;

alter table public.delivery_orders
add column if not exists driver_notes text;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null unique,
  available_units integer not null default 0,
  reserved_units integer not null default 0,
  reorder_point integer not null default 0,
  location text not null default '',
  health text not null default 'healthy' check (health in ('healthy', 'low', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references public.delivery_orders(id) on delete cascade,
  title text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  entity_type text not null check (entity_type in ('delivery', 'business_inquiry', 'client_account', 'admin_account', 'driver', 'inventory_item', 'auth', 'system')),
  entity_id text,
  delivery_id uuid references public.delivery_orders(id) on delete cascade,
  action text not null,
  summary text not null,
  actor_type text not null check (actor_type in ('admin', 'client', 'driver', 'system')),
  actor_id text,
  actor_label text,
  outcome text not null default 'success' check (outcome in ('success', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.audit_events
drop constraint if exists audit_events_entity_type_check;

alter table public.audit_events
add constraint audit_events_entity_type_check
check (entity_type in ('delivery', 'business_inquiry', 'client_account', 'admin_account', 'driver', 'inventory_item', 'auth', 'system'));

create index if not exists admin_accounts_email_idx on public.admin_accounts (email);
create index if not exists admin_accounts_role_status_idx on public.admin_accounts (role, status);
create index if not exists client_accounts_email_idx on public.client_accounts (email);
create index if not exists business_inquiries_status_idx on public.business_inquiries (status);
create index if not exists business_inquiries_email_idx on public.business_inquiries (email);
create unique index if not exists drivers_email_idx on public.drivers (email);
create index if not exists delivery_orders_client_account_id_idx on public.delivery_orders (client_account_id);
create index if not exists delivery_orders_tracking_code_idx on public.delivery_orders (tracking_code);
create index if not exists delivery_orders_client_phone_idx on public.delivery_orders (client_phone);
create index if not exists delivery_orders_status_idx on public.delivery_orders (status);
create index if not exists delivery_orders_dispatch_zone_idx on public.delivery_orders (dispatch_zone);
create index if not exists delivery_orders_created_at_idx on public.delivery_orders (created_at desc);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_entity_idx on public.audit_events (entity_type, entity_id);
create index if not exists audit_events_delivery_id_idx on public.audit_events (delivery_id);
create index if not exists audit_events_request_id_idx on public.audit_events (request_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_accounts_set_updated_at on public.admin_accounts;
create trigger admin_accounts_set_updated_at
before update on public.admin_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists client_accounts_set_updated_at on public.client_accounts;
create trigger client_accounts_set_updated_at
before update on public.client_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists business_inquiries_set_updated_at on public.business_inquiries;
create trigger business_inquiries_set_updated_at
before update on public.business_inquiries
for each row
execute function public.set_updated_at();

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at
before update on public.drivers
for each row
execute function public.set_updated_at();

drop trigger if exists delivery_orders_set_updated_at on public.delivery_orders;
create trigger delivery_orders_set_updated_at
before update on public.delivery_orders
for each row
execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

alter table public.admin_accounts enable row level security;
alter table public.client_accounts enable row level security;
alter table public.business_inquiries enable row level security;
alter table public.drivers enable row level security;
alter table public.delivery_orders enable row level security;
alter table public.inventory_items enable row level security;
alter table public.activity_log enable row level security;
alter table public.audit_events enable row level security;

comment on table public.admin_accounts is 'Buyer-side admin users, roles, and login access for the private workspace.';
comment on table public.client_accounts is 'Invited client portal accounts for approved businesses.';
comment on table public.business_inquiries is 'Public-facing client interest and onboarding requests.';
comment on table public.delivery_orders is 'Courier intake, dispatch, payment, and tracking records.';
comment on table public.drivers is 'Courier driver roster and run summaries.';
comment on table public.inventory_items is 'Operational stock used for fulfillment and dispatch.';
comment on table public.activity_log is 'Operational event stream for dashboard visibility.';
comment on table public.audit_events is 'Append-only audit trail for actions, authentication, and failures.';
