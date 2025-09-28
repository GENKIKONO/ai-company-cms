# 本番確認手順（管理者向け）

## 即座確認用リンク集

### 🔍 システム診断（最優先）
```bash
# 総合ヘルスチェック（ALL GREEN必須）
https://aiohub.jp/ops/verify

# 詳細診断（パフォーマンス・外部連携確認）
https://aiohub.jp/ops/probe
```

### 🏠 基本機能確認
```bash
# トップページ（ロゴクリック→常にここに戻る）
https://aiohub.jp

# 企業一覧（公開企業の表示確認）
https://aiohub.jp/organizations

# 検索（企業・サービス検索）
https://aiohub.jp/search

# API ヘルスチェック
https://aiohub.jp/api/health
```

### 🔐 セルフサーブ導線確認
```bash
# 新規登録（未ログイン時）
https://aiohub.jp/auth/login

# 企業作成（ログイン後）
https://aiohub.jp/organizations/new

# ダッシュボード（作成後の管理画面）
https://aiohub.jp/dashboard

# 課金設定（Stripe連携）
https://aiohub.jp/dashboard/billing
```

### 🏢 代理店機能確認
```bash
# 代理店ログイン後の企業管理
https://aiohub.jp/dashboard/organizations

# API確認（partnerアクセスのみ）
curl -H "Authorization: Bearer {partner_token}" https://aiohub.jp/api/organizations
```

## 段階的確認手順（30分）

### Phase 1: システム基盤確認（5分）
1. **`/ops/verify`** → `ALL_GREEN` 確認
2. **`/api/health`** → `{"status":"ok"}` 確認  
3. **トップページ** → 正常表示確認
4. **ロゴクリック** → `/` に遷移することを確認

### Phase 2: セルフサーブフロー確認（15分）
1. **新規アカウント作成**
   ```bash
   1. /auth/login で新規登録
   2. メール認証完了
   3. /organizations/new への自動遷移確認
   ```

2. **企業作成フロー**
   ```bash
   1. 企業情報入力（name, slug, description）
   2. 作成ボタンクリック → 201成功確認
   3. /dashboard への遷移確認
   4. 公開ページ /organizations/{slug} の確認
   ```

3. **JSON-LD確認**
   ```bash
   # ブラウザ開発者ツールで確認
   view-source:https://aiohub.jp/organizations/{作成したslug}
   # <script type="application/ld+json"> の存在確認
   ```

### Phase 3: ナビゲーション規則確認（5分）
1. **CTA分岐**
   ```bash
   未ログイン時:「無料で始める」→ /auth/login
   ログイン済み:「無料で始める」→ /dashboard
   ```

2. **レスポンシブ確認**
   ```bash
   PC: メールアドレス表示 + サインアウトボタン
   モバイル: アバターメニュー（ドロップダウン）
   ```

### Phase 4: 課金システム確認（5分）
1. **Stripe Checkout**
   ```bash
   1. /dashboard/billing でcheckout開始
   2. テストカード (4242 4242 4242 4242) で決済
   3. 決済完了後のリダイレクト確認
   ```

2. **Customer Portal**
   ```bash
   1. 決済完了後、Portal リンククリック
   2. Stripe管理画面での操作確認
   ```

## 異常時の対応手順

### 🚨 Critical（即座対応）
- `/ops/verify` で `CRITICAL` または重要項目 `FAIL`
- API で 500エラー発生
- 認証システム停止

#### 対応アクション
```bash
# 1. Slack #emergency チャンネル確認
# 2. /ops/probe で詳細診断
# 3. 必要に応じてロールバック実施
vercel --prod --env=production-rollback
```

### ⚠️ Warning（4時間以内対応）
- API成功率 < 95%
- パフォーマンス大幅劣化
- Stripe決済機能部分停止

#### 対応アクション
```bash
# 1. 影響範囲特定
# 2. Degraded運用モード確認
# 3. ユーザー向け告知検討
```

### 💡 Info（24時間以内対応）
- 軽微なUX問題
- 非クリティカルな外部連携エラー

## 環境設定確認

### 本番環境必須設定
```bash
VERCEL_ENV=production
SHOW_BUILD_BADGE=false          # ✅ コミットバッジ非表示
NEXT_PUBLIC_APP_URL=https://aiohub.jp
STRIPE_SECRET_KEY=sk_live_...   # ✅ 本番Stripe鍵
STRIPE_BASIC_PRICE_ID=price_... # ✅ ¥5,000/月プラン
```

### 機能フラグ確認
```bash
ENABLE_PARTNER_FLOW=true        # ✅ 代理店機能有効
ENABLE_SELF_SERVE=true          # ✅ セルフサーブ有効
```

## トラブルシューティング

### よくある問題

#### 1. 企業作成で500エラー
```bash
原因: RLSポリシーまたはバリデーションエラー
確認: /ops/probe → database.rls_policies_status
対処: supabase migration status 確認
```

#### 2. Stripe決済失敗
```bash
原因: webhook設定またはキー設定
確認: Stripe Dashboard → Webhooks status
対処: 環境変数 STRIPE_* 再確認
```

#### 3. ロゴクリックが/dashboardに遷移
```bash
原因: ナビゲーション規則違反
確認: src/components/header/AuthHeader.tsx
対処: href="/" に修正必須
```

#### 4. JSON-LD構文エラー
```bash
原因: 構造化データの形式不正
確認: Google 構造化データテストツール
対処: src/lib/json-ld/ の修正
```

## 成功基準チェックリスト

### リリース可否判定
- [ ] `/ops/verify` で `ALL_GREEN`
- [ ] 新規セルフサーブ登録→企業作成→公開フロー正常
- [ ] ロゴクリック→常に `/` 遷移
- [ ] CTA分岐正常（未ログイン→登録、ログイン済み→ダッシュボード）
- [ ] 代理店機能100%維持
- [ ] JSON-LD構文エラー0件
- [ ] Stripe決済（テストカード）正常完了
- [ ] 本番環境設定適切（コミットバッジ非表示等）

### パフォーマンス基準
- [ ] LCP < 2.5秒
- [ ] API応答時間 P95 < 2秒
- [ ] エラー率 < 1%

---

**重要**: この手順に従って本番確認を実施し、すべての項目クリア後にリリース完了とする。基準未達の場合は即座に修正またはロールバックを実施してください。