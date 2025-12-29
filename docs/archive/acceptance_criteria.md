> ⚠️ **ARCHIVED - 参照禁止**
>
> 本文書は旧アーキテクチャ（セルフサーブ＋代理店併存モデル）に基づく。
> **現行正本: `docs/core-architecture.md` を参照のこと。**
>
> アーカイブ日: 2024-12-25

---

# 受け入れ基準（Blocking条件）

## リリース可否判定

**重要**: 以下の基準をすべて満たさない限り、本番リリースは実施不可。1つでも未達の場合はブロッカーとして修正必須。

## 1. 企業作成フロー（セルフサーブ）

### 必須条件
- [ ] **500エラー禁止**: 全フローで500エラーが発生しないこと
- [ ] **適切なエラーレスポンス**: 409/400/401が適切に返却されること
- [ ] **成功時遷移**: 作成完了後に `/dashboard` へ正常遷移すること
- [ ] **データ整合性**: 作成された企業データがDBに正確に保存されること

### 詳細チェックポイント
```typescript
// テストケース
describe('企業作成フロー', () => {
  test('正常作成', async () => {
    // POST /api/my/organization
    // ステータス: 201
    // レスポンス: {data: {id, name, slug}, message}
    // 遷移: /dashboard
  });
  
  test('重複slug拒否', async () => {
    // 既存slugでPOST
    // ステータス: 409
    // エラーコード: 'CONFLICT'
  });
  
  test('バリデーションエラー', async () => {
    // 不正データでPOST
    // ステータス: 400
    // エラーコード: 'VALIDATION_ERROR'
  });
  
  test('未認証拒否', async () => {
    // 未ログインでPOST
    // ステータス: 401
    // エラーコード: 'UNAUTHORIZED'
  });
});
```

## 2. ナビゲーション規則

### 必須条件
- [ ] **ロゴクリック**: 常に `/` へ遷移すること
- [ ] **CTA分岐**: 
  - [ ] 未ログイン時「無料で始める」→ `/auth/login`
  - [ ] ログイン済み時「無料で始める」→ `/dashboard`
- [ ] **レスポンシブ対応**: 320px〜2560pxで崩れないこと
- [ ] **メール表示**: 狭幅で崩れない（省略＋メニュー格納）こと

### 検証方法
```bash
# ブラウザテスト
npm run test:e2e -- --grep "ナビゲーション"

# レスポンシブテスト  
npm run test:responsive

# 手動確認URL
echo "ロゴテスト: https://aiohub.jp (任意のページからロゴクリック)"
echo "CTA未ログイン: https://aiohub.jp (ログアウト状態で確認)"
echo "CTAログイン済み: https://aiohub.jp (ログイン状態で確認)"
```

## 3. 代理店機能（Partner）

### 必須条件
- [ ] **複数組織作成**: partnerロールで複数orgを作成できること
- [ ] **組織切替**: UI上で管理中組織を切り替えできること
- [ ] **権限分離**: 他のpartnerの組織にはアクセス不可であること
- [ ] **API権限**: `/api/organizations` エンドポイントでのみアクセス可能であること

### 検証シナリオ
```typescript
describe('代理店機能', () => {
  test('partner権限で複数組織管理', async () => {
    // 1. partnerユーザーでログイン
    // 2. POST /api/organizations で組織A作成
    // 3. POST /api/organizations で組織B作成  
    // 4. GET /api/organizations で両方取得確認
    // 5. 組織A・B個別にサービス/事例追加確認
  });
  
  test('権限分離確認', async () => {
    // 1. partnerA で組織1作成
    // 2. partnerB で組織2作成
    // 3. partnerA が組織2にアクセス → 403確認
    // 4. partnerB が組織1にアクセス → 403確認
  });
});
```

## 4. 公開ページ・JSON-LD

### 必須条件
- [ ] **JSON-LD構文**: 構文エラー0件であること
- [ ] **必須スキーマ**: Organization/Service/FAQ/Article/CaseStudy が正しく出力されること
- [ ] **構造化データテスト**: Google構造化データテストツールで検証PASSすること
- [ ] **OGP設定**: 適切なタイトル・説明・画像が設定されること

### 検証手順
```bash
# JSON-LD検証
curl -s "https://aiohub.jp/organizations/[slug]" | \
  grep -o '<script type="application/ld+json">.*</script>' | \
  jq . # 構文確認

# 構造化データテスト
echo "https://search.google.com/test/rich-results で各公開ページをテスト"

# 自動検証
npm run test:json-ld
```

## 5. システム診断（/ops/verify）

### 必須条件
- [ ] **ALL GREEN**: すべての診断項目が成功すること
- [ ] **レスポンス速度**: 診断完了まで30秒以内であること
- [ ] **エラー詳細**: 失敗時に具体的な修正指針が表示されること

### 診断項目詳細
```typescript
interface VerifyResult {
  status: 'ALL_GREEN' | 'PARTIAL' | 'CRITICAL';
  checks: {
    database_connection: 'PASS' | 'FAIL';
    authentication_system: 'PASS' | 'FAIL';
    selfserve_flow: 'PASS' | 'FAIL';
    partner_flow: 'PASS' | 'FAIL';
    api_consistency: 'PASS' | 'FAIL';
    stripe_integration: 'PASS' | 'FAIL' | 'DEGRADED';
    public_pages: 'PASS' | 'FAIL';
    json_ld_validation: 'PASS' | 'FAIL';
  };
  performance: {
    avg_response_time: number; // ms
    error_rate: number;        // %
  };
}
```

### 確認URL
```bash
# 管理者ログイン後
echo "診断実行: https://aiohub.jp/ops/verify"
echo "期待結果: status: 'ALL_GREEN'"
```

## 6. Stripe課金システム

### 必須条件（設定時）
- [ ] **Checkout動作**: `/api/billing/checkout` で正常にセッション作成できること
- [ ] **Webhook受信**: Stripe webhookが正常に処理されること  
- [ ] **Portal動作**: `/api/billing/portal` で顧客ポータルにアクセスできること
- [ ] **Degraded運用**: Stripe未設定時も基本機能が正常動作すること

### 検証手順
```bash
# Stripe設定確認
echo "環境変数確認:"
echo "STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:8}..."
echo "STRIPE_BASIC_PRICE_ID: ${STRIPE_BASIC_PRICE_ID}"

# E2E テスト（テストモード）
npm run test:stripe

# 手動確認
echo "1. /dashboard/billing でcheckout開始"
echo "2. Stripeテストカード (4242 4242 4242 4242) で決済"
echo "3. webhookログでsubscription.created確認"  
echo "4. customer portalでサブスクリプション管理確認"
```

## 7. 本番環境設定

### 必須条件
- [ ] **コミットバッジ非表示**: `SHOW_BUILD_BADGE=false` で非表示であること
- [ ] **HTTPS必須**: 全通信がHTTPS化されていること
- [ ] **環境変数**: 本番用の適切な値が設定されていること
- [ ] **エラー情報**: 本番では詳細なエラー情報が非表示であること

### 最終確認チェックリスト
```bash
# 本番設定確認
echo "VERCEL_ENV: production"
echo "SHOW_BUILD_BADGE: false"  
echo "NEXT_PUBLIC_APP_URL: https://aiohub.jp"

# セキュリティ確認
echo "認証: Supabase Auth + RLS"
echo "通信: HTTPS強制"
echo "権限: 適切な分離"

# パフォーマンス確認
echo "Lighthouse: Performance > 90"
echo "Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1"
```

## リリース判定基準

### ✅ リリース可能
- 上記7項目すべてが ✅ 完了
- `/ops/verify` で `ALL_GREEN`
- E2Eテストが100%パス
- パフォーマンステストクリア

### ❌ リリース不可（ブロッカー）
- いずれか1項目でも未達成
- `/ops/verify` で `CRITICAL` または重要項目が `FAIL`
- E2Eテストで重要シナリオが失敗
- セキュリティ問題の検出

### 🔶 条件付きリリース（要協議）
- Stripe機能のみ `DEGRADED`（基本機能は正常）
- 非クリティカルなパフォーマンス課題
- UXの軽微な問題（機能に影響なし）

---

**重要**: この受け入れ基準は妥協不可。品質確保のため、基準未達でのリリースは一切認めません。