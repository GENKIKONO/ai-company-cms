# 🚀 UAT実行ガイド - コピペ実行マニュアル

## ⚠️ 【重要】実行前の安全確認

```
🚨 本番環境での安全なテスト実行のため、必ず以下を確認:

❌ やってはいけないこと:
- 本番データベースでDELETE/UPDATEの実行
- 実際のクレジットカード番号の使用（4242カードのみ）
- 実在顧客へのテストメール送信
- 認証情報・個人情報をログファイルに記録
- 本番環境設定（Vercel/Supabase）の変更

✅ 安全な実行方法:
- テスト専用データ・アカウントのみ使用
- コマンド実行前に必ず内容確認
- ログには機微情報をマスキングして記録
- 疑問がある場合は実行前に開発チームに確認

詳細: docs/uat/uat_final.md の "やってはいけないこと" セクション参照
```

## 📋 実行前の準備

### 必要な権限・アクセス
- [ ] 本番環境 https://aiohub.jp への管理者アクセス
- [ ] Supabase Dashboard アクセス
- [ ] Stripe Dashboard アクセス（テストモード）
- [ ] Resend Dashboard アクセス
- [ ] 実際に受信可能なメールアドレス

### 実行環境確認
```bash
# プロジェクトディレクトリに移動
cd /path/to/luxucare-project

# 正しいブランチ確認
git branch --show-current

# Node.js バージョン確認
node --version  # v18.x.x 以上

# パッケージ更新確認
npm install
```

---

## 🚨 Phase 1: 事前チェック（必須 - 5分）

> **⚠️ この段階で失敗があれば即座に修正必要**

### 1-1: 環境変数確認
```bash
# 環境変数存在チェック（値は表示されません）
node scripts/uat/verify-env.mjs

# または手動確認
echo "以下の環境変数が設定されているか確認:"
echo "- NEXTAUTH_URL"
echo "- NEXTAUTH_SECRET"  
echo "- STRIPE_SECRET_KEY (sk_live_...)"
echo "- STRIPE_WEBHOOK_SECRET (whsec_...)"
echo "- RESEND_API_KEY (re_...)"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

### 1-2: DNS・SSL確認
```bash
# DNS解決とSSL証明書確認
node scripts/uat/verify-dns.mjs

# または手動確認
curl -I https://aiohub.jp
# Status: 200 OK または 3xx リダイレクト
# SSL証明書エラーがないことを確認
```

### 1-3: API疎通確認
```bash
# 主要エンドポイント疎通チェック
node scripts/uat/verify-endpoints.mjs

# または手動確認
echo "=== エンドポイント疎通確認 ==="
curl -s -o /dev/null -w "%{http_code} " https://aiohub.jp/ && echo "トップページ"
curl -s -o /dev/null -w "%{http_code} " https://aiohub.jp/auth/login && echo "ログイン"
curl -s -o /dev/null -w "%{http_code} " https://aiohub.jp/organizations && echo "企業一覧"
curl -s -o /dev/null -w "%{http_code} " https://aiohub.jp/search && echo "検索"
curl -s -o /dev/null -w "%{http_code} " https://aiohub.jp/api/stripe/webhook && echo "Stripe Webhook"
```

### 1-4: Supabase RLS確認
```sql
-- Supabase SQLエディタで実行
-- RLS有効化状況確認
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations', 'services', 'faqs', 'case_studies')
ORDER BY tablename;

-- 結果: 全テーブルでrls_enabled = true であることを確認
```

### ✅ Phase 1 完了基準
```bash
# 全てのチェックがPASSすること
echo "✅ 環境変数: 存在確認済み"
echo "✅ DNS/SSL: 正常応答確認済み"  
echo "✅ API疎通: 全エンドポイント応答確認済み"
echo "✅ RLS: 全テーブル有効化確認済み"
echo "→ Phase 2 (クリティカルテスト) 開始可能"
```

---

## 🔴 Phase 2: クリティカルテスト（必須 - 40分）

> **⚠️ 全項目成功まで本番リリース禁止**

### 2-1: 基本認証フロー（10分）
```bash
# テスト用メールアドレス（実際に受信可能なもの）
export TEST_EMAIL="critical-test-$(date +%s)@luxucare.jp"  
export TEST_PASSWORD="CriticalTest123!"

echo "=== 認証フローテスト開始 ==="
echo "使用メール: $TEST_EMAIL"
echo "使用パスワード: $TEST_PASSWORD"
```

#### 手動実行手順:
```markdown
1. ブラウザで https://aiohub.jp/auth/signup を開く
2. 上記メール・パスワードで新規登録
3. **確認**: 「確認メールを送信しました」表示
4. メール受信確認（5分以内）
5. 確認リンククリック → /auth/confirm ページ
6. **確認**: 「確認完了」→ダッシュボードリダイレクト
7. ログアウト→ログイン→正常アクセス確認

✅ 成功基準:
- メール送信: 30秒以内
- ページ遷移: 3秒以内  
- セッション維持: 24時間有効
```

#### 結果記録:
```bash
# ログ作成
mkdir -p docs/uat/logs/$(date +%Y%m%d)/screenshots/auth-flow
echo "$(date): 認証フローテスト開始" >> docs/uat/logs/$(date +%Y%m%d)/critical-results.md

# スクリーンショット保存場所
echo "スクリーンショット保存: docs/uat/logs/$(date +%Y%m%d)/screenshots/auth-flow/"
```

### 2-2: 企業作成→公開フロー（15分）
```bash
echo "=== 企業作成・公開フローテスト開始 ==="

# テストデータ
export ORG_NAME="クリティカルテスト株式会社"
export ORG_DESC="本番環境での基本動作確認用企業"
export ORG_URL="https://critical-test.example.com"
export ORG_TEL="03-0000-0000"
export ORG_REGION="東京都"
export ORG_LOCALITY="千代田区"

echo "企業名: $ORG_NAME"
echo "URL: $ORG_URL"
```

#### 手動実行手順:
```markdown
1. ダッシュボードで「新規企業追加」クリック
2. 上記データ入力→保存
3. **確認**: 企業詳細ページ表示
4. 「公開管理」タブ→法的同意チェック
5. 「公開する」ボタンクリック
6. **確認**: /o/[slug] で公開ページ表示
7. **確認**: JSON-LD出力（開発者ツール > Elements）

✅ 成功基準:
- データ保存: エラーなし
- 公開ページ: 3秒以内表示
- JSON-LD: 適切な構造化データ出力
```

#### JSON-LD確認コマンド:
```javascript
// ブラウザ開発者ツール > Console で実行
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, index) => {
  console.log(`Schema ${index + 1}:`, JSON.parse(script.textContent));
});

// 確認項目:
// - @context: "https://schema.org"
// - @type: "Organization"  
// - name, url, description 存在
// - 空値が適切に除外されている
```

### 2-3: 決済→サブスクリプション（10分）
```bash
echo "=== 決済フローテスト開始 ==="

# Stripe テストカード情報
export STRIPE_TEST_CARD="4242 4242 4242 4242"
export STRIPE_TEST_EXPIRY="12/34"
export STRIPE_TEST_CVC="123"
export TEST_AMOUNT="100円"  # 最小課金額

echo "テストカード: $STRIPE_TEST_CARD"
echo "テスト金額: $TEST_AMOUNT"
```

#### 手動実行手順:
```markdown
1. 企業詳細→「サブスクリプション管理」
2. 「初期費用なしプラン」選択
3. Stripe Checkout ページ遷移確認
4. 上記テストカード情報入力
5. **確認**: 決済完了→ダッシュボードリダイレクト
6. **確認**: subscription_status = 'active'

✅ 成功基準:
- 決済処理: 60秒以内完了
- Webhook: 30秒以内DB更新
- ステータス: 'active'変更確認
```

#### DB確認コマンド:
```sql
-- Supabase SQLエディタで実行
-- ユーザーのサブスクリプション状態確認
SELECT 
  u.email,
  u.subscription_status,
  u.stripe_customer_id,
  u.updated_at
FROM users u 
WHERE u.email = '[テストメールアドレス]';

-- 組織のサブスクリプション確認
SELECT 
  o.name,
  o.subscription_status,
  o.stripe_subscription_id,
  o.updated_at
FROM organizations o
JOIN users u ON o.user_id = u.id
WHERE u.email = '[テストメールアドレス]';

-- 期待結果: subscription_status = 'active'
```

### 2-4: セキュリティ基本確認（5分）
```bash
echo "=== セキュリティ基本確認開始 ==="
```

#### RLS動作確認:
```sql
-- Supabase SQLエディタで実行
-- 他ユーザーデータへのアクセス試行
SELECT * FROM organizations WHERE user_id != auth.uid();
-- 期待結果: 0 rows（アクセス拒否）

-- 権限外操作の試行
DELETE FROM organizations WHERE user_id != auth.uid();
-- 期待結果: エラーまたは0 rows affected
```

#### XSS・URL改ざん確認:
```markdown
1. 企業作成で悪意あるスクリプト入力:
   - name: <script>alert('XSS')</script>
   - description: <img src="x" onerror="alert('XSS')">
   → **確認**: スクリプト実行されず、適切エスケープ

2. URL改ざん試行:
   - /dashboard/organizations/[他社ID] にアクセス
   → **確認**: 403エラーまたはリダイレクト

3. 未ログイン状態でアクセス:
   - /dashboard にアクセス
   → **確認**: /auth/login にリダイレクト
```

### ✅ Phase 2 完了確認
```bash
echo "=== クリティカルテスト結果確認 ==="
echo "[ ] 基本認証フロー: 成功"
echo "[ ] 企業作成→公開: 成功"  
echo "[ ] 決済→サブスクリプション: 成功"
echo "[ ] セキュリティ基本確認: 成功"
echo ""
echo "全て成功の場合: 本番リリース可能 ✅"
echo "1つでも失敗: 即座に修正対応 ❌"
```

---

## 🟡 Phase 3: 重要テスト（1週間以内 - 110分）

### 3-1: 全CRUD操作確認（45分）
```bash
echo "=== CRUD操作テスト開始 ==="

# テストデータ定義
export SERVICE_NAME="AIデータ分析サービス"
export FAQ_QUESTION="導入期間はどのくらいですか？"
export CASE_TITLE="製造業A社の業務効率化"
```

#### サービス管理テスト:
```bash
# テストサービスデータ
cat << EOF > /tmp/service-test-data.json
{
  "name": "AIデータ分析サービス",
  "summary": "機械学習を活用したビジネスデータ分析サービス",
  "features": ["予測分析", "データビジュアル", "レポート自動生成"],
  "category": "データ分析",
  "price": "月額30,000円〜"
}
EOF

echo "サービステストデータ作成完了: /tmp/service-test-data.json"
```

#### FAQ管理テスト:
```bash
# テストFAQデータ
cat << EOF > /tmp/faq-test-data.json
[
  {"q": "導入期間はどのくらいですか？", "a": "通常2-3週間です。"},
  {"q": "サポート体制は？", "a": "平日9-18時で対応します。"},
  {"q": "料金プランは？", "a": "月額制で3つのプランがあります。"}
]
EOF

echo "FAQテストデータ作成完了: /tmp/faq-test-data.json"
```

#### 導入事例テスト:
```bash
# テスト導入事例データ
cat << EOF > /tmp/case-study-test-data.json
{
  "title": "製造業A社の業務効率化",
  "clientType": "製造業（従業員500名）",
  "problem": "手作業での品質管理による工数増加",
  "solution": "AI画像解析による自動品質判定システム導入",
  "outcome": "品質管理工数を60%削減、不良品発見率向上",
  "metrics": {"工数削減": "60%", "精度向上": "95%"}
}
EOF

echo "導入事例テストデータ作成完了: /tmp/case-study-test-data.json"
```

### 3-2: 権限別アクセス制御（30分）
```bash
echo "=== 権限別アクセス制御テスト開始 ==="

# テストユーザー情報
echo "テストユーザー作成が必要:"
echo "- admin@luxucare-test.jp / TestAdmin123!"
echo "- editor@luxucare-test.jp / TestEditor123!"
echo "- viewer@luxucare-test.jp / TestViewer123!"
```

#### 権限テスト用SQL:
```sql
-- Supabase Auth で上記ユーザー作成後、以下を実行
-- 権限設定（UUIDは実際の値に置換）

INSERT INTO public.users (id, email, role, name) VALUES
('[ADMIN_UUID]', 'admin@luxucare-test.jp', 'admin', '管理者テスト'),
('[EDITOR_UUID]', 'editor@luxucare-test.jp', 'editor', '編集者テスト'),
('[VIEWER_UUID]', 'viewer@luxucare-test.jp', 'viewer', '閲覧者テスト')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name;
```

### 3-3: メール通知全パターン（20分）
```bash
echo "=== メール通知テスト開始 ==="

# Resend テスト用データ
export RESEND_TEST_EMAIL="uat-test@luxucare.jp"
export RESEND_FROM="noreply@aiohub.jp"
```

#### ウェルカムメールテスト:
```bash
# 新規登録でウェルカムメール確認
echo "新規ユーザー登録→ウェルカムメール受信確認:"
echo "- Subject: AIO Hubへようこそ"
echo "- From: noreply@aiohub.jp"
echo "- 本文: ユーザー名、サービス概要、ダッシュボードリンク"
```

#### 決済失敗メールテスト:
```bash
# Stripe テスト用失敗カード
export STRIPE_FAIL_CARD="4000 0000 0000 0002"

echo "決済失敗カード: $STRIPE_FAIL_CARD"
echo "期待動作: 決済失敗→30秒以内に警告メール送信"
```

### 3-4: データ整合性確認（15分）
```bash
echo "=== データ整合性確認開始 ==="
```

#### 関連データ削除テスト:
```sql
-- 企業削除時の関連データ処理確認
-- 1. テスト企業にサービス・FAQ・事例を作成
-- 2. 企業削除実行  
-- 3. 以下SQLで関連データ削除確認

SELECT 
  (SELECT COUNT(*) FROM services WHERE organization_id = '[削除企業ID]') as services_count,
  (SELECT COUNT(*) FROM faqs WHERE organization_id = '[削除企業ID]') as faqs_count,
  (SELECT COUNT(*) FROM case_studies WHERE organization_id = '[削除企業ID]') as case_studies_count;

-- 期待結果: 全て0（完全削除確認）
```

---

## 🟢 Phase 4: 推奨テスト（1ヶ月以内 - 115分）

### 4-1: パフォーマンス監視（30分）
```bash
echo "=== パフォーマンス監視設定開始 ==="

# Lighthouse CI実行
npx lighthouse-ci https://aiohub.jp --output=json --output-path=./lighthouse-report.json

# Core Web Vitals確認
echo "目標値:"
echo "- LCP: < 2.5秒"
echo "- FID: < 100ms"  
echo "- CLS: < 0.1"
echo "- FCP: < 1.8秒"
echo "- TTI: < 3.8秒"
```

#### 測定対象ページ:
```bash
# 主要ページのパフォーマンス測定
PAGES=(
  "https://aiohub.jp/"
  "https://aiohub.jp/organizations"
  "https://aiohub.jp/search"
  "https://aiohub.jp/o/sample-org"
)

for page in "${PAGES[@]}"; do
  echo "測定中: $page"
  npx lighthouse-ci "$page" --output=json --output-path="./lighthouse-${page//\//-}.json"
done
```

### 4-2: SEO構造化データ検証（20分）
```bash
echo "=== SEO構造化データ検証開始 ==="

# Google Rich Results Test
curl -X POST "https://searchconsole.googleapis.com/v1/urlTestingTools/richResults:run" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://aiohub.jp/o/sample-org",
    "userAgent": "DESKTOP"
  }'
```

#### JSON-LD検証スクリプト:
```javascript
// ブラウザコンソールで実行
const schemas = [];
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, index) => {
  try {
    const data = JSON.parse(script.textContent);
    schemas.push(data);
    console.log(`✅ Schema ${index + 1}:`, data);
  } catch (e) {
    console.error(`❌ Schema ${index + 1} parsing error:`, e);
  }
});

// 検証項目
console.log('=== 検証結果 ===');
console.log('Organization schema:', schemas.find(s => s['@type'] === 'Organization') ? '✅' : '❌');
console.log('Service schema:', schemas.find(s => s['@type'] === 'Service') ? '✅' : '❌');
console.log('FAQ schema:', schemas.find(s => s['@type'] === 'FAQPage') ? '✅' : '❌');
```

### 4-3: エラーハンドリング確認（25分）
```bash
echo "=== エラーハンドリング確認開始 ==="

# ネットワークエラーシミュレーション
echo "Chrome DevTools > Network > Offline でテスト:"
echo "- オフライン時の適切なエラー表示"
echo "- API遅延時のローディング状態"
echo "- 画像読み込み失敗時のフォールバック"
```

#### 異常データ入力テスト:
```bash
# テストケース定義
cat << EOF > /tmp/error-test-cases.json
[
  {"field": "email", "value": "invalid-email", "expect": "適切なエラーメッセージ"},
  {"field": "telephone", "value": "abc", "expect": "数字のみ入力要求"},
  {"field": "url", "value": "not-a-url", "expect": "URL形式エラー"},
  {"field": "description", "value": "$(printf 'a%.0s' {1..5001})", "expect": "文字数制限エラー"}
]
EOF

echo "エラーテストケース作成完了: /tmp/error-test-cases.json"
```

### 4-4: 運用監視設定（40分）
```bash
echo "=== 運用監視設定確認開始 ==="

# Vercel Analytics確認
echo "Vercel Dashboard > Project > Analytics で確認:"
echo "- [ ] ページビュー追跡有効"
echo "- [ ] パフォーマンス監視有効"
echo "- [ ] 地域別アクセス分析"
echo "- [ ] デバイス別分析"
echo "- [ ] アラート設定（異常時通知）"

# Supabase監視確認
echo "Supabase Dashboard > Settings > General で確認:"
echo "- [ ] 使用量アラート設定（80%で通知）"
echo "- [ ] バックアップ設定確認"
echo "- [ ] ログ保持期間設定"
echo "- [ ] API制限値確認"

# Stripe監視確認
echo "Stripe Dashboard > Developers > Webhooks で確認:"
echo "- [ ] Webhook配信成功率 > 95%"
echo "- [ ] 失敗時の再試行設定"
echo "- [ ] 異常取引の監視ルール"

# Resend監視確認
echo "Resend Dashboard > Analytics で確認:"
echo "- [ ] 配信成功率 > 98%"
echo "- [ ] バウンス率 < 2%"
echo "- [ ] スパム報告率 < 0.1%"
```

---

## 📊 最終結果レポート

### レポート作成
```bash
# 最終レポート生成
REPORT_DATE=$(date +%Y%m%d)
REPORT_DIR="docs/uat/logs/$REPORT_DATE"

mkdir -p "$REPORT_DIR"
cp docs/uat/templates/report.md "$REPORT_DIR/final-report.md"

echo "=== UAT最終結果 ==="
echo "実行日: $(date)"
echo "レポート保存先: $REPORT_DIR/final-report.md"
echo ""
echo "クリティカルテスト: [結果を記入]"
echo "重要テスト: [結果を記入]"
echo "推奨テスト: [結果を記入]"
echo ""
echo "総合判定: [リリース可/延期/緊急対応]"
```

### 結果共有
```bash
# 結果ファイル一覧
echo "共有すべきファイル:"
echo "- $REPORT_DIR/final-report.md"
echo "- $REPORT_DIR/screenshots/"
echo "- ./lighthouse-*.json"
echo "- /tmp/*-test-data.json"
```

---

## 🆘 緊急時対応

### 即座に実行すべきコマンド
```bash
# サービス停止が必要な場合
echo "🚨 緊急停止手順:"
echo "1. Vercel Dashboard > Deployments > Rollback"
echo "2. DNS切り替え（メンテナンスページ）"
echo "3. 関係者への緊急連絡"

# ログ収集
echo "📊 障害ログ収集:"
echo "- Vercel Function Logs"
echo "- Supabase Logs & Metrics"
echo "- Stripe Event Logs"
echo "- Browser DevTools Console/Network"
```

---

## 📈 実行とログ保存

### ローカル実行例
```bash
# 全段階一括実行（推奨）
npm run uat:full

# 段階別実行
npm run uat:preflight && npm run uat:critical

# ログ付き実行（手動）
DATE=$(date +%Y%m%d)
LOG_DIR="docs/uat/logs/$DATE"
mkdir -p "$LOG_DIR"

npm run uat:preflight > "$LOG_DIR/preflight.log" 2>&1
npm run uat:critical > "$LOG_DIR/critical.log" 2>&1
npm run uat:important > "$LOG_DIR/important.log" 2>&1
npm run uat:recommended > "$LOG_DIR/recommended.log" 2>&1
```

### ログ保存先
```
docs/uat/logs/
├── YYYYMMDD/              # 実行日別ディレクトリ（例：20241222/）
│   ├── preflight.log     # 事前チェック結果
│   ├── critical.log      # クリティカルテスト結果
│   ├── important.log     # 重要テスト結果
│   ├── recommended.log   # 推奨テスト結果
│   └── summary.log       # 総合結果サマリー
└── README.md             # ログ管理ガイド
```

### CI/CD実行ログ
```bash
# GitHub Actions実行後にアーティファクトをダウンロード
# Actions タブ > UAT Preflight Checks > Artifacts > uat-preflight-logs

# ダウンロード後の展開
unzip uat-preflight-logs.zip -d ./ci-logs/
ls ./ci-logs/
# -> execution.log, env-check.log, dns-check.log, endpoint-check.log, summary.log
```

### ログ分析コマンド
```bash
# 成功率の確認
find docs/uat/logs/ -name "summary.log" -exec grep "PASS" {} \; | wc -l

# 失敗パターンの分析
find docs/uat/logs/ -name "*.log" -exec grep "FAIL\|ERROR" {} \; | sort | uniq -c

# 最新実行結果の確認
LATEST_DIR=$(ls -1 docs/uat/logs/ | grep "^[0-9]" | sort -r | head -1)
echo "最新実行結果: docs/uat/logs/$LATEST_DIR/"
```

---

## 📚 関連ドキュメント

- [📋 **UAT README**](./README.md) - 全体概要とナビゲーション
- [🚀 **本番UAT実行ガイド**](./uat_execution.md) - 本番環境での公式実行手順
- [🎭 **リハーサル実行シナリオ**](./rehearsal-scenarios.md) - 本番前2段階リハーサル手順
- [📱 **GitHub Actions手動実行**](./README.md#️-github-actions-を手動で強制実行する) - CI環境での実行方法
- [🎯 **QA向けリハーサルガイド**](./qa-guide.md) - 本番運用前のリハーサル手順
- [📊 **レポート・PRコメントサンプル**](./examples/) - 実行結果のサンプル

---

**🎯 まずは `npm run uat:preflight` から開始し、段階的に全テストを完了してください。**