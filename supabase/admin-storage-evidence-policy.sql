-- Goshen Fleet Management
-- Allow authenticated administrators to view private journey/fuel evidence uploaded by any driver.
-- Drivers retain access only to objects in their own auth.uid() folder through the existing policy.
-- Apply this script in Supabase SQL Editor for project cpfippqprzmjdqzwnwyg.

alter table storage.objects enable row level security;

drop policy if exists "Admins can view fleet evidence" on storage.objects;

create policy "Admins can view fleet evidence"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fuel-evidence'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);
