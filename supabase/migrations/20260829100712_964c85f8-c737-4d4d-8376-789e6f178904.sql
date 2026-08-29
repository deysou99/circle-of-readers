create schema if not exists private;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

revoke all on function private.has_role(uuid, public.app_role) from public;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy if exists "Admins can view all OTP events" on public.otp_events;
create policy "Admins can view all OTP events"
on public.otp_events for select to authenticated
using (private.has_role(auth.uid(), 'admin'));

drop function if exists public.has_role(uuid, public.app_role);