# 🔬 AIO Hub UAT (User Acceptance Testing) ドキュメント

## 🚨 【実行前必読】安全なUAT実行のための重要な警告

```
⚠️ 本番環境での安全なテストのため、以下を必ず確認してください:

🔴 データ保護: 本番データの変更・削除は絶対禁止
💳 決済テスト: Stripeテストカード (4242...) のみ使用
📧 メール送信: test-uat@luxucare.jp など専用アドレスのみ
🗃️ ログ記録: 認証情報・個人情報のマスキング必須
🔧 設定変更: 本番環境設定の変更は一切禁止

詳細: docs/uat/uat_final.md の "やってはいけないこと" を必読
```

## 📋 目次

### 📖 ドキュメント
- [🎯 **UAT最終版手順書**](./uat_final.md) - 完全版テスト手順（本文）
- [🚀 **本番UAT実行ガイド**](./uat_execution.md) - 本番環境での公式実行手順
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

### 🔄 実行方法
- [▶️ **GitHub Actions手動実行**](#️-github-actions-を手動で強制実行する) - CI環境での実行方法
- [💻 **ローカル実行**](#-ローカルでのuat実行開発者qa向け) - ローカル環境での実行方法

### 📚 リハーサル・サンプル
- [🎭 **リハーサル実行シナリオ**](./rehearsal-scenarios.md) - 本番前の2段階リハーサル手順
- [🎯 **QA担当者向けガイド**](./qa-guide.md) - リハーサル手順とトラブルシューティング
- [📊 **レポートサンプル**](./examples/) - 成功・失敗レポートとPRコメントサンプル

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
    "uat:env-check": "node scripts/uat/verify-env.mjs",
    "uat:dns-check": "node scripts/uat/verify-dns.mjs",
    "uat:endpoint-check": "node scripts/uat/verify-endpoints.mjs",
    "uat:critical": "echo '🔴 クリティカルテスト開始 - docs/uat/checklists/critical.md を確認してください'",
    "uat:important": "echo '🟡 重要テスト開始 - docs/uat/checklists/important.md を確認してください'",
    "uat:recommended": "echo '🟢 推奨テスト開始 - docs/uat/checklists/recommended.md を確認してください'",
    "uat:report": "node scripts/uat/generate-report.mjs",
    "uat:full": "npm run uat:preflight && npm run uat:critical && npm run uat:important && npm run uat:recommended && npm run uat:report"
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

## ▶️ GitHub Actions を手動で強制実行する

### 手動実行方法
1. **GitHub のリポジトリを開く** → **Actions** タブをクリック
2. **左メニューから「UAT Preflight Checks」** を選択（ワークフロー名）
3. **右側の「Run workflow」** をクリック
4. **ブランチ選択**: `main`（または検証対象ブランチ）を選択 → **「Run workflow」**
5. **実行後確認**: ジョブ詳細の **Artifacts** に各検証ログと自動生成レポートが保存されます
6. **PR連携**: PR に紐づいている場合は、PR スレッドに自動コメント（判定・次アクション）が投稿されます

### トラブルシューティング
```bash
# 手動実行が表示されない場合
✅ .github/workflows/uat-preflight.yml が workflow_dispatch を含むことを確認
✅ リポジトリの Settings > Actions > General で "Allow all actions" が有効か確認

# 実行失敗時
✅ Actions > 該当ワークフロー > Artifacts > "uat-preflight-logs" をダウンロード
✅ ログファイルを確認して問題を特定
✅ 問題修正後に再度「Run workflow」で実行
```

---

## 💻 ローカルでのUAT実行（開発者／QA向け）

**前提条件**: Node.js 18+ / npm または pnpm / リポジトリ直下で実行

### 1. 事前チェック（環境変数・DNS・主要エンドポイント）
```bash
npm run uat:preflight

# 内部で以下を順に実行：
# npm run uat:env-check
# npm run uat:dns-check  
# npm run uat:endpoint-check
```

### 2. クリティカル → 重要 → 推奨（ガイド表示）
```bash
npm run uat:critical
npm run uat:important
npm run uat:recommended
```

### 3. レポート生成（アーティファクト風まとめ）
```bash
npm run uat:report
# 出力先: docs/uat/logs/YYYYMMDD/uat-report.md
```

### 4. フルフロー一括実行
```bash
npm run uat:full
# preflight → critical → important → recommended → report
```

### 補足事項
- **エラーログ**: `scripts/uat/*.mjs` 実行時の標準出力に集約されます
- **クリティカルテストの実ブラウザ操作**: `docs/uat/uat_final.md` の手順に従ってください
- **Stripe/Resend の接続確認**: `scripts/uat/stripe-test.md` / `resend-test.md` を参照

### 📎 関連ドキュメント
- [`docs/uat/uat_final.md`](./uat_final.md)（手順書・判定基準）
- [`docs/uat/qa-guide.md`](./qa-guide.md)（QA向けガイド）
- [`docs/uat/examples/`](./examples/)（レポート／PRコメントのサンプル）
- [`scripts/uat/`](../../scripts/uat/)（検証スクリプト群）

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

## 🔄 プルリクエスト作成手順

### UAT用プルリクエストの作成
```bash
# 1. ブランチが正しいことを確認
git branch --show-current
# chore/uat-final であることを確認

# 2. PR作成用リンク
echo "以下のリンクでPRを作成:"
echo "https://github.com/GENKIKONO/ai-company-cms/pull/new/chore/uat-final"
```

### PR本文の作成
```bash
# docs/uat/PR_BODY.md の内容をコピペして使用
open docs/uat/PR_BODY.md

# または以下のテンプレートを使用:
# .github/PULL_REQUEST_TEMPLATE/uat.md
```

### CI自動実行の確認
```bash
# PR作成後、GitHub Actions で以下が自動実行される:
# 1. UAT Preflight Checks ワークフロー
# 2. 環境変数・DNS・API疎通の検証
# 3. 結果がPRコメントに自動投稿

# Actions タブで実行状況を確認:
echo "GitHub > Actions > UAT Preflight Checks"
```

### PR承認基準
```markdown
✅ **マージ可能条件:**
- CI での事前チェックが全てPASS
- レビュー承認（必要に応じて）
- コンフリクトなし

✅ **マージ後の作業:**
1. クリティカルテスト実行: `npm run uat:critical`
2. 結果記録: `docs/uat/logs/YYYYMMDD/`
3. リリース判定: クリティカル 4/4 成功でリリース可能
```

### トラブルシューティング
```bash
# CI失敗時
❌ 問題: UAT Preflight Checks が失敗
✅ 対処: 
1. Actions > Artifacts > uat-preflight-logs をダウンロード
2. ログファイルで詳細確認
3. 問題修正後にプッシュして再実行

# マージできない時
❌ 問題: merge conflicts
✅ 対処:
1. git pull origin main
2. コンフリクト解決
3. git push で更新
```

---

## 📚 関連ドキュメント

- [要件定義書](../requirements/)
- [技術仕様書](../technical/)
- [運用手順書](../ops/)
- [セキュリティガイド](../security/)

---

**🎯 まずは `npm run uat:preflight` から開始し、段階的にテストを実行してください。**