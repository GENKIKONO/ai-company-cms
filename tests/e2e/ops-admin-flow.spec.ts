import { test, expect } from '@playwright/test';

/**
 * 管理者運用認証フロー E2E テスト
 * 
 * 要件:
 * - /ops/login → 成功後 cookie が付与され /ops/probe が 200 かつ hasOpsCookie=true になる最小テスト
 * - 必須環境変数: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_ADMIN_OPS_PASSWORD
 */
test.describe('管理者運用認証フロー', () => {
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;
  const testOpsPassword = process.env.TEST_ADMIN_OPS_PASSWORD;

  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
    
    // 既存のクッキーをクリア
    await page.context().clearCookies();
  });

  test('管理者運用認証フロー: Supabase認証 → ops認証 → probe診断', async ({ page }) => {
    // 環境変数確認
    if (!testAdminEmail || !testAdminPassword || !testOpsPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_ADMIN_OPS_PASSWORD)');
    }

    // 1. Supabase認証: ログインページに移動
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // 2. 管理者メールアドレスでSupabase認証
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');

    // 3. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 4. 管理者運用ログインページに移動
    await page.goto('/ops/login');
    await expect(page).toHaveURL(/.*\/ops\/login/);

    // 5. 運用パスフレーズを入力
    await page.fill('input[name="passphrase"]', testOpsPassword!);
    await page.click('button[type="submit"]');

    // 6. /ops/probe にリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/ops\/probe/);

    // 7. ops_admin クッキーが設定されていることを確認
    const cookies = await page.context().cookies();
    const opsAdminCookie = cookies.find(cookie => cookie.name === 'ops_admin');
    expect(opsAdminCookie).toBeDefined();
    expect(opsAdminCookie?.value).toBe('1');
    expect(opsAdminCookie?.httpOnly).toBe(true);

    // 8. /ops/probe ページが正常に表示されることを確認
    await expect(page.locator('text=Ops Probe - 管理者認証診断')).toBeVisible();
    await expect(page.locator('text=全チェック通過')).toBeVisible();

    // 9. /api/ops/status API を呼び出して hasOpsCookie=true を確認
    const statusResponse = await page.request.get('/api/ops/status');
    expect(statusResponse.status()).toBe(200);
    
    const statusData = await statusResponse.json();
    expect(statusData.hasOpsCookie).toBe(true);
    expect(statusData.hasSession).toBe(true);
    expect(statusData.isAdminEmail).toBe(true);

    // 10. probe ページでのステータス表示確認
    await expect(page.locator('text=ops_adminクッキー有効')).toBeVisible();
    await expect(page.locator('text=セッション正常')).toBeVisible();
    await expect(page.locator('text=管理者メール確認済み')).toBeVisible();
  });

  test('未認証で /ops/probe にアクセスした場合の認証ガード', async ({ page }) => {
    // 1. 未認証で /ops/probe にアクセス
    await page.goto('/ops/probe');
    
    // 2. /ops/login にリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/ops\/login/);
  });

  test('不正パスフレーズでの認証失敗', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)');
    }

    // 1. Supabase認証を完了
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 管理者運用ログインページに移動
    await page.goto('/ops/login');
    
    // 3. 不正なパスフレーズを入力
    await page.fill('input[name="passphrase"]', 'wrong-passphrase');
    await page.click('button[type="submit"]');

    // 4. エラーメッセージが表示されることを確認
    await expect(page.locator('text=パスフレーズが正しくありません')).toBeVisible();
    
    // 5. /ops/login に留まることを確認
    await expect(page).toHaveURL(/.*\/ops\/login/);
  });

  test('非管理者ユーザーでの認証失敗', async ({ page }) => {
    // テスト用の非管理者アカウントがある場合のテスト
    const testUserEmail = process.env.TEST_USER_EMAIL;
    const testUserPassword = process.env.TEST_USER_PASSWORD;
    
    if (!testUserEmail || !testUserPassword || !testOpsPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_OPS_PASSWORD)');
    }

    // 1. 一般ユーザーでSupabase認証
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUserEmail!);
    await page.fill('input[name="password"]', testUserPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. 管理者運用ログインページに移動
    await page.goto('/ops/login');
    
    // 3. 正しいパスフレーズを入力（ただし非管理者）
    await page.fill('input[name="passphrase"]', testOpsPassword!);
    await page.click('button[type="submit"]');

    // 4. 管理者エラーメッセージが表示されることを確認
    await expect(page.locator('text=管理者アカウントではありません')).toBeVisible();
  });

  test('ops_admin クッキー削除機能', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword || !testOpsPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1-6. 管理者認証完了まで（前のテストと同様）
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/ops/login');
    await page.fill('input[name="passphrase"]', testOpsPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/ops\/probe/);

    // 7. クッキー削除ボタンをクリック
    await page.click('button:has-text("ops_admin クッキー削除")');
    
    // 8. ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL('/');

    // 9. ops_admin クッキーが削除されていることを確認
    const cookies = await page.context().cookies();
    const opsAdminCookie = cookies.find(cookie => cookie.name === 'ops_admin');
    expect(opsAdminCookie?.value).toBeFalsy();

    // 10. /ops/probe に再アクセスしてリダイレクトされることを確認
    await page.goto('/ops/probe');
    await expect(page).toHaveURL(/.*\/ops\/login/);
  });

  test('/api/ops/status API 直接アクセステスト', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. 管理者でSupabase認証のみ（ops認証なし）
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. /api/ops/status にアクセス（ops認証なし）
    const statusResponse = await page.request.get('/api/ops/status');
    expect(statusResponse.status()).toBe(200);
    
    const statusData = await statusResponse.json();
    expect(statusData.hasSession).toBe(true);
    expect(statusData.isAdminEmail).toBe(true);
    expect(statusData.hasOpsCookie).toBe(false); // ops認証していないためfalse
  });
});

// エラー時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/ops-admin-failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});