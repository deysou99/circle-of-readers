-- Roles ---------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin','moderator','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- OTP / SMS delivery telemetry -----------------------------------------
create table if not exists public.otp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('sent','sms_failed','fallback_in_app','verify_failed','verify_blocked','verified','phone_changed')),
  delivery_mode text,
  phone_last4 text,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists otp_events_user_created_idx on public.otp_events (user_id, created_at desc);
create index if not exists otp_events_type_created_idx on public.otp_events (event_type, created_at desc);

grant select on public.otp_events to authenticated;
grant all on public.otp_events to service_role;
alter table public.otp_events enable row level security;

drop policy if exists "Readers can view their own OTP events" on public.otp_events;
create policy "Readers can view their own OTP events"
on public.otp_events for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can view all OTP events" on public.otp_events;
create policy "Admins can view all OTP events"
on public.otp_events for select to authenticated
using (public.has_role(auth.uid(), 'admin'));