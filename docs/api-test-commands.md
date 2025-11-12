# Billing Analytics API Test Commands

## 概要
AIOHub Billing Analytics API の動作確認用 cURL コマンド集です。

## 事前準備

### 1. 環境変数の確認
```bash
# 必要な環境変数
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 2. 認証トークンの取得
```bash
# 管理者でログインしてJWTトークンを取得
# ブラウザの開発者ツールでApplication > Cookies > supabase-auth-token の値をコピー

# または、Supabaseクライアントで直接取得
export AUTH_TOKEN="your-jwt-token-here"
```

## API エンドポイント別テスト

### 1. Summary API (概要統計)

#### 基本テスト
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/summary" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

#### 期待される応答例
```json
{
  "data": {
    "total_checkout_links": 15,
    "active_links": 3,
    "inactive_links": 12,
    "public_links": 10,
    "private_links": 5,
    "campaign_breakdown": {
      "test_user": 5,
      "early_user": 7,
      "regular": 3
    },
    "plan_breakdown": {
      "starter": 8,
      "pro": 4,
      "business": 2,
      "enterprise": 1
    },
    "avg_discount_rate": 18.33,
    "url_configured_ratio": 0.8,
    "period_defined_ratio": 0.6
  },
  "metadata": {
    "fetched_at": "2024-11-12T12:00:00Z"
  }
}
```

### 2. Campaigns API (キャンペーン別統計)

#### 基本テスト
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/campaigns" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

#### 期待される応答例
```json
{
  "data": [
    {
      "campaign_type": "test_user",
      "plan_type": "starter",
      "checkout_link_count": 3,
      "active_link_count": 1,
      "public_link_count": 2,
      "private_link_count": 1,
      "avg_discount_rate": 30.0,
      "max_discount_rate": 30.0,
      "latest_created_at": "2024-11-12T10:00:00Z",
      "earliest_start_at": "2024-11-01T00:00:00Z",
      "latest_end_at": "2024-12-31T23:59:59Z",
      "url_configured_count": 3,
      "period_defined_count": 2
    }
  ],
  "metadata": {
    "total_campaigns": 8,
    "fetched_at": "2024-11-12T12:00:00Z"
  }
}
```

### 3. Trends API (トレンド分析)

#### 日別トレンド (過去30日)
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/trends?period=daily&days=30" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

#### 週別トレンド (過去12週)
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/trends?period=weekly&days=84" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

#### 月別トレンド (過去6ヶ月)
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/trends?period=monthly&days=180" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

#### 期待される応答例
```json
{
  "data": [
    {
      "date": "2024-11-12",
      "created_count": 5,
      "activated_count": 2,
      "campaign_type_distribution": {
        "test_user": 2,
        "early_user": 2,
        "regular": 1
      },
      "plan_type_distribution": {
        "starter": 3,
        "pro": 1,
        "business": 1,
        "enterprise": 0
      },
      "avg_discount_rate": 20.0,
      "public_vs_private": {
        "public_count": 4,
        "private_count": 1
      }
    }
  ],
  "metadata": {
    "period": "daily",
    "days": 30,
    "data_points": 30,
    "date_range": {
      "start": "2024-10-13",
      "end": "2024-11-12"
    },
    "fetched_at": "2024-11-12T12:00:00Z"
  }
}
```

## エラーケースのテスト

### 1. 認証エラー (401)
```bash
curl -X GET "http://localhost:3000/api/admin/billing-analytics/summary" \
  -H "Content-Type: application/json" \
  -v
```

### 2. 権限不足エラー (403)
```bash
# 一般ユーザーのトークンを使用
export USER_TOKEN="non-admin-user-token"

curl -X GET "http://localhost:3000/api/admin/billing-analytics/summary" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

### 3. 不正なパラメータ (400)
```bash
# 不正な期間指定
curl -X GET "http://localhost:3000/api/admin/billing-analytics/trends?period=invalid&days=30" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v

# 範囲外の日数指定
curl -X GET "http://localhost:3000/api/admin/billing-analytics/trends?period=daily&days=999" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

## 一括テストスクリプト

### bash スクリプト例
```bash
#!/bin/bash

# 環境設定
BASE_URL="http://localhost:3000"
AUTH_TOKEN="${AUTH_TOKEN:-your-token-here}"

echo "=== Billing Analytics API Tests ==="
echo "Base URL: $BASE_URL"
echo "Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""

# 1. Summary API
echo "1. Testing Summary API..."
curl -s -X GET "$BASE_URL/api/admin/billing-analytics/summary" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# 2. Campaigns API
echo "2. Testing Campaigns API..."
curl -s -X GET "$BASE_URL/api/admin/billing-analytics/campaigns" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# 3. Trends API - Daily
echo "3. Testing Trends API (Daily)..."
curl -s -X GET "$BASE_URL/api/admin/billing-analytics/trends?period=daily&days=7" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# 4. Trends API - Weekly
echo "4. Testing Trends API (Weekly)..."
curl -s -X GET "$BASE_URL/api/admin/billing-analytics/trends?period=weekly&days=28" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

echo "=== All tests completed ==="
```

### 実行方法
```bash
# スクリプトを保存
chmod +x test-billing-apis.sh

# 環境変数を設定して実行
export AUTH_TOKEN="your-actual-jwt-token"
./test-billing-apis.sh
```

## 注意点

1. **認証トークン**: JWTトークンは有効期限があります。定期的に更新してください。

2. **CORS設定**: ローカル開発環境以外からテストする場合は、CORS設定を確認してください。

3. **レート制限**: 本番環境では適切なレート制限を設定することを推奨します。

4. **ログ確認**: APIエラー時は、サーバーログ(`console.error`)とSupabaseログの両方を確認してください。

5. **データベース接続**: PostgreSQL接続エラーの場合は、環境変数とネットワーク設定を確認してください。

## トラブルシューティング

### よくある問題と解決方法

1. **"Authentication required"エラー**
   - JWTトークンの有効性を確認
   - Authorizationヘッダーの形式を確認

2. **"Admin permission required"エラー**
   - ユーザーの管理者権限を確認
   - `profiles`テーブルの`role`フィールドが'admin'であることを確認

3. **"Database error"**
   - Supabase接続情報を確認
   - RLS (Row Level Security) ポリシーの設定を確認
   - `billing_checkout_links`テーブルの存在を確認

4. **"Function not found"エラー**
   - PostgreSQL関数(`get_billing_summary`, `get_campaign_analytics_detailed`, `get_billing_trends`)が作成されているか確認
   - フォールバック処理により直接クエリが実行されているかログで確認