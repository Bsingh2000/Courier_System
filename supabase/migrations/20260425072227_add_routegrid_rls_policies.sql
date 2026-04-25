create or replace function public.routegrid_account_type()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'routegrid_account_type', '');
$$;

create or replace function public.routegrid_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'routegrid_role', '');
$$;

create or replace function public.routegrid_is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.routegrid_account_type() = 'admin';
$$;

create or replace function public.routegrid_can_manage_accounts()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.routegrid_account_type() = 'admin'
    and public.routegrid_role() in ('owner', 'admin');
$$;

create or replace function public.routegrid_can_dispatch()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.routegrid_account_type() = 'admin'
    and public.routegrid_role() in ('owner', 'admin', 'dispatcher');
$$;

drop policy if exists routegrid_admin_accounts_select on public.admin_accounts;
create policy routegrid_admin_accounts_select
on public.admin_accounts
for select
to authenticated
using (public.routegrid_is_admin());

drop policy if exists routegrid_admin_accounts_write on public.admin_accounts;
create policy routegrid_admin_accounts_write
on public.admin_accounts
for all
to authenticated
using (public.routegrid_can_manage_accounts())
with check (public.routegrid_can_manage_accounts());

drop policy if exists routegrid_client_accounts_select on public.client_accounts;
create policy routegrid_client_accounts_select
on public.client_accounts
for select
to authenticated
using (
  public.routegrid_is_admin()
  or (
    public.routegrid_account_type() = 'client'
    and id = auth.uid()
  )
);

drop policy if exists routegrid_client_accounts_write on public.client_accounts;
create policy routegrid_client_accounts_write
on public.client_accounts
for all
to authenticated
using (public.routegrid_can_manage_accounts())
with check (public.routegrid_can_manage_accounts());

drop policy if exists routegrid_business_inquiries_read on public.business_inquiries;
create policy routegrid_business_inquiries_read
on public.business_inquiries
for select
to authenticated
using (public.routegrid_is_admin());

drop policy if exists routegrid_business_inquiries_write on public.business_inquiries;
create policy routegrid_business_inquiries_write
on public.business_inquiries
for all
to authenticated
using (public.routegrid_can_dispatch())
with check (public.routegrid_can_dispatch());

drop policy if exists routegrid_drivers_select on public.drivers;
create policy routegrid_drivers_select
on public.drivers
for select
to authenticated
using (
  public.routegrid_is_admin()
  or (
    public.routegrid_account_type() = 'driver'
    and id = auth.uid()
  )
);

drop policy if exists routegrid_drivers_write on public.drivers;
create policy routegrid_drivers_write
on public.drivers
for all
to authenticated
using (public.routegrid_can_dispatch())
with check (public.routegrid_can_dispatch());

drop policy if exists routegrid_delivery_orders_select on public.delivery_orders;
create policy routegrid_delivery_orders_select
on public.delivery_orders
for select
to authenticated
using (
  public.routegrid_is_admin()
  or (
    public.routegrid_account_type() = 'client'
    and client_account_id = auth.uid()
  )
  or (
    public.routegrid_account_type() = 'driver'
    and driver_id = auth.uid()
  )
);

drop policy if exists routegrid_delivery_orders_write on public.delivery_orders;
create policy routegrid_delivery_orders_write
on public.delivery_orders
for all
to authenticated
using (public.routegrid_can_dispatch())
with check (public.routegrid_can_dispatch());

drop policy if exists routegrid_inventory_items_read on public.inventory_items;
create policy routegrid_inventory_items_read
on public.inventory_items
for select
to authenticated
using (public.routegrid_is_admin());

drop policy if exists routegrid_inventory_items_write on public.inventory_items;
create policy routegrid_inventory_items_write
on public.inventory_items
for all
to authenticated
using (public.routegrid_can_dispatch())
with check (public.routegrid_can_dispatch());

drop policy if exists routegrid_activity_log_read on public.activity_log;
create policy routegrid_activity_log_read
on public.activity_log
for select
to authenticated
using (public.routegrid_is_admin());

drop policy if exists routegrid_audit_events_read on public.audit_events;
create policy routegrid_audit_events_read
on public.audit_events
for select
to authenticated
using (public.routegrid_is_admin());
