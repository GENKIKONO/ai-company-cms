import { test, expect } from '@playwright/test';

// 最小限のE2Eテスト: signin → dashboard フロー
test.describe('認証フロー（最小テスト）', () => {
  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
  });

  test('フロー: ホーム → サインイン → ダッシュボード', async ({ page }) => {
    // 1. ホームページから「ログイン」をクリック
    await page.click('text=ログイン');
    
    // 2. /auth/signin ページに遷移することを確認
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // 3. サインインフォームが表示されることを確認
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // 4. テストユーザーでサインイン（環境変数があれば実行）
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;
    
    if (testEmail && testPassword) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      // 5. ダッシュボードに遷移することを確認
      await expect(page).toHaveURL(/.*\/dashboard/);
      
      // 6. ダッシュボードの基本要素が表示されることを確認
      await expect(page.locator('text=ダッシュボード')).toBeVisible();
      
      // 7. 認証済みヘッダーが表示されることを確認
      await expect(page.locator('text=ログアウト')).toBeVisible();
    } else {
      console.log('テストユーザー認証情報がないため、UI表示テストのみ実行');
    }
  });

  test('未認証でダッシュボードにアクセスした場合の認証ガード', async ({ page }) => {
    // 1. 直接ダッシュボードにアクセス
    await page.goto('/dashboard');
    
    // 2. サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // 3. リダイレクトパラメータが含まれることを確認
    const url = page.url();
    expect(url).toContain('redirect=%2Fdashboard');
  });

  test('認証なしで企業作成ページにアクセスした場合の認証ガード', async ({ page }) => {
    // 1. 直接企業作成ページにアクセス
    await page.goto('/organizations/new');
    
    // 2. サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // 3. リダイレクトパラメータが含まれることを確認
    const url = page.url();
    expect(url).toContain('redirect=%2Forganizations%2Fnew');
  });

  test('ロゴクリックのルーティング確認', async ({ page }) => {
    // 1. ホームページでロゴクリック（未認証）
    await page.click('text=AIO Hub AI企業CMS');
    
    // 2. ホームページに留まることを確認
    await expect(page).toHaveURL('/');
    
    // 認証済みの場合はダッシュボードに遷移するが、
    // テスト環境によっては認証情報がないため、
    // このテストは未認証時の動作のみ確認
  });

  test('API認証ガードの確認', async ({ page }) => {
    // 1. 未認証で /api/my/organization にアクセス
    const response = await page.request.get('/api/my/organization');
    
    // 2. 401 Unauthorized が返されることを確認
    expect(response.status()).toBe(401);
  });

  test('基本的なページ遷移とリンク確認', async ({ page }) => {
    // 1. ホームページの基本要素確認
    await expect(page.locator('text=AIO Hub AI企業CMS')).toBeVisible();
    
    // 2. フッターリンクの確認（もし存在すれば）
    if (await page.locator('text=利用規約').isVisible()) {
      await page.click('text=利用規約');
      await expect(page).toHaveURL(/.*\/terms/);
      await page.goBack();
    }
    
    if (await page.locator('text=プライバシーポリシー').isVisible()) {
      await page.click('text=プライバシーポリシー');
      await expect(page).toHaveURL(/.*\/privacy/);
      await page.goBack();
    }
    
    // 3. 新規登録リンクの確認
    if (await page.locator('text=新規登録').isVisible()) {
      await page.click('text=新規登録');
      await expect(page).toHaveURL(/.*\/auth\/signup/);
      await page.goBack();
    }
  });
});

// エラー時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/auth-failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});