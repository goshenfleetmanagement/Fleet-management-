-- Goshen Fleet Management: live driver location sharing
-- Run once in the Supabase SQL Editor for project cpfippqprzmjdqzwnwyg.
-- Drivers can write/read only their own location. Admins can read all locations.
-- The app shares location only while a journey is in progress.

create table if not exists public.driver_live_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  journey_id text not null,
  vehicle_id text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  speed_mps double precision,
  heading_deg double precision,
  captured_at timestamptz not null default now(),
  is_active boolean not null default true
);

alter table public.driver_live_locations enable row level security;

drop policy if exists "Drivers can read own live location" on public.driver_live_locations;
create policy "Drivers can read own live location"
on public.driver_live_locations for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Drivers can insert own live location" on public.driver_live_locations;
create policy "Drivers can insert own live location"
on public.driver_live_locations for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Drivers can update own live location" on public.driver_live_locations;
create policy "Drivers can update own live location"
on public.driver_live_locations for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can view all driver live locations" on public.driver_live_locations;
create policy "Admins can view all driver live locations"
on public.driver_live_locations for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

grant select, insert, update on public.driver_live_locations to authenticated;
