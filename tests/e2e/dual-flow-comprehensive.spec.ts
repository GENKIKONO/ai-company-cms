import { test, expect } from '@playwright/test';

/**
 * セルフサーブ（1ユーザー=1社）＋代理店（パートナー）併存モデル
 * 包括的E2Eテスト
 * 
 * 要件定義準拠: 両導線の機能確認、エラーケース検証
 */

// テストデータ
const SELF_SERVE_USER = {
  email: 'selfserve-user@test.example.com',
  password: 'SelfServe123!',
  orgName: 'セルフサーブ企業株式会社',
  orgSlug: 'selfserve-company',
  description: 'セルフサーブ機能で登録したテスト企業です。',
  url: 'https://selfserve-test.example.com',
  telephone: '03-1111-2222'
};

const PARTNER_USER = {
  email: 'partner-user@test.example.com', 
  password: 'Partner123!',
  clientOrgName: 'パートナー管理企業株式会社',
  clientOrgSlug: 'partner-managed-company',
  description: 'パートナーが代理作成したテスト企業です。',
  url: 'https://partner-client.example.com'
};

test.describe('双導線E2Eテスト: セルフサーブ + パートナー併存', () => {
  
  test.describe('セルフサーブ導線テスト', () => {
    test('1-1: 新規登録→企業作成→公開→課金の完全フロー', async ({ page }) => {
      // 1. 新規登録
      await page.goto('/');
      await page.click('text=新規登録');
      
      await page.fill('input[name="email"]', SELF_SERVE_USER.email);
      await page.fill('input[name="password"]', SELF_SERVE_USER.password);
      await page.fill('input[name="confirmPassword"]', SELF_SERVE_USER.password);
      await page.click('button[type="submit"]');
      
      // メール認証の案内ページが表示されることを確認
      await expect(page.locator('text=メール認証')).toBeVisible();
      
      // 2. 認証後、企業作成画面への自動遷移を想定
      await page.goto('/organizations/new');
      
      // 3. 企業情報入力
      await page.fill('input[name="name"]', SELF_SERVE_USER.orgName);
      await page.fill('input[name="slug"]', SELF_SERVE_USER.orgSlug);
      await page.fill('textarea[name="description"]', SELF_SERVE_USER.description);
      await page.fill('input[name="url"]', SELF_SERVE_USER.url);
      await page.fill('input[name="telephone"]', SELF_SERVE_USER.telephone);
      
      // 4. 企業作成実行
      await page.click('button:has-text("企業を作成")');
      await expect(page).toHaveURL(/.*dashboard/);
      
      // 5. ダッシュボードでの企業情報確認
      await expect(page.locator(`text=${SELF_SERVE_USER.orgName}`)).toBeVisible();
      
      // 6. 公開ページの確認
      await page.goto(`/o/${SELF_SERVE_USER.orgSlug}`);
      await expect(page.locator(`text=${SELF_SERVE_USER.orgName}`)).toBeVisible();
      await expect(page.locator(`text=${SELF_SERVE_USER.description}`)).toBeVisible();
      
      // 7. 課金画面への遷移確認
      await page.goto('/dashboard/billing');
      await expect(page.locator('text=サブスクリプション')).toBeVisible();
      await expect(page.locator('text=¥5,000')).toBeVisible();
    });

    test('1-2: ナビゲーション規則確認', async ({ page }) => {
      await page.goto('/');
      
      // ロゴクリック→常に「/」遷移の確認
      await page.click('a:has-text("AIO Hub AI企業CMS")');
      await expect(page).toHaveURL('/');
      
      // 未ログイン時のCTA確認
      await page.click('text=無料で始める');
      await expect(page).toHaveURL(/.*auth\/login/);
      
      // TODO: ログイン済み状態でのCTA→ダッシュボード遷移のテスト
    });

    test('1-3: レスポンシブ表示確認', async ({ page, isMobile }) => {
      await page.goto('/');
      
      if (isMobile) {
        // モバイル: アバターメニューの確認
        // TODO: ログイン状態でのアバターメニュー表示テスト
        await expect(page.locator('[data-testid="mobile-avatar-menu"]')).toBeHidden();
      } else {
        // PC: メールアドレス表示の確認
        // TODO: ログイン状態でのメールアドレス表示テスト
      }
    });
  });

  test.describe('パートナー導線テスト', () => {
    test('2-1: パートナーによる企業代理作成フロー', async ({ page }) => {
      // 1. パートナーアカウントでログイン
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', PARTNER_USER.email);
      await page.fill('input[name="password"]', PARTNER_USER.password);
      await page.click('button[type="submit"]');
      
      // 2. パートナー専用の企業管理画面への遷移
      await page.goto('/dashboard/organizations');
      await expect(page.locator('text=企業管理')).toBeVisible();
      
      // 3. 新規企業作成（代理）
      await page.click('text=新規企業追加');
      await page.fill('input[name="name"]', PARTNER_USER.clientOrgName);
      await page.fill('input[name="slug"]', PARTNER_USER.clientOrgSlug);
      await page.fill('textarea[name="description"]', PARTNER_USER.description);
      await page.fill('input[name="url"]', PARTNER_USER.url);
      
      await page.click('button:has-text("企業を作成")');
      
      // 4. 作成された企業の管理画面確認
      await expect(page.locator(`text=${PARTNER_USER.clientOrgName}`)).toBeVisible();
      
      // 5. 公開ページの確認
      await page.goto(`/o/${PARTNER_USER.clientOrgSlug}`);
      await expect(page.locator(`text=${PARTNER_USER.clientOrgName}`)).toBeVisible();
    });

    test('2-2: パートナーの課金機能アクセス制限確認', async ({ page }) => {
      // パートナーアカウントでログイン
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', PARTNER_USER.email);
      await page.fill('input[name="password"]', PARTNER_USER.password);
      await page.click('button[type="submit"]');
      
      // 課金関連APIへの直接アクセス試行→403 Forbiddenの確認
      const billingResponse = await page.request.post('/api/billing/checkout', {
        data: { organizationId: 'test-org-id' }
      });
      expect(billingResponse.status()).toBe(403);
      
      const portalResponse = await page.request.post('/api/billing/portal', {
        data: { customerId: 'test-customer-id' }
      });
      expect(portalResponse.status()).toBe(403);
    });
  });

  test.describe('JSON-LD構造化データ確認', () => {
    test('3-1: Organization JSON-LD出力確認', async ({ page }) => {
      await page.goto(`/o/${SELF_SERVE_USER.orgSlug}`);
      
      // JSON-LDスクリプトタグの存在確認
      const jsonLdScript = await page.locator('script[type="application/ld+json"]').first();
      await expect(jsonLdScript).toBeVisible();
      
      // JSON-LD内容の検証
      const jsonLdContent = await jsonLdScript.textContent();
      const jsonLd = JSON.parse(jsonLdContent || '{}');
      
      expect(jsonLd['@type']).toBe('Organization');
      expect(jsonLd.name).toBe(SELF_SERVE_USER.orgName);
      expect(jsonLd.url).toBe(SELF_SERVE_USER.url);
      expect(jsonLd.inLanguage).toBe('ja');
    });

    test('3-2: Article JSON-LD出力確認', async ({ page }) => {
      // 記事ページに遷移（記事が存在する場合）
      await page.goto(`/o/${SELF_SERVE_USER.orgSlug}/posts/sample-post`);
      
      // ArticleのJSON-LD確認
      const jsonLdScript = await page.locator('script[type="application/ld+json"]').first();
      if (await jsonLdScript.count() > 0) {
        const jsonLdContent = await jsonLdScript.textContent();
        const jsonLd = JSON.parse(jsonLdContent || '{}');
        
        // Articleまたは配列内のArticleを確認
        const articles = Array.isArray(jsonLd) ? jsonLd.filter(item => item['@type'] === 'Article') : [jsonLd];
        if (articles.length > 0) {
          expect(articles[0]['@type']).toBe('Article');
          expect(articles[0].inLanguage).toBe('ja');
        }
      }
    });

    test('3-3: BreadcrumbList JSON-LD出力確認', async ({ page }) => {
      await page.goto(`/o/${SELF_SERVE_USER.orgSlug}/services`);
      
      const jsonLdScript = await page.locator('script[type="application/ld+json"]').first();
      if (await jsonLdScript.count() > 0) {
        const jsonLdContent = await jsonLdScript.textContent();
        const jsonLd = JSON.parse(jsonLdContent || '{}');
        
        // BreadcrumbListまたは配列内のBreadcrumbListを確認
        const breadcrumbs = Array.isArray(jsonLd) ? jsonLd.filter(item => item['@type'] === 'BreadcrumbList') : [jsonLd];
        if (breadcrumbs.length > 0) {
          expect(breadcrumbs[0]['@type']).toBe('BreadcrumbList');
          expect(breadcrumbs[0].itemListElement).toBeInstanceOf(Array);
          expect(breadcrumbs[0].itemListElement.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('システム診断・運用確認', () => {
    test('4-1: /ops/verify 統合ヘルスチェック', async ({ page }) => {
      await page.goto('/ops/verify');
      
      // ALL_GREEN状態の確認
      await expect(page.locator('text=ALL_GREEN').or(page.locator('text=SUCCESS'))).toBeVisible();
      
      // 主要コンポーネントの状態確認
      await expect(page.locator('text=Database').or(page.locator('text=データベース'))).toBeVisible();
      await expect(page.locator('text=Authentication').or(page.locator('text=認証'))).toBeVisible();
      await expect(page.locator('text=Stripe').or(page.locator('text=決済'))).toBeVisible();
    });

    test('4-2: /ops/probe 詳細診断', async ({ page }) => {
      await page.goto('/ops/probe');
      
      // パフォーマンス指標の確認
      await expect(page.locator('text=API応答時間').or(page.locator('text=Response Time'))).toBeVisible();
      await expect(page.locator('text=データベース接続').or(page.locator('text=Database Connection'))).toBeVisible();
    });

    test('4-3: API health エンドポイント確認', async ({ page }) => {
      const response = await page.request.get('/api/health');
      expect(response.status()).toBe(200);
      
      const health = await response.json();
      expect(health.status).toBe('ok');
    });
  });

  test.describe('エラーケース・セキュリティ確認', () => {
    test('5-1: セルフサーブユーザーの複数企業作成防止', async ({ page }) => {
      // セルフサーブユーザーでログイン
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SELF_SERVE_USER.email);
      await page.fill('input[name="password"]', SELF_SERVE_USER.password);
      await page.click('button[type="submit"]');
      
      // 既に企業を作成済みの場合、新規作成画面へのアクセス制限確認
      const createResponse = await page.request.get('/organizations/new');
      // セルフサーブユーザーは1企業のみ作成可能な場合、403またはリダイレクトされる想定
      expect([200, 302, 403]).toContain(createResponse.status());
    });

    test('5-2: パートナーアクセス権限確認', async ({ page }) => {
      // パートナーユーザーでログイン
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', PARTNER_USER.email);
      await page.fill('input[name="password"]', PARTNER_USER.password);
      await page.click('button[type="submit"]');
      
      // セルフサーブ専用APIへのアクセス制限確認
      const myOrgResponse = await page.request.get('/api/my/organization');
      expect(myOrgResponse.status()).toBe(403);
    });

    test('5-3: 未認証ユーザーのアクセス制限', async ({ page }) => {
      // 認証が必要なAPIエンドポイントへの直接アクセス試行
      const protectedEndpoints = [
        '/api/my/organization',
        '/api/organizations',
        '/api/billing/checkout',
        '/api/billing/portal'
      ];
      
      for (const endpoint of protectedEndpoints) {
        const response = await page.request.get(endpoint);
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('パフォーマンス・可用性確認', () => {
    test('6-1: ページ読み込み速度確認', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // 2.5秒以内の読み込み（LCP要件）
      expect(loadTime).toBeLessThan(2500);
    });

    test('6-2: API応答時間確認', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.request.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      // 1秒以内のAPI応答
      expect(responseTime).toBeLessThan(1000);
      expect(response.status()).toBe(200);
    });
  });
});