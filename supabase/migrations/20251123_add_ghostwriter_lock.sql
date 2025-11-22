-- Ghostwriter AI生成制御機能追加
-- 企業情報のAI自動生成・上書き防止システム

-- AI生成ステータス管理用のenum型を定義
CREATE TYPE organization_data_status AS ENUM ('ai_generated', 'user_verified');

-- organizationsテーブルにdata_statusカラムを追加
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS data_status organization_data_status DEFAULT 'ai_generated';

-- 既存のデータはすべて 'user_verified' (上書き禁止) とみなす安全策
-- これによりAIが既存の手動入力データを誤って上書きすることを防ぐ
UPDATE organizations 
SET data_status = 'user_verified' 
WHERE data_status IS NULL;

-- data_statusカラムにインデックス追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_organizations_data_status 
ON organizations (data_status);

-- data_status変更履歴用のコメント
COMMENT ON COLUMN organizations.data_status IS 'AI生成データの制御フラグ: ai_generated=AI生成可能, user_verified=ユーザー確認済み(上書き禁止)';