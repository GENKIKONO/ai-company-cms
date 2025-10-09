-- バケット（存在しなければ作成）
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- 読み取り（誰でも）
drop policy if exists "logos public select" on storage.objects;
create policy "logos public select"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'org-logos');

-- 企業オーナーのみ書き込み（/orgId/logo.* パスを強制）
drop policy if exists "logos owner upsert" on storage.objects;
create policy "logos owner upsert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'org-logos'
  and (storage.foldername(name))[1] in (  -- 先頭ディレクトリ=orgId
    select id::text from organizations where created_by = auth.uid()
  )
);

drop policy if exists "logos owner update" on storage.objects;
create policy "logos owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'org-logos'
  and (storage.foldername(name))[1] in (
    select id::text from organizations where created_by = auth.uid()
  )
)
with check (
  bucket_id = 'org-logos'
);

drop policy if exists "logos owner delete" on storage.objects;
create policy "logos owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'org-logos'
  and (storage.foldername(name))[1] in (
    select id::text from organizations where created_by = auth.uid()
  )
);