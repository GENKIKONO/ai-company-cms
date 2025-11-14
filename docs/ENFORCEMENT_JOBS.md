# 制裁システム - ジョブ実行ガイド

## 概要

制裁システムでは、期限付きアクションの自動処理を行うためのジョブシステムを提供します。
このドキュメントでは、2つの実行方式（pg_cron と Edge cron）について説明します。

## ジョブの役割

- **処理対象**: `enforcement_actions` テーブルの期限が来た未処理アクション
- **実行内容**: 期限到来時の自動状態遷移
- **処理関数**: `process_enforcement_deadlines()` ストアド関数

### 状態遷移ルール

| アクション | 期限到来時の状態変更 |
|-----------|-------------------|
| `warn` | `warned` → `active` |
| `suspend` | `suspended` → `frozen` |
| `freeze` | `frozen` → `deleted` |

## 実行方式 1: pg_cron (推奨)

### 前提条件

- Supabase プロジェクトで pg_cron 拡張が有効
- プロジェクトの設定で定期実行が許可されている

### 設定手順

1. **pg_cron 拡張の有効化**
   ```sql
   -- Supabase ダッシュボード > SQL Editor で実行
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. **ジョブの登録**
   ```sql
   -- 5分ごとに実行するジョブを登録
   SELECT cron.schedule(
     'enforcement_process',           -- ジョブ名
     '*/5 * * * *',                  -- Cron式（5分間隔）
     'SELECT process_enforcement_deadlines();'  -- 実行するSQL
   );
   ```

3. **ジョブの確認**
   ```sql
   -- 登録済みジョブの一覧
   SELECT * FROM cron.job;
   
   -- ジョブの実行履歴
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

4. **ジョブの無効化・削除**
   ```sql
   -- ジョブの無効化
   SELECT cron.unschedule('enforcement_process');
   
   -- 強制削除
   DELETE FROM cron.job WHERE jobname = 'enforcement_process';
   ```

### Cron式の例

```bash
# 5分ごと
*/5 * * * *

# 毎時0分、15分、30分、45分
0,15,30,45 * * * *

# 平日の8時〜20時、毎時実行
0 8-20 * * 1-5

# 毎日午前3時（深夜処理）
0 3 * * *
```

### 監視とログ

```sql
-- 処理実行状況の確認
SELECT 
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details 
WHERE jobname = 'enforcement_process'
ORDER BY start_time DESC
LIMIT 20;

-- 最近処理されたアクション
SELECT 
  id,
  user_id,
  action,
  deadline,
  processed_at,
  (processed_at - deadline) as processing_delay
FROM enforcement_actions 
WHERE processed_at IS NOT NULL
  AND processed_at > (NOW() - INTERVAL '1 hour')
ORDER BY processed_at DESC;
```

## 実行方式 2: Edge Cron / 外部ジョブ

### 前提条件

- Next.js アプリケーションが稼働中
- 外部からAPIアクセス可能
- 認証トークンまたは管理者認証の設定

### Vercel Cron Jobs を使用する場合

1. **環境変数の設定**
   ```bash
   # Vercel ダッシュボードで設定
   ENFORCEMENT_CRON_TOKEN=your-secure-random-token-here
   ```

2. **vercel.json の設定**
   ```json
   {
     "crons": [
       {
         "path": "/api/enforcement/jobs/process",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

3. **手動実行例**
   ```bash
   # Cron トークン認証
   curl -X POST "https://your-app.vercel.app/api/enforcement/jobs/process" \
     -H "x-cron-token: your-secure-random-token-here" \
     -H "Content-Type: application/json"

   # 管理者認証（Cookie必要）
   curl -X POST "https://your-app.vercel.app/api/enforcement/jobs/process" \
     -H "Cookie: your-auth-cookies" \
     -H "Content-Type: application/json"
   ```

### GitHub Actions を使用する場合

```yaml
# .github/workflows/enforcement-cron.yml
name: Enforcement Job

on:
  schedule:
    - cron: '*/5 * * * *'  # 5分ごと
  workflow_dispatch:  # 手動実行も可能

jobs:
  process-enforcement:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Enforcement Job
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/enforcement/jobs/process" \
            -H "x-cron-token: ${{ secrets.ENFORCEMENT_CRON_TOKEN }}" \
            -H "Content-Type: application/json"
```

### その他の外部サービス

- **AWS EventBridge**
- **Google Cloud Scheduler**
- **Azure Logic Apps**
- **監視サービス（Uptime Robot、Pingdom等）**

## 処理結果の確認

### API レスポンスの例

```json
{
  "success": true,
  "data": {
    "processedCount": 3,
    "timestamp": "2024-11-13T12:00:00.000Z",
    "authContext": "cron-token",
    "processedActions": [
      {
        "actionId": "uuid-1",
        "userId": "user-uuid-1",
        "action": "suspend",
        "deadline": "2024-11-13T11:55:00.000Z",
        "processedAt": "2024-11-13T12:00:01.000Z",
        "userEmail": "user@example.com",
        "currentStatus": "frozen"
      }
    ]
  }
}
```

### 処理状況の確認 API

```bash
# GET /api/enforcement/jobs/process
curl -X GET "https://your-app.vercel.app/api/enforcement/jobs/process" \
  -H "Cookie: your-admin-auth-cookies"
```

```json
{
  "success": true,
  "data": {
    "pendingCount": 0,
    "recentProcessed": [
      {
        "id": "action-uuid",
        "action": "suspend",
        "user_id": "user-uuid",
        "deadline": "2024-11-13T11:55:00.000Z",
        "processed_at": "2024-11-13T12:00:01.000Z"
      }
    ],
    "lastCheck": "2024-11-13T12:05:00.000Z",
    "cronTokenConfigured": true
  }
}
```

## セキュリティ考慮事項

### 認証方式

1. **Cron トークン認証（推奨）**
   - 専用の長いランダムトークンを生成
   - 環境変数で管理
   - ヘッダー `x-cron-token` で送信

2. **管理者認証**
   - フォールバック手段として使用
   - ブラウザからの手動実行時に便利

### トークン生成例

```bash
# 32文字のランダムトークン生成
openssl rand -hex 32

# または Node.js で
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## トラブルシューティング

### よくある問題

1. **ジョブが実行されない**
   - pg_cron が有効になっているか確認
   - Cron式の書式が正しいか確認
   - 権限エラーがないか確認

2. **処理が重複する**
   - ジョブの実行間隔を調整
   - `processed_at` フィールドによる重複防止が動作しているか確認

3. **認証エラー**
   - トークンが正しく設定されているか確認
   - 環境変数が正しく読み込まれているか確認

### デバッグ方法

```sql
-- 処理待ちアクションの確認
SELECT 
  id,
  user_id,
  action,
  deadline,
  (deadline < NOW()) as is_overdue,
  (NOW() - deadline) as overdue_duration
FROM enforcement_actions 
WHERE deadline IS NOT NULL 
  AND processed_at IS NULL
ORDER BY deadline;

-- 手動実行
SELECT process_enforcement_deadlines();
```

## 推奨設定

### 本番環境

- **実行間隔**: 5分（`*/5 * * * *`）
- **認証方式**: Cron トークン
- **監視**: ジョブ実行ログの定期確認
- **アラート**: 24時間以上処理されないアクションがある場合

### 開発環境

- **実行間隔**: 1分（`* * * * *`）
- **認証方式**: 管理者認証（手動実行）
- **ログ**: より詳細なデバッグ情報

### 運用監視

```sql
-- 日次レポート用クエリ
SELECT 
  DATE(processed_at) as date,
  COUNT(*) as processed_count,
  COUNT(DISTINCT user_id) as affected_users,
  string_agg(DISTINCT action, ', ') as action_types
FROM enforcement_actions 
WHERE processed_at IS NOT NULL
  AND processed_at > (CURRENT_DATE - INTERVAL '7 days')
GROUP BY DATE(processed_at)
ORDER BY date DESC;
```