-- アカウント制裁フロー実装
-- 違反検知後の状態遷移: active → warned → suspended → frozen → deleted

BEGIN;

-- 1. profiles テーブルに account_status カラム追加
ALTER TABLE profiles 
ADD COLUMN account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'warned', 'suspended', 'frozen', 'deleted'));

-- 既存の全行を 'active' に設定
UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL;

-- NOT NULL制約を追加
ALTER TABLE profiles ALTER COLUMN account_status SET NOT NULL;

-- インデックス作成
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- 2. violations テーブル作成
CREATE TABLE violations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    reason text NOT NULL,
    evidence jsonb,
    detected_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_violations_user_id ON violations(user_id);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_violations_detected_at ON violations(detected_at);

-- 3. enforcement_actions テーブル作成
CREATE TABLE enforcement_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action text NOT NULL CHECK (action IN ('warn', 'suspend', 'freeze', 'reinstate', 'delete')),
    message text,
    issued_by uuid REFERENCES profiles(id),
    effective_from timestamptz NOT NULL DEFAULT now(),
    deadline timestamptz,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_enforcement_actions_user_id ON enforcement_actions(user_id);
CREATE INDEX idx_enforcement_actions_action ON enforcement_actions(action);
CREATE INDEX idx_enforcement_actions_deadline ON enforcement_actions(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_enforcement_actions_processed_at ON enforcement_actions(processed_at);

-- 4. 監査テーブル（簡易版）
CREATE TABLE IF NOT EXISTS enforcement_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    user_id uuid,
    performed_at timestamptz NOT NULL DEFAULT now()
);

-- 5. violations テーブルの監査トリガー
CREATE OR REPLACE FUNCTION audit_violations()
RETURNS trigger AS $$
BEGIN
    INSERT INTO enforcement_audit (table_name, operation, new_data, user_id)
    VALUES ('violations', TG_OP, row_to_json(NEW)::jsonb, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_violations_insert
    AFTER INSERT ON violations
    FOR EACH ROW EXECUTE FUNCTION audit_violations();

-- 6. enforcement_actions テーブルの監査トリガー
CREATE OR REPLACE FUNCTION audit_enforcement_actions()
RETURNS trigger AS $$
BEGIN
    INSERT INTO enforcement_audit (table_name, operation, old_data, new_data, user_id)
    VALUES ('enforcement_actions', TG_OP, 
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
            COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_enforcement_actions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON enforcement_actions
    FOR EACH ROW EXECUTE FUNCTION audit_enforcement_actions();

-- 7. 自動期限処理関数
CREATE OR REPLACE FUNCTION process_enforcement_deadlines()
RETURNS integer AS $$
DECLARE
    processed_count integer := 0;
    action_record record;
BEGIN
    -- 期限が来た未処理のアクションを処理
    FOR action_record IN 
        SELECT id, user_id, action, deadline 
        FROM enforcement_actions 
        WHERE deadline IS NOT NULL 
        AND deadline < now() 
        AND processed_at IS NULL
        ORDER BY deadline ASC
    LOOP
        -- アクションタイプに応じて profiles.account_status を更新
        CASE action_record.action
            WHEN 'suspend' THEN
                -- 一時停止期限が来たら凍結に移行
                UPDATE profiles SET account_status = 'frozen' 
                WHERE id = action_record.user_id;
            WHEN 'freeze' THEN
                -- 凍結期限が来たら削除に移行
                UPDATE profiles SET account_status = 'deleted' 
                WHERE id = action_record.user_id;
            WHEN 'warn' THEN
                -- 警告期限が来たら通常状態に戻す
                UPDATE profiles SET account_status = 'active' 
                WHERE id = action_record.user_id;
            ELSE
                -- その他のアクションは何もしない
                NULL;
        END CASE;
        
        -- 処理済みフラグを設定
        UPDATE enforcement_actions 
        SET processed_at = now() 
        WHERE id = action_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS ポリシー設定
-- violations テーブル（管理者・service_role のみアクセス可能）
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "violations_admin_access" ON violations
    FOR ALL USING (
        -- service_role は全アクセス
        auth.role() = 'service_role'
        OR
        -- 管理者のみアクセス可能（is_admin 関数があると仮定）
        (auth.role() = 'authenticated' AND EXISTS(
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        ))
    );

-- enforcement_actions テーブル（管理者・service_role のみアクセス可能）
ALTER TABLE enforcement_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enforcement_actions_admin_access" ON enforcement_actions
    FOR ALL USING (
        -- service_role は全アクセス
        auth.role() = 'service_role'
        OR
        -- 管理者のみアクセス可能
        (auth.role() = 'authenticated' AND EXISTS(
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        ))
    );

-- enforcement_audit テーブル（管理者・service_role のみ読取可能）
ALTER TABLE enforcement_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enforcement_audit_admin_read" ON enforcement_audit
    FOR SELECT USING (
        -- service_role は全アクセス
        auth.role() = 'service_role'
        OR
        -- 管理者のみ読取可能
        (auth.role() = 'authenticated' AND EXISTS(
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        ))
    );

-- 9. 既存のprofiles RLSポリシーを確認・調整（account_statusを考慮）
-- 注意: 既存のポリシーが壊れないよう、新しいポリシーを追加するのではなく
-- 将来的にaccount_status = 'deleted'のユーザーを除外する方向で検討

-- profiles テーブルへのコメント追加
COMMENT ON COLUMN profiles.account_status IS 'アカウントの制裁状態: active(通常), warned(警告), suspended(一時停止), frozen(凍結), deleted(削除)';
COMMENT ON TABLE violations IS '違反記録テーブル - 管理者・システムのみアクセス可能';
COMMENT ON TABLE enforcement_actions IS '制裁アクション履歴テーブル - 管理者・システムのみアクセス可能';
COMMENT ON TABLE enforcement_audit IS '制裁システム監査ログテーブル';

COMMIT;

/*
### pg_cron での定期実行例：
SELECT cron.schedule('enforcement_deadlines', '*/5 * * * *', 'SELECT process_enforcement_deadlines();');

### Edge cron / API からの実行用：
API エンドポイント /api/enforcement/jobs/process で process_enforcement_deadlines() を呼び出し

### 使用例：
-- 違反登録
INSERT INTO violations (user_id, severity, reason, evidence) 
VALUES ('user-uuid', 'high', 'スパム投稿', '{"post_id": "123", "content": "..."}');

-- 警告発行
INSERT INTO enforcement_actions (user_id, action, message, issued_by) 
VALUES ('user-uuid', 'warn', '利用規約違反による警告', 'admin-uuid');
UPDATE profiles SET account_status = 'warned' WHERE id = 'user-uuid';

-- 一時停止（期限付き）
INSERT INTO enforcement_actions (user_id, action, message, issued_by, deadline) 
VALUES ('user-uuid', 'suspend', '3日間の一時停止', 'admin-uuid', now() + interval '3 days');
UPDATE profiles SET account_status = 'suspended' WHERE id = 'user-uuid';
*/