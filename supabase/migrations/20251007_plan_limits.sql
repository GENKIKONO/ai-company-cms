/**
 * プラン制限RLS実装
 * 作成日: 2025/10/7
 * 
 * 注意: 本SQLは設計・検討用のコメントです。
 * 本番適用前に運用チームの合意を得てから実行してください。
 */

-- TODO: プラン制限をRLSレベルで実装する場合の設計案
-- 
-- 1. サービス作成時のプラン制限チェック関数
-- CREATE OR REPLACE FUNCTION check_service_limit()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   org_plan TEXT;
--   current_count INTEGER;
--   plan_limit INTEGER;
-- BEGIN
--   -- 組織のプランを取得
--   SELECT plan INTO org_plan FROM organizations WHERE id = NEW.organization_id;
--   
--   -- 現在のサービス数を取得
--   SELECT COUNT(*) INTO current_count FROM services WHERE organization_id = NEW.organization_id;
--   
--   -- プラン制限を確認
--   plan_limit := CASE org_plan
--     WHEN 'free' THEN 1
--     WHEN 'standard' THEN 50
--     ELSE 999999 -- enterprise: 無制限
--   END;
--   
--   -- 制限チェック
--   IF current_count >= plan_limit THEN
--     RAISE EXCEPTION 'サービス登録数が上限に達しています。プラン: %、上限: %', org_plan, plan_limit;
--   END IF;
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- 2. トリガー設定
-- CREATE TRIGGER services_plan_limit_trigger
--   BEFORE INSERT ON services
--   FOR EACH ROW
--   EXECUTE FUNCTION check_service_limit();

-- 現在の実装状況
-- - APIレイヤーでの制限チェック: ✅ 実装済み (src/app/api/my/services/route.ts)
-- - プラン設定の一元管理: ✅ 実装済み (src/config/plans.ts)
-- - UI無効化・ツールチップ: ⏸️ 未実装（次回対応）
-- - RLSレベルの制限: ⏸️ 設計検討中（本ファイル）

-- 運用方針：
-- Stage 1: APIレイヤーによる制限実装（完了）
-- Stage 2: フロントエンド制限表示（次回）
-- Stage 3: RLS二重チェック（運用合意後）

-- メモ:
-- 現在は Stage 1 が完了しており、実用十分です。
-- Stage 3 のRLS実装は、本番環境での動作影響を慎重に検討してから適用すること。