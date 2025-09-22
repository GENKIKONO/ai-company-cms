# 🔬 AIO Hub UAT (User Acceptance Testing) ドキュメント

## 📋 目次

### 📖 ドキュメント
- [🎯 **UAT最終版手順書**](./uat_final.md) - 完全版テスト手順（本文）
- [🚀 **実行ガイド**](./runner.md) - コピペで実行できるコマンド集
- [📊 **レポートテンプレート**](./templates/report.md) - 結果記録用フォーマット

### ✅ チェックリスト
- [🚨 **事前チェック**](./checklists/preflight.md) - 本番環境設定確認
- [🔴 **クリティカル**](./checklists/critical.md) - 本番リリース前必須テスト
- [🟡 **重要テスト**](./checklists/important.md) - リリース後1週間以内
- [🟢 **推奨テスト**](./checklists/recommended.md) - リリース後1ヶ月以内

### 🛠️ 検証スクリプト
- [📁 **scripts/uat/**](../../scripts/uat/) - 自動検証スクリプト集
- [💳 **Stripe テスト**](../../scripts/uat/stripe-test.md) - 決済テスト手順
- [📧 **Resend テスト**](../../scripts/uat/resend-test.md) - メール送信テスト

---

## 🎯 実行フロー

### 1️⃣ 事前準備（5分）
```bash
# 環境確認
npm run uat:preflight

# または個別実行
node scripts/uat/verify-env.mjs
node scripts/uat/verify-dns.mjs  
node scripts/uat/verify-endpoints.mjs
```

### 2️⃣ クリティカルテスト（40分）
```bash
# チェックリスト確認
docs/uat/checklists/critical.md

# 手動実行項目:
# - 基本認証フロー (10分)
# - 企業作成→公開 (15分)
# - 決済→サブスクリプション (10分)
# - セキュリティ基本確認 (5分)
```

### 3️⃣ 重要テスト（110分）
```bash
# チェックリスト確認
docs/uat/checklists/important.md

# 手動実行項目:
# - 全CRUD操作 (45分)
# - 権限別アクセス制御 (30分)
# - メール通知全パターン (20分)
# - データ整合性確認 (15分)
```

### 4️⃣ 推奨テスト（115分）
```bash
# チェックリスト確認
docs/uat/checklists/recommended.md

# 手動実行項目:
# - パフォーマンス監視 (30分)
# - SEO構造化データ検証 (20分)
# - エラーハンドリング確認 (25分)
# - 運用監視設定 (40分)
```

---

## 🎯 リリース判定基準

### ✅ 本番リリース可能
```
🔴 クリティカルテスト: 4/4 成功 (100%)
🟡 重要テスト: 進行中/未実施でも可
🟢 推奨テスト: 未実施でも可
```

### ⚠️ リリース延期
```
🔴 クリティカルテスト: 3/4 以下
```

### 🚨 緊急対応
```
- セキュリティテストで致命的問題発見
- 決済フローで金額エラー発見
- メール送信が完全に失敗
```

---

## 📊 結果記録

### 実行ログ保存先
```
docs/uat/logs/YYYYMMDD/
├── preflight-results.md
├── critical-results.md
├── important-results.md
├── recommended-results.md
└── screenshots/
    ├── auth-flow/
    ├── payment-flow/
    └── security-checks/
```

### レポート作成
```bash
# テンプレートコピー
cp docs/uat/templates/report.md docs/uat/logs/$(date +%Y%m%d)/final-report.md

# 結果記入後
# - 成功/失敗の判定
# - スクリーンショット添付
# - 問題点と対応策記載
```

---

## 🔄 npm スクリプト

```json
{
  "scripts": {
    "uat:preflight": "node scripts/uat/verify-env.mjs && node scripts/uat/verify-dns.mjs && node scripts/uat/verify-endpoints.mjs",
    "uat:critical": "echo '🔴 クリティカルテスト開始 - docs/uat/checklists/critical.md を確認してください'",
    "uat:important": "echo '🟡 重要テスト開始 - docs/uat/checklists/important.md を確認してください'",
    "uat:recommended": "echo '🟢 推奨テスト開始 - docs/uat/checklists/recommended.md を確認してください'"
  }
}
```

---

## ⚡ クイックスタート

### 1分で開始
```bash
# 1. 事前チェック実行
npm run uat:preflight

# 2. 問題なければクリティカルテスト開始
npm run uat:critical

# 3. チェックリストに従って手動テスト実行
open docs/uat/checklists/critical.md
```

### 5分でサンプル実行
```bash
# 基本フロー確認のみ
# 1. 新規登録: critical-test@luxucare.jp
# 2. 企業作成: "クリティカルテスト株式会社"
# 3. 決済テスト: 4242カード使用
# 4. 結果確認: subscription_status = 'active'
```

---

## 🆘 トラブルシューティング

### よくある問題
```bash
# 環境変数未設定
❌ Error: NEXTAUTH_URL is not defined
✅ Vercel Dashboard > Settings > Environment Variables で確認

# DNS解決失敗
❌ Error: getaddrinfo ENOTFOUND aiohub.jp
✅ ネットワーク接続とDNS設定確認

# API疎通失敗
❌ Error: 404 Not Found /api/stripe/webhook
✅ デプロイ状況とルーティング確認

# メール未受信
❌ 確認メールが届かない
✅ スパムフォルダ、Resend Dashboard確認

# 決済失敗
❌ Stripe: Your card was declined
✅ テストカード番号確認、Stripe Dashboard確認
```

### エスカレーション
```markdown
🔴 緊急: [技術責任者連絡先]
🟡 重要: [開発チーム連絡先]  
🟢 一般: [サポート連絡先]
```

---

## 📚 関連ドキュメント

- [要件定義書](../requirements/)
- [技術仕様書](../technical/)
- [運用手順書](../ops/)
- [セキュリティガイド](../security/)

---

**🎯 まずは `npm run uat:preflight` から開始し、段階的にテストを実行してください。**