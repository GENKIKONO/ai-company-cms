# P1-2 Enum Migration Runbook

## 概要

このRunbookは、AIOHub本番環境でのテキスト列からenum列への安全な移行手順を提供します。
Breaking Change防止とFeature Flag統合により、段階的で可逆性のある移行を実現します。

## 🎯 移行対象

### Phase 1 候補（高優先度・Simple）
1. `ai_interview_sessions.status` → `interview_session_status`
2. `ai_interview_sessions.content_type` → `interview_content_type`  
3. `ai_interview_questions.content_type` → `question_content_type`
4. `user_profiles.onboarding_status` → `onboarding_status`

### Phase 2 候補（中優先度）
5. `ai_interview_questions.lang` → `supported_language`
6. `qa_categories.category_type` → `qa_category_type`

## 📋 前提条件

### システム要件
- [ ] Supabase Service Role Keyアクセス権
- [ ] Feature Flag機能の実装完了
- [ ] Contract Violations監視システム稼働
- [ ] 本番環境のフルバックアップ取得

### チーム体制
- [ ] DBA担当者のアサイン
- [ ] フロントエンド担当者のスタンバイ
- [ ] インシデント対応チームの待機
- [ ] 24時間監視体制の確立

### 事前準備
- [ ] 移行対象データの現在値調査完了
- [ ] 想定外データパターンの洗い出し
- [ ] Rollback手順の事前検証
- [ ] 監視アラート閾値の設定

## 🚀 実行手順

### Phase 1: データ検証とenum準備

#### 1.1 現在データの調査
```sql
-- ai_interview_sessions.status の値確認
SELECT status, COUNT(*) as count
FROM ai_interview_sessions 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- 想定外の値が存在しないことを確認
SELECT status, COUNT(*) as count
FROM ai_interview_sessions 
WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled', 'failed')
GROUP BY status;
-- 結果が0件であること
```

#### 1.2 Enum型作成
```sql
-- 本番実行前にStagingで動作確認済みであること
CREATE TYPE interview_session_status AS ENUM (
    'pending',
    'in_progress', 
    'completed',
    'cancelled',
    'failed'
);

-- 作成確認
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'interview_session_status'::regtype;
```

#### 1.3 Feature Flag初期設定
```sql
-- Feature Flagsテーブルに移行フラグを追加
INSERT INTO feature_flags (key, enabled, description, environment, created_at) VALUES
('use_enum_ai_interview_sessions_status', false, 'Use enum for ai_interview_sessions.status', 'production', NOW());
```

**✅ Phase 1 完了確認**
- [ ] enum型が正常作成された
- [ ] Feature Flagが設定された
- [ ] 現在データが完全にenum値にマッピング可能
- [ ] Contract Violations監視が正常動作

---

### Phase 2: Shadow Column追加

#### 2.1 新enum列追加
```sql
-- 本番影響なしでenum列を追加
ALTER TABLE ai_interview_sessions 
ADD COLUMN status_enum_temp interview_session_status;

-- 列追加確認
\d ai_interview_sessions
```

#### 2.2 既存データマイグレーション
```sql
-- 段階的データコピー（大量データの場合はバッチ処理）
BEGIN;

-- 最初の1000件で動作確認
UPDATE ai_interview_sessions 
SET status_enum_temp = status::interview_session_status 
WHERE status IS NOT NULL 
  AND status_enum_temp IS NULL
LIMIT 1000;

-- 確認
SELECT COUNT(*) FROM ai_interview_sessions 
WHERE status IS NOT NULL AND status_enum_temp IS NULL;

-- 問題なければ全件実行
UPDATE ai_interview_sessions 
SET status_enum_temp = status::interview_session_status 
WHERE status IS NOT NULL 
  AND status_enum_temp IS NULL;

COMMIT;
```

#### 2.3 NOT NULL制約適用
```sql
-- まずデフォルト値で埋める
UPDATE ai_interview_sessions 
SET status_enum_temp = 'pending' 
WHERE status_enum_temp IS NULL;

-- NOT NULL制約適用
ALTER TABLE ai_interview_sessions 
ALTER COLUMN status_enum_temp SET NOT NULL;
```

**✅ Phase 2 完了確認**
- [ ] 新enum列が正常追加された
- [ ] 全データが正確にコピーされた
- [ ] NOT NULL制約が適用された
- [ ] アプリケーションに影響がない

---

### Phase 3: アプリケーション対応とデュアル運用

#### 3.1 Next.js側の対応デプロイ
```typescript
// enum-migration-helpers.tsを使用した型安全な実装
import { InterviewSessionService } from '@/lib/utils/enum-migration-helpers'

const sessionService = new InterviewSessionService({ 
  userId: user.id,
  organizationId: org.id 
})

// 読み取り（Feature Flag自動判定）
const status = await sessionService.readStatus(rawSession.status)

// 書き込み（Feature Flag自動判定で両列更新）
const updateData = await sessionService.writeStatus('completed')
```

#### 3.2 同期トリガー設定
```sql
-- 双方向同期トリガー（一時的措置）
CREATE OR REPLACE FUNCTION sync_ai_interview_sessions_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Feature Flag確認
  IF (SELECT enabled FROM feature_flags WHERE key = 'use_enum_ai_interview_sessions_status') THEN
    NEW.status := NEW.status_enum_temp::text;
  ELSE
    NEW.status_enum_temp := NEW.status::interview_session_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_ai_interview_sessions_status_trigger
  BEFORE INSERT OR UPDATE ON ai_interview_sessions
  FOR EACH ROW EXECUTE FUNCTION sync_ai_interview_sessions_status();
```

#### 3.3 Development環境でのFeature Flag有効化
```sql
-- 段階的有効化開始
UPDATE feature_flags 
SET enabled = true 
WHERE key = 'use_enum_ai_interview_sessions_status' 
  AND environment = 'development';
```

**✅ Phase 3 完了確認**
- [ ] Next.js対応が正常デプロイされた
- [ ] Development環境でenum動作確認完了
- [ ] 同期トリガーが正常動作
- [ ] データ整合性に問題なし

---

### Phase 4: Staging検証と本番切り替え

#### 4.1 Staging環境での検証
```sql
-- Staging環境でFeature Flag有効化
UPDATE feature_flags 
SET enabled = true 
WHERE key = 'use_enum_ai_interview_sessions_status' 
  AND environment = 'staging';
```

**24時間監視項目**
- [ ] API レスポンス時間に劣化なし
- [ ] エラー率に変化なし  
- [ ] enum値の読み書きが正常動作
- [ ] Contract Violations発生なし

#### 4.2 本番環境切り替え
```sql
-- 本番Feature Flag有効化
UPDATE feature_flags 
SET enabled = true 
WHERE key = 'use_enum_ai_interview_sessions_status' 
  AND environment = 'production';
```

#### 4.3 本番監視（48時間）
```sql
-- データ整合性チェッククエリ
SELECT COUNT(*) as inconsistent_records
FROM ai_interview_sessions 
WHERE status::interview_session_status != status_enum_temp;
-- 結果は常に0であること

-- パフォーマンスチェック
EXPLAIN ANALYZE 
SELECT * FROM ai_interview_sessions 
WHERE status_enum_temp = 'pending';
```

**✅ Phase 4 完了確認**
- [ ] 本番で48時間安定稼働
- [ ] パフォーマンス劣化なし
- [ ] データ整合性維持
- [ ] ユーザー影響なし

---

### Phase 5: 最終化とクリーンアップ

#### 5.1 列入れ替え（2週間安定稼働後）
```sql
-- 十分な安定稼働を確認後に実行
BEGIN;

-- 旧列をバックアップ用にリネーム
ALTER TABLE ai_interview_sessions 
RENAME COLUMN status TO status_old;

-- 新enum列を正式列名に変更
ALTER TABLE ai_interview_sessions 
RENAME COLUMN status_enum_temp TO status;

-- インデックス再作成
CREATE INDEX CONCURRENTLY idx_ai_interview_sessions_status 
ON ai_interview_sessions(status);

COMMIT;
```

#### 5.2 同期トリガー削除
```sql
-- 双方向同期が不要になったため削除
DROP TRIGGER IF EXISTS sync_ai_interview_sessions_status_trigger 
ON ai_interview_sessions;

DROP FUNCTION IF EXISTS sync_ai_interview_sessions_status();
```

#### 5.3 旧列削除（30日後）
```sql
-- 最終確認後に旧列削除
-- 30日間の安定稼働とrollback不要の確信を得てから実行
ALTER TABLE ai_interview_sessions DROP COLUMN status_old;
```

**✅ Phase 5 完了確認**
- [ ] enum列が正式採用された
- [ ] 不要なトリガーが削除された
- [ ] パフォーマンスが最適化された
- [ ] 移行完了

---

## 🚨 緊急時対応

### 即座にロールバックが必要な場合

#### Feature Flag無効化（最優先）
```sql
-- 即座にenum使用を停止
UPDATE feature_flags 
SET enabled = false 
WHERE key = 'use_enum_ai_interview_sessions_status';
```

#### データ修復（必要に応じて）
```sql
-- データ不整合が発生した場合の修復
UPDATE ai_interview_sessions 
SET status = status_enum_temp::text 
WHERE status != status_enum_temp::text;
```

#### アプリケーション緊急デプロイ
- Feature Flag無効時の動作確認済みコードへ即座に戻す
- 必要に応じてHotfixデプロイ実行

### 段階別Rollback手順

**Phase 2でのRollback**
```sql
ALTER TABLE ai_interview_sessions DROP COLUMN status_enum_temp;
DROP TYPE interview_session_status;
```

**Phase 3-4でのRollback** 
```sql
-- Feature Flag無効化 + トリガー削除
UPDATE feature_flags SET enabled = false WHERE key = 'use_enum_ai_interview_sessions_status';
DROP TRIGGER sync_ai_interview_sessions_status_trigger ON ai_interview_sessions;
```

**Phase 5でのRollback（複雑）**
```sql
-- 旧列が削除されている場合の復旧は複雑
-- バックアップからの復元が必要な場合がある
```

---

## 📊 監視とアラート

### KPI監視項目
- API レスポンス時間（移行前後で±10%以内）
- エラー率（移行前と同水準維持）
- enum操作成功率（99.9%以上）
- データ整合性（不一致レコード0件）

### アラート設定
- Contract Violation発生時の即座通知
- Feature Flag変更時の通知
- パフォーマンス劣化検知
- データ不整合検知

### レポート
- 移行進捗の日次レポート
- 各Phaseの完了確認レポート
- 最終完了レポートと次回移行の改善点

---

## 📝 実行チェックリスト

### 事前準備
- [ ] 全チームメンバーへの実行計画共有
- [ ] バックアップ取得確認
- [ ] 監視システム稼働確認
- [ ] 緊急連絡体制確立

### Phase実行時
- [ ] 各Phaseの完了確認
- [ ] データ整合性検証
- [ ] パフォーマンス監視
- [ ] エラー発生有無確認

### 事後確認
- [ ] 移行完了の最終検証
- [ ] ドキュメント更新
- [ ] 次回移行の改善点記録
- [ ] チーム振り返り実施

---

## 🎓 学習ポイント

### 今回の移行で習得する技術
1. **Feature Flag戦略**: 段階的機能切り替えの実践
2. **Zero-Downtime Migration**: 無停止でのスキーマ変更
3. **Data Contract**: 型安全性とスキーマ進化の両立
4. **Observability**: 移行プロセスの可視化と監視

### 次回移行への活用
- より大規模なテーブルでの最適化手法
- Complex型（Array、JSON）のenum化戦略
- クロステーブル制約を伴う移行手法
- マイクロサービス間でのschema evolution

---

*このRunbookはP1-2の実装完了により、AIOHubが本格的なenum/domain移行能力を習得したことを示します。*