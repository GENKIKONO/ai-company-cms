# 制裁システム - テストガイド

## 概要

制裁システムの動作確認のためのテスト手順とcurlコマンド例を提供します。
システム全体の流れ（違反登録 → 警告 → 一時停止 → 凍結 → 解除）を実際に確認できます。

## 前提条件

- アプリケーションが起動していること
- Supabaseマイグレーションが適用されていること
- 管理者権限を持つユーザーでログインしていること
- テスト用ユーザーのUUIDを把握していること

## テスト用環境変数

```bash
# 基本設定
export APP_URL="http://localhost:3000"  # または本番URL
export TEST_USER_ID="123e4567-e89b-12d3-a456-426614174000"  # 実際のテストユーザーID

# 管理者認証（ブラウザでログイン後、Cookieを取得）
export AUTH_COOKIES="sb-project-auth-token=...; sb-project-refresh-token=..."

# Cron認証（本番のみ）
export CRON_TOKEN="your-cron-token"
```

## Phase 1: 違反登録テスト

### 1.1 軽微な違反を登録

```bash
curl -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "severity": "low",
    "reason": "テスト用の軽微な違反（コメント規約違反）",
    "evidence": {
      "type": "comment",
      "content": "不適切なコメント内容",
      "reported_by": "auto_detection"
    },
    "autoAction": false
  }'
```

**期待結果:**
```json
{
  "success": true,
  "data": {
    "violation": {
      "id": "violation-uuid",
      "userId": "test-user-id",
      "severity": "low",
      "reason": "テスト用の軽微な違反（コメント規約違反）",
      "createdAt": "2024-11-13T12:00:00.000Z"
    }
  }
}
```

### 1.2 重大な違反を登録（自動アクション付き）

```bash
curl -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "severity": "high",
    "reason": "重大な違反行為（スパム投稿）",
    "evidence": {
      "type": "spam",
      "post_count": 50,
      "duration": "5_minutes",
      "detection_score": 0.95
    },
    "autoAction": true
  }'
```

**期待結果:**
- 違反が記録される
- 自動的に警告アクションが実行される
- ユーザーの状態が `active` → `warned` に変更される

## Phase 2: 手動制裁アクション

### 2.1 警告の発行

```bash
curl -X POST "$APP_URL/api/enforcement/actions/warn" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "利用規約に違反する行為が確認されました。今後このような行為を続けると、より厳しい措置を取る場合があります。",
    "deadline": "'$(date -u -d '+3 days' '+%Y-%m-%dT%H:%M:%S.000Z')'"
  }'
```

### 2.2 一時停止の実行

```bash
curl -X POST "$APP_URL/api/enforcement/actions/suspend" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "重大な規約違反により、アカウントを3日間一時停止いたします。期間中はサービスをご利用いただけません。",
    "deadline": "'$(date -u -d '+3 days' '+%Y-%m-%dT%H:%M:%S.000Z')'"
  }'
```

### 2.3 凍結の実行

```bash
curl -X POST "$APP_URL/api/enforcement/actions/freeze" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "複数回の違反行為により、アカウントを凍結いたします。解除については別途お問い合わせください。",
    "deadline": "'$(date -u -d '+7 days' '+%Y-%m-%dT%H:%M:%S.000Z')'"
  }'
```

### 2.4 復帰処理

```bash
curl -X POST "$APP_URL/api/enforcement/actions/reinstate" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "違反行為の改善が確認されたため、アカウントを復帰させます。今後は利用規約を遵守してご利用ください。"
  }'
```

### 2.5 削除処理（注意: 取消不可）

```bash
# ⚠️ 警告: この操作は取り消せません
curl -X POST "$APP_URL/api/enforcement/actions/delete" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "重大かつ継続的な違反行為により、アカウントを削除いたします。"
  }'
```

## Phase 3: ユーザー状態確認

### 3.1 現在の状態を取得

```bash
curl -X GET "$APP_URL/api/enforcement/users/$TEST_USER_ID/status" \
  -H "Cookie: $AUTH_COOKIES" | jq .
```

**期待結果:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "test-user-id",
      "email": "test@example.com",
      "currentStatus": "suspended",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "violations": {
      "count": {
        "total": 2,
        "low": 1,
        "medium": 0,
        "high": 1,
        "critical": 0
      },
      "recent": [...]
    },
    "actions": {
      "count": 2,
      "lastAction": {...},
      "activeActions": [...],
      "history": [...]
    }
  }
}
```

## Phase 4: 自動処理テスト

### 4.1 短期間テスト用アクション

```bash
# 1分後に期限が来るテスト用警告
curl -X POST "$APP_URL/api/enforcement/actions/warn" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": "テスト用短期警告（1分後に自動解除）",
    "deadline": "'$(date -u -d '+1 minute' '+%Y-%m-%dT%H:%M:%S.000Z')'"
  }'
```

### 4.2 期限処理ジョブの手動実行

```bash
# Cron トークン認証
curl -X POST "$APP_URL/api/enforcement/jobs/process" \
  -H "x-cron-token: $CRON_TOKEN" \
  -H "Content-Type: application/json"

# または管理者認証
curl -X POST "$APP_URL/api/enforcement/jobs/process" \
  -H "Cookie: $AUTH_COOKIES" \
  -H "Content-Type: application/json"
```

### 4.3 処理状況の確認

```bash
curl -X GET "$APP_URL/api/enforcement/jobs/process" \
  -H "Cookie: $AUTH_COOKIES" | jq .
```

## Phase 5: 通知システムテスト

### 5.1 通知スタブの動作確認

```bash
curl -X POST "$APP_URL/api/notifications/stub" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "type": "enforcement_warning",
    "message": "テスト用通知メッセージ",
    "metadata": {
      "actionId": "test-action-id",
      "severity": "high"
    }
  }'
```

### 5.2 通知設定の確認

```bash
curl -X GET "$APP_URL/api/notifications/stub" \
  -H "Cookie: $AUTH_COOKIES" | jq .
```

## データベース直接確認

### 基本的な確認クエリ

```sql
-- ユーザーの現在状態
SELECT id, email, account_status, created_at 
FROM profiles 
WHERE id = 'test-user-id';

-- 違反履歴
SELECT id, severity, reason, detected_at, created_at 
FROM violations 
WHERE user_id = 'test-user-id' 
ORDER BY created_at DESC;

-- アクション履歴
SELECT id, action, message, effective_from, deadline, processed_at, created_at 
FROM enforcement_actions 
WHERE user_id = 'test-user-id' 
ORDER BY created_at DESC;

-- 監査ログ
SELECT table_name, operation, new_data, performed_at 
FROM enforcement_audit 
WHERE (new_data->>'user_id') = 'test-user-id'
ORDER BY performed_at DESC;
```

### 統計確認

```sql
-- 違反統計
SELECT 
  severity,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM violations 
GROUP BY severity;

-- アクション統計
SELECT 
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN processed_at IS NOT NULL THEN 1 END) as processed_count
FROM enforcement_actions 
GROUP BY action;

-- 状態分布
SELECT 
  account_status,
  COUNT(*) as user_count
FROM profiles 
GROUP BY account_status;
```

## エラーケーステスト

### 不正なリクエスト

```bash
# 存在しないユーザーID
curl -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "severity": "low",
    "reason": "存在しないユーザーのテスト"
  }'

# 無効な severity
curl -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "severity": "invalid",
    "reason": "無効な severity のテスト"
  }'

# メッセージが空
curl -X POST "$APP_URL/api/enforcement/actions/warn" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "message": ""
  }'
```

### 権限エラー

```bash
# 認証なし
curl -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "severity": "low",
    "reason": "認証なしのテスト"
  }'

# 無効な Cron トークン
curl -X POST "$APP_URL/api/enforcement/jobs/process" \
  -H "x-cron-token: invalid-token" \
  -H "Content-Type: application/json"
```

## 負荷テスト

### 連続実行テスト

```bash
# 10回連続で違反を登録
for i in {1..10}; do
  curl -X POST "$APP_URL/api/enforcement/violations" \
    -H "Content-Type: application/json" \
    -H "Cookie: $AUTH_COOKIES" \
    -d '{
      "userId": "'$TEST_USER_ID'",
      "severity": "low",
      "reason": "負荷テスト用違反 #'$i'",
      "evidence": {"test_id": '$i'}
    }' &
done
wait
```

### 同期処理テスト

```bash
# 同じユーザーに対して同時に複数のアクション
curl -X POST "$APP_URL/api/enforcement/actions/warn" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{...}' &

curl -X POST "$APP_URL/api/enforcement/actions/suspend" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{...}' &

wait
```

## クリーンアップ

### テストデータの削除

```sql
-- 特定ユーザーのテストデータを削除
DELETE FROM enforcement_audit WHERE (new_data->>'user_id') = 'test-user-id';
DELETE FROM enforcement_actions WHERE user_id = 'test-user-id';
DELETE FROM violations WHERE user_id = 'test-user-id';
UPDATE profiles SET account_status = 'active' WHERE id = 'test-user-id';
```

### 一括クリーンアップ

```sql
-- テスト用データを一括削除（注意: 本番では実行しないこと）
DELETE FROM enforcement_audit WHERE new_data->>'reason' LIKE 'テスト%';
DELETE FROM enforcement_actions WHERE message LIKE 'テスト%';
DELETE FROM violations WHERE reason LIKE 'テスト%';
```

## 回帰テストスクリプト

### 自動テスト実行

```bash
#!/bin/bash
# enforcement-regression-test.sh

set -e

TEST_USER_ID="your-test-user-uuid"
APP_URL="http://localhost:3000"

echo "=== 制裁システム回帰テスト開始 ==="

# 1. 違反登録テスト
echo "1. 違反登録テスト"
RESPONSE=$(curl -s -X POST "$APP_URL/api/enforcement/violations" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{"userId": "'$TEST_USER_ID'", "severity": "low", "reason": "自動テスト"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 違反登録成功"
else
  echo "❌ 違反登録失敗: $RESPONSE"
  exit 1
fi

# 2. 警告アクションテスト
echo "2. 警告アクションテスト"
RESPONSE=$(curl -s -X POST "$APP_URL/api/enforcement/actions/warn" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{"userId": "'$TEST_USER_ID'", "message": "自動テスト警告"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 警告アクション成功"
else
  echo "❌ 警告アクション失敗: $RESPONSE"
  exit 1
fi

# 3. 状態確認テスト
echo "3. 状態確認テスト"
RESPONSE=$(curl -s -X GET "$APP_URL/api/enforcement/users/$TEST_USER_ID/status" \
  -H "Cookie: $AUTH_COOKIES")

if echo "$RESPONSE" | grep -q '"currentStatus":"warned"'; then
  echo "✅ 状態確認成功"
else
  echo "❌ 状態確認失敗: $RESPONSE"
  exit 1
fi

# 4. 復帰テスト
echo "4. 復帰テスト"
RESPONSE=$(curl -s -X POST "$APP_URL/api/enforcement/actions/reinstate" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIES" \
  -d '{"userId": "'$TEST_USER_ID'", "message": "自動テスト復帰"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 復帰アクション成功"
else
  echo "❌ 復帰アクション失敗: $RESPONSE"
  exit 1
fi

echo "=== 全テスト完了 ==="
```

## 監視・アラート設定

### ヘルスチェック

```bash
# システム稼働確認
curl -s "$APP_URL/api/health" | jq .

# 制裁システム固有のヘルスチェック
curl -s -X GET "$APP_URL/api/enforcement/jobs/process" \
  -H "Cookie: $AUTH_COOKIES" | jq '.data.pendingCount'
```

### アラート条件

1. **処理待ちアクションが24時間以上放置**
2. **ジョブAPIが連続して失敗**
3. **特定ユーザーの違反数が異常に多い**
4. **システムエラー率が5%を超過**