alter table public.admin_accounts
alter column password_hash drop not null;

alter table public.client_accounts
alter column password_hash drop not null;

alter table public.drivers
alter column password_hash drop not null;
