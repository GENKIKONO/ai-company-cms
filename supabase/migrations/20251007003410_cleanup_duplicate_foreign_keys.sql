-- ����Jd�Yno posts_org_fk	
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_organization_id_fkey;

-- PostgRESTx���ލ����
SELECT pg_notify('pgrst','reload schema');