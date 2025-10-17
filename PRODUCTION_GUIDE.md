# 🚀 AI可視性+防御統合監視システム 本番運用ガイド

## 📊 システム概要

本システムは、AI可視性モニタリングと防御機能を統合したVercel本番環境での運用システムです。

### ✅ 完了済み統合作業

- **Cron統合**: 2本制限内に統合済み（daily cron 1本）
- **環境変数管理**: 自動検証とテンプレート生成
- **フォールバック処理**: データベース障害時の安全な動作
- **本番デプロイ統一**: 自動プロダクションデプロイ設定
- **自動検証機能**: 包括的な本番環境検証

---

## 🔧 1. デプロイメント手順

### 基本デプロイフロー
```bash
# 1. 環境変数確認
npm run validate:env

# 2. 本番デプロイ（環境変数チェック付き）
npm run deploy:production

# 3. デプロイ後検証
npm run validate:production
```

### 緊急デプロイ
```bash
# 環境変数チェックをスキップして強制デプロイ
npm run deploy:force-prod
```

### PRベースデプロイ
1. **feature/fix ブランチでPR作成**
2. **GitHub Actions自動実行**:
   - 品質チェック（TypeScript, ESLint, Tests）
   - ビルドテスト
   - セキュリティスキャン
3. **main ブランチマージ**
4. **自動本番デプロイ** (`--prod` フラグ付き)
5. **デプロイ後ヘルスチェック**

---

## 🔄 2. Cron Jobs 管理

### 統合Cron設定
- **パス**: `/api/cron/daily`
- **スケジュール**: `0 18 * * *` (JST 3:00 AM)
- **制限**: 2本以内（現在1本使用）

### 統合ジョブ内容
1. **AI可視性チェック** (`runAiVisibilityJob()`)
2. **データベースクリーンアップ**
3. **ヘルスチェック**

### Cron設定確認
```bash
# vercel.json でcron設定確認
cat vercel.json | grep -A5 "crons"

# Cron本数確認
npm run validate:production | grep "Cron Count"
```

---

## 🛡️ 3. フォールバック・安全機能

### 自動フォールバック
1. **ai_visibility_config テーブル障害時**:
   - デフォルト安全設定に自動切り替え
   - 全AIクローラー `/o/` アクセス許可
   - 検索エンジン全パスアクセス許可

2. **データベース接続障害時**:
   - 500エラーではなく空データセットで継続
   - Slack通知で管理者アラート

### 手動フォールバック確認
```bash
# フォールバック設定確認
node -e "
const { getAiVisibilityConfig, getStaticRobots } = require('./src/lib/ai-visibility-config.ts');
console.log('Testing fallback...');
"
```

---

## 🔍 4. 監視・検証

### 自動検証項目
- ✅ HTTP応答（4種User-Agent）
- ✅ robots.txt 設定
- ✅ sitemap.xml 生成
- ✅ Supabase設定接続
- ✅ Cron本数制限

### 日次検証
```bash
# 本番環境包括的検証
npm run validate:production

# 環境変数確認
npm run validate:env

# ヘルスチェック
npm run health:production
```

### 検証結果の見方
```
🎯 Total Tests: 8
✅ Passed: 6      ← 成功テスト数
❌ Failed: 1      ← 失敗テスト数（要対応）
⚠️  Warnings: 1   ← 警告（監視継続）
📈 Success Rate: 75%  ← 成功率
```

---

## 🔧 5. 環境変数管理

### 必須環境変数
```env
# Supabase（必須）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# アプリケーション（必須）
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SITE_URL=https://aiohub.jp
ADMIN_API_TOKEN=your-secure-token

# オプション
CRON_SECRET=your-cron-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 環境変数設定手順
1. **`.env.production.sample` 確認**
2. **Vercel Dashboard** > Settings > Environment Variables
3. **本番環境用の値を設定**
4. **再デプロイで反映**

---

## 🚨 6. トラブルシューティング

### よくある問題と解決策

#### 1. PGRST205エラー (ai_visibility_config未検出)
```bash
# 原因: Supabaseテーブル未作成
# 解決: SQL Editorで以下実行
CREATE TABLE ai_visibility_config (...);  -- DDLは提供済み

# 確認:
npm run validate:production | grep "Config Access"
```

#### 2. Cron上限超過エラー
```bash
# 確認: vercel.json のcrons配列を確認
cat vercel.json | jq '.crons | length'

# 解決: 不要なcronを削除、dailyに統合
```

#### 3. 環境変数未設定エラー
```bash
# 確認
npm run validate:env

# 解決: Vercel Dashboardで環境変数設定後再デプロイ
npm run deploy:production
```

#### 4. フォールバック動作の確認
```bash
# ログ確認（フォールバック動作時）
npm run validate:production | grep "fallback"

# Slack通知確認（SLACK_WEBHOOK_URL設定時）
```

---

## 📋 7. 運用チェックリスト

### 日次（自動実行）
- [x] AI可視性監視（Cron）
- [x] データベースクリーンアップ（Cron）
- [x] システムヘルスチェック（Cron）

### 週次（手動推奨）
- [ ] `npm run validate:production` 実行
- [ ] 検証レポート確認
- [ ] Slack通知履歴確認

### 月次（手動推奨）
- [ ] 環境変数設定レビュー
- [ ] Cron設定確認
- [ ] セキュリティ監査

### デプロイ時（必須）
- [ ] `npm run validate:env` 成功確認
- [ ] PR→main→自動デプロイ確認
- [ ] `npm run validate:production` 成功確認

---

## 🌐 8. 本番URL・エンドポイント

### 主要URL
- **本番サイト**: https://aiohub.jp
- **AI可視性ダッシュボード**: https://aiohub.jp/admin/ai-visibility
- **対象パス**: https://aiohub.jp/o/luxucare

### API エンドポイント
- **AI可視性データ**: `/api/admin/ai-visibility/latest`
- **Daily Cron**: `/api/cron/daily`
- **ヘルスチェック**: `/api/health`

---

## 📞 9. サポート・連絡先

### 緊急時対応
1. **Slack通知確認** (SLACK_WEBHOOK_URL設定時)
2. **`npm run validate:production` でシステム状態確認**
3. **必要に応じて `npm run deploy:force-prod` で緊急デプロイ**

### 開発チーム連絡
- システム管理者へSlack通知が自動送信
- production-validation-report.json で詳細な状態確認可能

---

**🎉 本番稼働準備完了**
- ✅ Cron統合済み（1本/2本制限内）
- ✅ フォールバック処理実装済み
- ✅ 自動検証・レポート機能稼働中
- ✅ PRマージで自動本番デプロイ設定済み

**最新検証実行**: `npm run validate:production`  
**Production URL**: https://aiohub.jp/o/luxucare