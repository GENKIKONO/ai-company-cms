# テスト計画

## テスト戦略

### テスト種別と責務

| テスト種別 | 目的 | 実行タイミング | 自動化度 |
|------------|------|---------------|----------|
| 単体テスト | 関数・コンポーネント単位 | 開発時・CI | 100% |
| 統合テスト | API・DB連携 | PR・CI | 100% |
| E2Eテスト | ユーザーシナリオ | PR・本番前 | 80% |
| スモークテスト | 基本機能確認 | デプロイ後 | 100% |
| 負荷テスト | パフォーマンス | リリース前 | 手動 |
| 回帰テスト | 既存機能保護 | メジャーリリース | 100% |

## E2Eテスト（Playwright）

### セルフサーブ導線テスト

#### test/e2e/selfserve-flow.spec.ts
```typescript
describe('セルフサーブ導線', () => {
  test('新規登録〜企業作成〜公開フロー', async ({ page }) => {
    // 1. トップページアクセス
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('AIO Hub');
    
    // 2. 新規登録
    await page.click('text=無料で始める');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 3. 企業作成
    await expect(page).toHaveURL('/organizations/new');
    await page.fill('[name="name"]', 'テスト企業株式会社');
    await page.fill('[name="slug"]', 'test-company');
    await page.fill('[name="description"]', 'テスト用企業です');
    await page.click('button:has-text("作成")');
    
    // 4. ダッシュボード遷移確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('ダッシュボード');
    
    // 5. 公開ページ確認
    await page.goto('/organizations/test-company');
    await expect(page.locator('h1')).toContainText('テスト企業株式会社');
    
    // 6. JSON-LD確認
    const jsonLd = await page.locator('script[type="application/ld+json"]').innerHTML();
    const parsed = JSON.parse(jsonLd);
    expect(parsed['@type']).toBe('Organization');
    expect(parsed.name).toBe('テスト企業株式会社');
  });
  
  test('ログイン済みCTA分岐', async ({ page }) => {
    // 事前条件: ログイン済み状態
    await loginAsUser(page, 'user@example.com');
    
    // トップページのCTAクリック
    await page.goto('/');
    await page.click('text=無料で始める');
    
    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('企業重複作成拒否', async ({ page }) => {
    await loginAsUser(page, 'user@example.com');
    
    // 既に企業を持つユーザーで新規作成試行
    await page.goto('/organizations/new');
    await page.fill('[name="name"]', '新しい企業');
    await page.fill('[name="slug"]', 'new-company');
    await page.click('button:has-text("作成")');
    
    // 409エラーメッセージ確認
    await expect(page.locator('[role="alert"]')).toContainText('既に企業を作成済みです');
  });
});
```

### 代理店導線テスト

#### test/e2e/partner-flow.spec.ts
```typescript
describe('代理店導線', () => {
  test('複数組織管理フロー', async ({ page }) => {
    // 1. partnerユーザーでログイン
    await loginAsPartner(page, 'partner@example.com');
    
    // 2. 組織一覧表示
    await page.goto('/dashboard/organizations');
    await expect(page.locator('h1')).toContainText('管理組織一覧');
    
    // 3. 新規組織作成
    await page.click('text=新規組織作成');
    await page.fill('[name="name"]', '顧客企業A');
    await page.fill('[name="slug"]', 'client-a');
    await page.click('button:has-text("作成")');
    
    // 4. 組織リストに追加確認
    await expect(page.locator('[data-testid="org-list"]')).toContainText('顧客企業A');
    
    // 5. 組織切り替え
    await page.click('[data-testid="org-selector"]');
    await page.click('text=顧客企業A');
    await expect(page.locator('[data-testid="current-org"]')).toContainText('顧客企業A');
    
    // 6. サービス追加
    await page.goto('/dashboard/services');
    await page.click('text=新規サービス追加');
    await page.fill('[name="name"]', 'Webサイト制作');
    await page.fill('[name="description"]', '企業サイトの制作サービス');
    await page.click('button:has-text("保存")');
    
    // 7. 公開ページ確認
    await page.goto('/organizations/client-a');
    await expect(page.locator('text=Webサイト制作')).toBeVisible();
  });
  
  test('権限分離確認', async ({ page }) => {
    // 1. partnerA で組織作成
    await loginAsPartner(page, 'partnera@example.com');
    await createOrganization(page, '企業A', 'company-a');
    
    // 2. partnerB でログイン
    await page.goto('/auth/logout');
    await loginAsPartner(page, 'partnerb@example.com');
    
    // 3. 企業Aへの直接アクセス試行
    const response = await page.goto('/organizations/company-a/edit');
    expect(response?.status()).toBe(403);
    
    // 4. API直接アクセス試行
    const apiResponse = await page.request.get('/api/organizations/company-a');
    expect(apiResponse.status()).toBe(403);
  });
});
```

### ナビゲーション・UXテスト

#### test/e2e/navigation.spec.ts
```typescript
describe('ナビゲーション規則', () => {
  test('ロゴクリック常時トップ遷移', async ({ page }) => {
    const testPages = [
      '/organizations',
      '/search',
      '/organizations/test-company',
      '/dashboard',
      '/dashboard/billing'
    ];
    
    for (const testPage of testPages) {
      await page.goto(testPage);
      await page.click('[data-testid="logo"]');
      await expect(page).toHaveURL('/');
    }
  });
  
  test('レスポンシブ対応', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },  // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // ヘッダー表示確認
      await expect(page.locator('header')).toBeVisible();
      
      // メニューアクセス確認（モバイルではハンバーガー）
      if (viewport.width < 768) {
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      }
    }
  });
  
  test('メール表示崩れ防止', async ({ page }) => {
    await loginAsUser(page, 'very.long.email.address@example.com');
    await page.goto('/');
    
    // 狭幅でメール表示エリア確認
    await page.setViewportSize({ width: 320, height: 568 });
    
    // オーバーフロー発生しないことを確認
    const emailElement = page.locator('[data-testid="user-email"]');
    const boundingBox = await emailElement.boundingBox();
    expect(boundingBox?.width).toBeLessThan(200); // 200px以内
  });
});
```

## スモークテスト

### 本番デプロイ後の即座チェック

#### scripts/smoke-test.js
```javascript
const { chromium } = require('playwright');

async function runSmokeTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const tests = [
    {
      name: 'トップページ表示',
      url: 'https://aiohub.jp',
      expects: ['AIO Hub', 'h1']
    },
    {
      name: '企業一覧表示', 
      url: 'https://aiohub.jp/organizations',
      expects: ['企業一覧', '.organization-card']
    },
    {
      name: 'ヘルスチェック',
      url: 'https://aiohub.jp/api/health',
      expects: ['"status":"ok"']
    },
    {
      name: '診断エンドポイント',
      url: 'https://aiohub.jp/api/diag/session',
      expects: ['"session"']
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await page.goto(test.url);
      
      if (response.status() !== 200) {
        throw new Error(`HTTP ${response.status()}`);
      }
      
      for (const expectation of test.expects) {
        if (expectation.startsWith('.') || expectation.startsWith('[')) {
          await page.waitForSelector(expectation, { timeout: 5000 });
        } else {
          await page.waitForFunction(
            (text) => document.body.textContent.includes(text),
            expectation,
            { timeout: 5000 }
          );
        }
      }
      
      console.log(`✅ ${test.name} - PASS`);
    } catch (error) {
      console.error(`❌ ${test.name} - FAIL: ${error.message}`);
      process.exit(1);
    }
  }
  
  await browser.close();
  console.log('🎉 All smoke tests passed!');
}

runSmokeTests().catch(console.error);
```

## CI/CD統合テスト

### GitHub Actions設定

#### .github/workflows/test.yml
```yaml
name: Test Suite

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL_TEST }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_TEST }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 本番疎通チェック手順

### 管理者向け検証リンク集

#### 即座確認用URLs（ブックマーク推奨）
```bash
# システム診断
echo "🔍 総合診断: https://aiohub.jp/ops/verify"
echo "🔍 詳細診断: https://aiohub.jp/ops/probe"

# 基本機能確認
echo "🏠 トップページ: https://aiohub.jp"
echo "🏢 企業一覧: https://aiohub.jp/organizations"
echo "🔍 検索: https://aiohub.jp/search"

# 認証・ダッシュボード
echo "🔐 ログイン: https://aiohub.jp/auth/login"
echo "📊 ダッシュボード: https://aiohub.jp/dashboard"
echo "➕ 企業作成: https://aiohub.jp/organizations/new"

# 課金システム
echo "💳 課金設定: https://aiohub.jp/dashboard/billing"

# API確認
echo "🔌 ヘルス: https://aiohub.jp/api/health"
echo "🔌 セッション: https://aiohub.jp/api/diag/session"

# JSON-LD確認（サンプル）
echo "📋 構造化データ: view-source:https://aiohub.jp/organizations/[slug]"
```

### 段階的確認手順

#### Phase 1: システム基盤（5分）
1. `/ops/verify` でALL GREEN確認
2. `/api/health` で基本稼働確認
3. トップページ・企業一覧の表示確認

#### Phase 2: セルフサーブ機能（10分）
1. 新規アカウント作成テスト
2. 企業作成フロー実行
3. ダッシュボード操作確認
4. 公開ページ確認

#### Phase 3: 代理店機能（10分）
1. partner権限ログイン
2. 複数組織作成・管理
3. 権限分離確認

#### Phase 4: 課金・外部連携（5分）
1. Stripe checkoutテスト（テストカード）
2. JSON-LD構文確認
3. パフォーマンス簡易確認

---

**実行責務**: すべてのテストは自動実行可能にし、CI/CDで品質を担保する。手動テストは最小限に留める。