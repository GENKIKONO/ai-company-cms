-- 修正: 要件定義とのスキーマ整合性確保
-- 作成日: 2025-10-04
-- 説明: 企業作成機能の不具合修正 - 要件定義で定義されているが不足しているフィールドを追加

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 要件定義で定義されているが実装されていないフィールドを追加
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS establishment_date DATE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 2. APIコードで参照されるが存在しないフィールドを追加（将来的な互換性のため）
-- 注意: これらは現在のAPIでは使用しないが、将来の拡張のために追加
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 3. フィールド名の正規化（address系）
-- 要件定義では address_postal_code, address_street だが、実装では postal_code, street_address も使用される場合がある
-- 既存のカラムをベースとして統一

-- 4. インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_organizations_is_published 
ON public.organizations(is_published);

CREATE INDEX IF NOT EXISTS idx_organizations_establishment_date 
ON public.organizations(establishment_date);

CREATE INDEX IF NOT EXISTS idx_organizations_user_id 
ON public.organizations(user_id);

-- 5. RLSポリシーの確認（is_published フィールド用）
-- 公開企業のみ表示するためのポリシー
DROP POLICY IF EXISTS "public_published_organizations" ON public.organizations;
CREATE POLICY "public_published_organizations" ON public.organizations
  FOR SELECT USING (is_published = true);

-- 6. データ整合性確保のためのコメント追加
COMMENT ON COLUMN public.organizations.establishment_date IS '設立年月日 - 要件定義準拠';
COMMENT ON COLUMN public.organizations.is_published IS '公開フラグ - 要件定義準拠';
COMMENT ON COLUMN public.organizations.user_id IS '作成ユーザーID - 将来使用予定';
COMMENT ON COLUMN public.organizations.contact_email IS '連絡先メール - 将来使用予定';

-- 7. 既存の founded カラムと establishment_date カラムの関係性を明確化
COMMENT ON COLUMN public.organizations.founded IS '設立年月日 - 初期実装（establishment_dateと同じ用途）';