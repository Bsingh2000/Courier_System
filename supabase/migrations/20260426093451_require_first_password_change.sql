alter table public.admin_accounts
add column if not exists must_change_password boolean not null default false;

alter table public.client_accounts
add column if not exists must_change_password boolean not null default false;

alter table public.drivers
add column if not exists must_change_password boolean not null default false;

update public.admin_accounts
set must_change_password = false
where must_change_password is null;

update public.client_accounts
set must_change_password = false
where must_change_password is null;

update public.drivers
set must_change_password = false
where must_change_password is null;
