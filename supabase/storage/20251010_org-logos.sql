-- Create storage bucket for organization logos
-- Run this once in Supabase SQL Editor

-- Create the bucket
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Allow public read access
create policy "org-logos public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'org-logos');

-- Allow authenticated users to upload
create policy "org-logos authenticated write"
on storage.objects for insert to authenticated
with check (bucket_id = 'org-logos');

-- Allow authenticated users to update their uploads
create policy "org-logos authenticated update"
on storage.objects for update to authenticated
using (bucket_id = 'org-logos')
with check (bucket_id = 'org-logos');

-- Allow authenticated users to delete their uploads
create policy "org-logos authenticated delete"
on storage.objects for delete to authenticated
using (bucket_id = 'org-logos');