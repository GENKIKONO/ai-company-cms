import { test, expect } from '@playwright/test';

/**
 * 企業作成フロー E2E テスト
 * 
 * 要件:
 * - 空の日付/電話/URL/住所を入れても 500 にならず、201で作成できる
 * - スラッグ重複は 409 + code:"UNIQUE_VIOLATION"
 * - 400/409/401 は { code, reason, details } で統一
 */
test.describe('企業作成フロー', () => {
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;

  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
    
    // 既存のクッキーをクリア
    await page.context().clearCookies();
  });

  test('正常な企業作成フロー（必須項目のみ）', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 企業作成ページに移動
    await page.goto('/organizations/new');
    await expect(page).toHaveURL(/.*\/organizations\/new/);

    // 3. 必須項目のみ入力
    const uniqueSlug = `test-org-${Date.now()}`;
    await page.fill('input[name="name"]', 'テスト企業');
    await page.fill('input[name="slug"]', uniqueSlug);

    // 4. フォーム送信
    await page.click('button[type="submit"]');

    // 5. 成功後の遷移確認（企業詳細ページまたはダッシュボード）
    await page.waitForURL(/.*\/(dashboard|organizations)/);
    
    // 6. 成功トーストの確認
    await expect(page.locator('text=企業が作成されました')).toBeVisible();
  });

  test('空フィールドを含む企業作成（500エラーにならない）', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 企業作成ページに移動
    await page.goto('/organizations/new');

    // 3. 必須項目 + 空のオプション項目を入力
    const uniqueSlug = `test-org-empty-${Date.now()}`;
    await page.fill('input[name="name"]', 'テスト企業（空フィールド付き）');
    await page.fill('input[name="slug"]', uniqueSlug);
    
    // 空の日付・URL・電話・住所を入力
    await page.fill('input[name="establishment_date"]', '');
    await page.fill('input[name="telephone"]', '');
    await page.fill('input[name="url"]', '');
    await page.fill('input[name="address_street"]', '');
    await page.fill('textarea[name="description"]', '');

    // 4. フォーム送信
    await page.click('button[type="submit"]');

    // 5. 500エラーにならず、正常に作成されることを確認
    await page.waitForURL(/.*\/(dashboard|organizations)/, { timeout: 10000 });
    await expect(page.locator('text=企業が作成されました')).toBeVisible();
    
    // 6. エラーメッセージが表示されていないことを確認
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=DATABASE_ERROR')).not.toBeVisible();
    await expect(page.locator('text=invalid input syntax')).not.toBeVisible();
  });

  test('スラッグ重複時の409エラー確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 企業作成ページに移動
    await page.goto('/organizations/new');

    // 3. 1つ目の企業を作成
    const duplicateSlug = `duplicate-test-${Date.now()}`;
    await page.fill('input[name="name"]', '最初のテスト企業');
    await page.fill('input[name="slug"]', duplicateSlug);
    await page.click('button[type="submit"]');
    
    // 4. 作成完了を待つ
    await page.waitForURL(/.*\/(dashboard|organizations)/);
    await expect(page.locator('text=企業が作成されました')).toBeVisible();

    // 5. 新しいブラウザコンテキストで2つ目の企業作成を試行
    const newPage = await page.context().newPage();
    await newPage.goto('/auth/login');
    await newPage.fill('input[name="email"]', testAdminEmail!);
    await newPage.fill('input[name="password"]', testAdminPassword!);
    await newPage.click('button[type="submit"]');
    await expect(newPage).toHaveURL(/.*\/dashboard/);

    await newPage.goto('/organizations/new');
    
    // 6. 同じスラッグで企業作成を試行
    await newPage.fill('input[name="name"]', '2つ目のテスト企業');
    await newPage.fill('input[name="slug"]', duplicateSlug);
    await newPage.click('button[type="submit"]');

    // 7. 重複エラーの確認
    await expect(newPage.locator('text=既に使用されています')).toBeVisible();
    await expect(newPage.locator('text=UNIQUE_VIOLATION')).toBeVisible();
    
    // 8. 409エラーが発生していることを確認（必要に応じてネットワークタブで確認）
    // ページが/organizations/newに留まることを確認
    await expect(newPage).toHaveURL(/.*\/organizations\/new/);

    await newPage.close();
  });

  test('バリデーションエラーの表示確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 企業作成ページに移動
    await page.goto('/organizations/new');

    // 3. 無効なデータで送信
    await page.fill('input[name="name"]', ''); // 名前空
    await page.fill('input[name="slug"]', 'ab'); // スラッグ短すぎ
    await page.click('button[type="submit"]');

    // 4. バリデーションエラーの確認
    await expect(page.locator('text=必須項目')).toBeVisible();
    await expect(page.locator('text=文字以上')).toBeVisible();
    
    // 5. ページが移動していないことを確認
    await expect(page).toHaveURL(/.*\/organizations\/new/);
  });

  test('未認証での企業作成アクセス制御', async ({ page }) => {
    // 1. 未認証で企業作成ページにアクセス
    await page.goto('/organizations/new');
    
    // 2. ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // 3. リダイレクトパラメータが含まれることを確認
    const url = page.url();
    expect(url).toContain('redirect=%2Forganizations%2Fnew');
  });
});

// エラー時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/org-creation-failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});