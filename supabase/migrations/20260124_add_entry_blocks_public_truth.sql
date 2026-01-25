-- ============================================================
-- Entry Blocks Public Truth Migration
-- SoT: Supabase Production DB (2026-01-24)
--
-- Purpose:
-- - Fix entry_blocks / entry_block_translations / v_entry_blocks_public
-- - Non-destructive: NO DROP / NO RENAME
-- - Safe for both existing and new environments
-- ============================================================

-- ============================================================
-- 0) Dependency Check (fail fast if missing)
-- ============================================================
DO $$
BEGIN
  -- Check TYPE: cms_content_type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_content_type') THEN
    RAISE EXCEPTION 'Missing dependency: TYPE cms_content_type. This migration requires pre-existing enum types.';
  END IF;

  -- Check TYPE: cms_content_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_content_status') THEN
    RAISE EXCEPTION 'Missing dependency: TYPE cms_content_status. This migration requires pre-existing enum types.';
  END IF;

  -- Check FUNCTION: util.is_public_content
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'util' AND p.proname = 'is_public_content'
  ) THEN
    RAISE EXCEPTION 'Missing dependency: FUNCTION util.is_public_content. This migration requires the util schema functions.';
  END IF;

  -- Check FUNCTION: is_entity_frozen
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_entity_frozen'
  ) THEN
    RAISE EXCEPTION 'Missing dependency: FUNCTION is_entity_frozen. This migration requires enforcement functions.';
  END IF;

  -- Check TABLE: organizations
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    RAISE EXCEPTION 'Missing dependency: TABLE organizations.';
  END IF;

  -- Check TABLE: organization_members
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
    RAISE EXCEPTION 'Missing dependency: TABLE organization_members.';
  END IF;

  RAISE NOTICE 'All dependencies verified.';
END $$;

-- ============================================================
-- 1) CREATE TABLE: entry_blocks
-- SoT: Supabase production DB columns (2026-01-24)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entry_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  entry_type public.cms_content_type NOT NULL,
  entry_id uuid NOT NULL,
  block_type text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  parent_block_id uuid NULL,
  status public.cms_content_status NULL DEFAULT 'draft'::public.cms_content_status,
  is_published boolean NULL DEFAULT false,
  published_at timestamptz NULL,
  deleted_at timestamptz NULL,
  is_ai_generated boolean NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  meta jsonb NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT entry_blocks_pkey PRIMARY KEY (id)
);

-- Add sort_order if missing (for existing environments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entry_blocks' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.entry_blocks ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 2) CREATE TABLE: entry_block_translations
-- SoT: Supabase production DB columns (2026-01-24)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entry_block_translations (
  block_id uuid NOT NULL,
  lang text NOT NULL,
  title text NULL,
  content text NULL,
  summary text NULL,
  is_primary boolean NULL DEFAULT false,
  content_hash text NULL,
  meta jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  CONSTRAINT entry_block_translations_pkey PRIMARY KEY (block_id, lang)
);

-- ============================================================
-- 3) CREATE INDEXES
-- SoT: pg_indexes from production (2026-01-24)
-- ============================================================

-- entry_blocks indexes
CREATE UNIQUE INDEX IF NOT EXISTS entry_blocks_unique_hier_sort
  ON public.entry_blocks (entry_type, entry_id, parent_block_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_entry_blocks_org
  ON public.entry_blocks (organization_id);

CREATE INDEX IF NOT EXISTS idx_entry_blocks_entry
  ON public.entry_blocks (entry_type, entry_id);

CREATE INDEX IF NOT EXISTS idx_entry_blocks_parent
  ON public.entry_blocks (parent_block_id);

CREATE INDEX IF NOT EXISTS idx_entry_blocks_order
  ON public.entry_blocks (entry_type, entry_id, order_index);

CREATE INDEX IF NOT EXISTS idx_entry_blocks_pub
  ON public.entry_blocks (is_published, published_at, deleted_at);

-- entry_block_translations has only pkey (already created above)

-- ============================================================
-- 4) ENABLE RLS
-- ============================================================
ALTER TABLE public.entry_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_block_translations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5) RLS POLICIES: entry_blocks
-- SoT: pg_policies from production (2026-01-24)
-- Non-destructive: check existence before create
-- ============================================================

-- 5-1) entry_blocks_anon_public_read_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_blocks_anon_public_read_v2' AND tablename = 'entry_blocks'
  ) THEN
    CREATE POLICY entry_blocks_anon_public_read_v2 ON public.entry_blocks
      FOR SELECT TO anon
      USING (
        util.is_public_content(is_published, published_at, deleted_at)
        AND deleted_at IS NULL
        AND NOT is_entity_frozen('entry_blocks'::text, id)
        AND NOT is_entity_frozen(entry_type::text, entry_id)
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = entry_blocks.organization_id
            AND o.is_published = true
            AND o.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- 5-2) entry_blocks_auth_read_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_blocks_auth_read_v2' AND tablename = 'entry_blocks'
  ) THEN
    CREATE POLICY entry_blocks_auth_read_v2 ON public.entry_blocks
      FOR SELECT TO authenticated
      USING (
        deleted_at IS NULL
        AND NOT is_entity_frozen('entry_blocks'::text, id)
        AND NOT is_entity_frozen(entry_type::text, entry_id)
        AND (
          util.is_public_content(is_published, published_at, deleted_at)
          OR created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.user_id = auth.uid()
              AND m.organization_id = entry_blocks.organization_id
          )
        )
      );
  END IF;
END $$;

-- 5-3) entry_blocks_insert_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_blocks_insert_member_v2' AND tablename = 'entry_blocks'
  ) THEN
    CREATE POLICY entry_blocks_insert_member_v2 ON public.entry_blocks
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members m
          WHERE m.user_id = auth.uid()
            AND m.organization_id = entry_blocks.organization_id
        )
      );
  END IF;
END $$;

-- 5-4) entry_blocks_update_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_blocks_update_member_v2' AND tablename = 'entry_blocks'
  ) THEN
    CREATE POLICY entry_blocks_update_member_v2 ON public.entry_blocks
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM organization_members m
          WHERE m.user_id = auth.uid()
            AND m.organization_id = entry_blocks.organization_id
        )
        AND NOT is_entity_frozen('entry_blocks'::text, id)
        AND NOT is_entity_frozen(entry_type::text, entry_id)
      )
      WITH CHECK (
        organization_id = organization_id
        AND EXISTS (
          SELECT 1 FROM organization_members m
          WHERE m.user_id = auth.uid()
            AND m.organization_id = entry_blocks.organization_id
        )
      );
  END IF;
END $$;

-- 5-5) entry_blocks_delete_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_blocks_delete_member_v2' AND tablename = 'entry_blocks'
  ) THEN
    CREATE POLICY entry_blocks_delete_member_v2 ON public.entry_blocks
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM organization_members m
          WHERE m.user_id = auth.uid()
            AND m.organization_id = entry_blocks.organization_id
        )
        AND NOT is_entity_frozen('entry_blocks'::text, id)
        AND NOT is_entity_frozen(entry_type::text, entry_id)
      );
  END IF;
END $$;

-- ============================================================
-- 6) RLS POLICIES: entry_block_translations
-- SoT: pg_policies from production (2026-01-24)
-- ============================================================

-- 6-1) entry_block_tx_anon_public_read_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_block_tx_anon_public_read_v2' AND tablename = 'entry_block_translations'
  ) THEN
    CREATE POLICY entry_block_tx_anon_public_read_v2 ON public.entry_block_translations
      FOR SELECT TO anon
      USING (
        EXISTS (
          SELECT 1
          FROM entry_blocks b
          JOIN organizations o ON o.id = b.organization_id
          WHERE b.id = entry_block_translations.block_id
            AND util.is_public_content(b.is_published, b.published_at, b.deleted_at)
            AND b.deleted_at IS NULL
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
            AND o.is_published = true
            AND o.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- 6-2) entry_block_tx_auth_read_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_block_tx_auth_read_v2' AND tablename = 'entry_block_translations'
  ) THEN
    CREATE POLICY entry_block_tx_auth_read_v2 ON public.entry_block_translations
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM entry_blocks b
          WHERE b.id = entry_block_translations.block_id
            AND b.deleted_at IS NULL
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
            AND (
              util.is_public_content(b.is_published, b.published_at, b.deleted_at)
              OR b.created_by = auth.uid()
              OR EXISTS (
                SELECT 1 FROM organization_members m
                WHERE m.user_id = auth.uid()
                  AND m.organization_id = b.organization_id
              )
            )
        )
      );
  END IF;
END $$;

-- 6-3) entry_block_tx_insert_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_block_tx_insert_member_v2' AND tablename = 'entry_block_translations'
  ) THEN
    CREATE POLICY entry_block_tx_insert_member_v2 ON public.entry_block_translations
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM entry_blocks b
          JOIN organization_members m ON m.organization_id = b.organization_id AND m.user_id = auth.uid()
          WHERE b.id = entry_block_translations.block_id
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
        )
      );
  END IF;
END $$;

-- 6-4) entry_block_tx_update_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_block_tx_update_member_v2' AND tablename = 'entry_block_translations'
  ) THEN
    CREATE POLICY entry_block_tx_update_member_v2 ON public.entry_block_translations
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM entry_blocks b
          JOIN organization_members m ON m.organization_id = b.organization_id AND m.user_id = auth.uid()
          WHERE b.id = entry_block_translations.block_id
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM entry_blocks b
          JOIN organization_members m ON m.organization_id = b.organization_id AND m.user_id = auth.uid()
          WHERE b.id = entry_block_translations.block_id
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
        )
      );
  END IF;
END $$;

-- 6-5) entry_block_tx_delete_member_v2
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'entry_block_tx_delete_member_v2' AND tablename = 'entry_block_translations'
  ) THEN
    CREATE POLICY entry_block_tx_delete_member_v2 ON public.entry_block_translations
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM entry_blocks b
          JOIN organization_members m ON m.organization_id = b.organization_id AND m.user_id = auth.uid()
          WHERE b.id = entry_block_translations.block_id
            AND NOT is_entity_frozen('entry_blocks'::text, b.id)
            AND NOT is_entity_frozen(b.entry_type::text, b.entry_id)
        )
      );
  END IF;
END $$;

-- ============================================================
-- 7) VIEW: v_entry_blocks_public
-- SoT: pg_get_viewdef from production (2026-01-24)
-- Public Truth: is_published=true, deleted_at IS NULL, org is_published=true
-- ============================================================
CREATE OR REPLACE VIEW public.v_entry_blocks_public AS
SELECT
  b.id,
  b.organization_id,
  b.entry_type,
  b.entry_id,
  b.parent_block_id,
  b.block_type,
  b.is_ai_generated,
  b.published_at,
  t.lang,
  t.title,
  t.summary,
  t.content,
  t.meta,
  b.sort_order
FROM public.entry_blocks b
JOIN public.organizations o ON o.id = b.organization_id
LEFT JOIN public.entry_block_translations t ON t.block_id = b.id
WHERE o.is_published = true
  AND o.deleted_at IS NULL
  AND b.is_published = true
  AND b.deleted_at IS NULL;

-- ============================================================
-- 8) GRANT on VIEW
-- SoT: Already granted in production (permission denied fix)
-- ============================================================
GRANT SELECT ON public.v_entry_blocks_public TO anon;
GRANT SELECT ON public.v_entry_blocks_public TO authenticated;

-- ============================================================
-- 9) FUNCTION & TRIGGER: sync order_index from sort_order
-- SoT: Production behavior verified (sort_order=6 -> order_index=6)
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_entry_blocks_order_index()
RETURNS TRIGGER AS $$
BEGIN
  -- SoT: sort_order is the source of truth
  -- order_index follows sort_order for backward compatibility
  NEW.order_index := NEW.sort_order;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_entry_blocks_order_index'
  ) THEN
    CREATE TRIGGER trg_sync_entry_blocks_order_index
      BEFORE INSERT OR UPDATE ON public.entry_blocks
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_entry_blocks_order_index();
  END IF;
END $$;

-- ============================================================
-- Done
-- ============================================================
COMMENT ON TABLE public.entry_blocks IS 'Entry content blocks. SoT: sort_order (order_index synced via trigger)';
COMMENT ON TABLE public.entry_block_translations IS 'Translations for entry blocks. PK: (block_id, lang)';
COMMENT ON VIEW public.v_entry_blocks_public IS 'Public Truth: published entry blocks with translations. Granted to anon/authenticated.';
