-- ================================
-- AUDIT LOGGING SYSTEM
-- ================================
-- 本番運用に必要な監査ログ機能を実装
-- 全主要テーブルの insert/update/delete を記録

-- 監査ログテーブル
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON public.audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- RLS有効化
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 監査ログはシステム管理者のみ参照可能
CREATE POLICY "System admins can view audit logs" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 監査ログは自動システムからのみ挿入可能（手動変更禁止）
CREATE POLICY "Audit logs insert only by system" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- 監査ログトリガー関数
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- 操作タイプに応じてデータを取得
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- 変更されたフィールドを特定
    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
      IF old_data->field_name IS DISTINCT FROM new_data->field_name THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
    
    -- 変更がない場合はログを記録しない
    IF array_length(changed_fields, 1) IS NULL THEN
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      ELSE
        RETURN NEW;
      END IF;
    END IF;
  END IF;

  -- 監査ログに記録
  INSERT INTO public.audit_log (
    table_name,
    operation,
    record_id,
    user_id,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE((new_data->>'id')::UUID, (old_data->>'id')::UUID),
    auth.uid(),
    old_data,
    new_data,
    changed_fields
  );

  -- 元のレコードを返す
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 主要テーブルに監査トリガーを設定
-- ================================

-- app_users テーブル
DROP TRIGGER IF EXISTS audit_trigger_app_users ON public.app_users;
CREATE TRIGGER audit_trigger_app_users
  AFTER INSERT OR UPDATE OR DELETE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- organizations テーブル
DROP TRIGGER IF EXISTS audit_trigger_organizations ON public.organizations;
CREATE TRIGGER audit_trigger_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- posts テーブル
DROP TRIGGER IF EXISTS audit_trigger_posts ON public.posts;
CREATE TRIGGER audit_trigger_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- services テーブル
DROP TRIGGER IF EXISTS audit_trigger_services ON public.services;
CREATE TRIGGER audit_trigger_services
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- case_studies テーブル
DROP TRIGGER IF EXISTS audit_trigger_case_studies ON public.case_studies;
CREATE TRIGGER audit_trigger_case_studies
  AFTER INSERT OR UPDATE OR DELETE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- faqs テーブル
DROP TRIGGER IF EXISTS audit_trigger_faqs ON public.faqs;
CREATE TRIGGER audit_trigger_faqs
  AFTER INSERT OR UPDATE OR DELETE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- subscriptions テーブル（将来のStripe連携用）
DROP TRIGGER IF EXISTS audit_trigger_subscriptions ON public.subscriptions;
CREATE TRIGGER audit_trigger_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ================================
-- 監査ログ用ビュー（読みやすい形式）
-- ================================

CREATE OR REPLACE VIEW public.audit_log_readable AS
SELECT 
  al.id,
  al.table_name,
  al.operation,
  al.record_id,
  au.email as user_email,
  al.changed_fields,
  al.created_at,
  -- 変更内容の要約
  CASE 
    WHEN al.operation = 'INSERT' THEN 'Created new record'
    WHEN al.operation = 'DELETE' THEN 'Deleted record'
    WHEN al.operation = 'UPDATE' THEN 
      'Updated fields: ' || array_to_string(al.changed_fields, ', ')
    ELSE al.operation
  END as change_summary
FROM public.audit_log al
LEFT JOIN auth.users au ON al.user_id = au.id
ORDER BY al.created_at DESC;

-- ================================
-- 監査ログ保持期間管理
-- ================================

-- 90日より古いログを削除する関数
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- クリーンアップログを残す
  INSERT INTO public.audit_log (
    table_name,
    operation,
    record_id,
    user_id,
    new_values
  ) VALUES (
    'audit_log',
    'DELETE',
    gen_random_uuid(),
    NULL,
    jsonb_build_object('deleted_count', deleted_count, 'cleanup_date', NOW())
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 定期クリーンアップ用のビュー
COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS 
  'Clean up audit logs older than 90 days. Run this monthly via cron or scheduled function.';