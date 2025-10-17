# AI Visibility Guard System

## 概要

AI Visibility Guard は、AIO Hub を「AIに読まれる」かつ「不正コピー・高頻度攻撃を防ぐ」状態で運用するための統合監視・防御システムです。

### 主要機能

1. **スマートクローラ許可**: 検索エンジンとAIクローラーを差別化し、適切なアクセス権限を設定
2. **リアルタイム防御**: レート制限、IP自動ブロック、Bot検知による多層防御
3. **コンテンツ保護**: JSON-LD署名、出典タグによる完全コピー防止
4. **可視性監視**: AI発見性を継続的に監視し、問題を自動検知・通知
5. **自動化運用**: Vercel Cronによる定期チェックとSlack通知

## アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Crawler    │───▶│  Edge Middleware │───▶│  Rate Limiting  │
│  (GPTBot, etc.) │    │   Bot Analysis   │    │   IP Blocking   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Search Engine  │───▶│   Dynamic        │───▶│  Content        │
│ (Googlebot etc.)│    │   robots.txt     │    │  Protection     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Monitoring    │◀───│    Supabase      │───▶│     Slack       │
│   Dashboard     │    │    Database      │    │  Notifications  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 設計方針

### 1. クロール許可と防御方針

#### 許可レベル

| User Agent | アクセス範囲 | 理由 |
|------------|-------------|------|
| **Googlebot, Bingbot** | `/` (フルアクセス) | 検索エンジン最適化のため |
| **GPTBot, CCBot, PerplexityBot** | `/o/` のみ | AI学習用に企業情報のみ許可 |
| **その他のBot** | robots.txt でブロック | 不正スクレイピング防止 |

#### 恒久的ブロックパス

```
/dashboard          # ユーザーダッシュボード
/api/auth          # 認証API
/billing           # 決済情報
/checkout          # チェックアウト
/preview           # プレビュー機能
/webhooks          # Webhook受信
/admin             # 管理画面
/management-console # 管理コンソール
```

### 2. レート制限設定

| Bot Type | 制限 | 窓 | 説明 |
|----------|------|-----|------|
| **search_engine** | 20 req | 60s | 検索エンジンは比較的寛容 |
| **ai_crawler** | 10 req | 60s | AI学習用は適度に制限 |
| **scraper** | 2 req | 60s | 不明Botは厳しく制限 |
| **suspicious** | 1 req | 60s | 疑わしいUAは最大制限 |
| **browser** | 30 req | 60s | 一般ユーザーは寛容 |

### 3. 自動ブロック条件

- **即座ブロック**: 60秒間に3回以上のレート制限違反
- **IP ブロック期間**: 初回1時間、再違反で段階的延長
- **解除方法**: 管理画面から手動解除、または期限自動解除

## データベース設計

### 主要テーブル

#### `ai_visibility_logs`
AI可視性監視の結果を記録
```sql
- url: 監視対象URL
- user_agent: テストしたUser-Agent
- status_code: HTTPステータス
- response_time_ms: レスポンス時間
- severity_level: 問題レベル (P0/P1/P2/OK)
- issues: 検出された問題のリスト
- jsonld_signature: コンテンツの署名
```

#### `blocked_ips`
自動ブロックされたIPアドレス
```sql
- ip_address: ブロック対象IP
- reason: ブロック理由
- blocked_until: ブロック解除予定時刻
- violation_count: 違反回数
```

#### `rate_limit_logs`
アクセスログとレート制限記録
```sql
- ip_address: アクセス元IP
- user_agent: User-Agent
- path: アクセスパス
- limit_exceeded: 制限超過フラグ
- bot_type: Bot分類
```

## 運用手順

### 日常監視

1. **管理ダッシュボード**: `/admin/ai-visibility` で状況確認
2. **Slack通知**: P0問題発生時に即座通知
3. **週次レポート**: 自動生成される定期レポートを確認

### 問題対応

#### P0 (緊急) 問題

- **症状**: AI クローラーが 403/404/500 エラー
- **対応**: 
  1. robots.txt 設定確認
  2. middleware ブロック条件確認  
  3. サーバー状態確認

#### P1 (重要) 問題

- **症状**: JSON-LD 欠落、canonical URL 不正
- **対応**:
  1. 該当ページの構造化データ確認
  2. メタタグ設定見直し
  3. サイトマップ更新

#### P2 (軽微) 問題

- **症状**: title/description 不適切、レスポンス遅延
- **対応**:
  1. SEO最適化
  2. パフォーマンス改善
  3. 次回メンテナンス時に修正

### 設定変更

#### robots.txt ルール変更

1. Supabase の `ai_visibility_config` テーブルを更新
2. `allowed_crawlers` 設定を変更
3. 数分後に自動反映

#### レート制限調整

1. `/lib/ai-visibility/content-protection.ts` の `RATE_LIMITS` を編集
2. デプロイで反映

#### 新しいBot追加

1. `middleware.ts` の `detectBotType` 関数を更新
2. robots.txt 生成ロジックに追加
3. デプロイで反映

### 手動復旧手順

#### ブロックされたIP解除

```sql
-- 管理画面または直接SQL
UPDATE blocked_ips 
SET is_active = false, unblocked_at = NOW(), unblocked_by = 'admin'
WHERE ip_address = '1.2.3.4';
```

#### 緊急時の全Bot許可

```sql
-- 緊急時のみ使用
UPDATE ai_visibility_config 
SET config_value = '{"emergency_mode": true}'
WHERE config_key = 'allowed_crawlers';
```

#### システム無効化

```bash
# 環境変数設定で一時無効化
AI_VISIBILITY_GUARD_ENABLED=false
```

## Slack通知設定

### 必要な環境変数

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
CRON_SECRET=your-cron-secret-key
ADMIN_API_TOKEN=your-admin-api-token
AI_VISIBILITY_SECRET=your-content-signing-secret
```

### 通知タイミング

- **即座通知**: P0問題検出時
- **日次サマリー**: 毎日 AM 4:00 (JST)
- **エラー通知**: システム障害時

### 通知内容

```
🚨 AI Visibility Alert - Critical Issues Detected

P0 Critical: 3    P1 Important: 2
P2 Minor: 1       Healthy: 12

Critical URLs affected:
• https://aiohub.jp/o/luxucare
• https://aiohub.jp/robots.txt

Common Issues:
• Access forbidden - check robots.txt (3)
• Missing JSON-LD structured data (2)

[View Dashboard]
```

## 異常パターン例

### パターン1: "CCBot blocked but GPTBot allowed"

**症状**: CCBot が 403、GPTBot が 200
**原因**: robots.txt の User-Agent 記述ミス
**対処**: robots.txt 生成ロジック確認

### パターン2: "High rate limit violations from single IP"

**症状**: 同一IPから大量アクセス
**原因**: 悪意のあるスクレイピング
**対処**: 自動ブロック、必要に応じて WAF 設定

### パターン3: "JSON-LD signature mismatch"

**症状**: コンテンツ署名が一致しない
**原因**: 不正コピー、または署名キー変更
**対処**: 署名キー確認、コンテンツ整合性チェック

### パターン4: "All crawlers returning 500"

**症状**: 全てのクローラーが 500 エラー
**原因**: サーバー障害、デプロイ失敗
**対処**: サーバー復旧、ロールバック検討

## API エンドポイント

### 管理API

- **GET** `/api/admin/ai-visibility/latest` - 最新チェック結果取得
- **POST** `/api/admin/ai-visibility/run` - 手動チェック実行
- **GET** `/api/admin/ai-visibility/run` - ドライラン実行

### Cron API

- **GET** `/api/cron/ai-visibility` - 定期チェック (Vercel Cron)

### 認証

```bash
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## 監視メトリクス

### 主要指標

- **可用性**: P0 問題件数 (目標: 0件)
- **パフォーマンス**: 平均レスポンス時間 (目標: <1000ms)
- **セキュリティ**: ブロックIP数、レート制限違反数
- **品質**: P1/P2 問題件数、JSON-LD 署名率

### ダッシュボード表示

- **リアルタイム**: 最新24時間の状況
- **過去7日**: 傾向分析とスパークライン
- **問題別**: 頻出問題のランキング
- **URL別**: ページ別の健全性状況

## 開発・デバッグ

### ローカル環境

```bash
# 開発サーバー起動
npm run dev

# AI可視性チェック (ドライラン)
curl http://localhost:3001/api/admin/ai-visibility/run

# レート制限テスト
for i in {1..5}; do curl -H "User-Agent: TestBot/1.0" http://localhost:3001/; done
```

### ログ確認

```bash
# Vercel関数ログ
vercel logs --follow

# 開発環境ログ
tail -f .next/server.log
```

### テストシナリオ

1. **正常系**: Googlebot で組織ページアクセス → 200
2. **制限系**: GPTBot でダッシュボードアクセス → 403  
3. **レート制限**: 同一IPで高頻度アクセス → 429
4. **ブロック**: 制限違反IP再アクセス → 403

## セキュリティ考慮事項

### 環境変数管理

- **本番**: Vercel Environment Variables
- **開発**: `.env.local` (gitignore済み)
- **秘密情報**: Supabase Row Level Security で保護

### アクセス制御

- **管理画面**: 管理者メールドメイン認証
- **API**: Bearer トークン認証
- **Cron**: Vercel署名検証

### データ保護

- **JSON-LD署名**: HMAC-SHA256 でコンテンツ保護
- **IP匿名化**: ログ保持期間は30日間
- **GDPR対応**: EU IPからの削除要求対応

## 今後の拡張計画

### Phase 2: 高度な分析

- **ML-based Bot Detection**: 機械学習による Bot 分類
- **Content Drift Detection**: コンテンツ変更の自動検知
- **Competitive Analysis**: 競合他社との比較分析

### Phase 3: 自動最適化

- **Dynamic Rate Limiting**: トラフィックパターンに応じた動的制限
- **Auto-healing**: 問題の自動修復機能
- **Predictive Blocking**: 攻撃予兆の検知とプリエンプティブブロック

---

## サポート

### 連絡先

- **緊急時**: Slack #ai-visibility-alerts
- **一般**: GitHub Issues
- **設定変更**: 管理者メール

### ドキュメント更新

このドキュメントは実装変更に合わせて随時更新してください。