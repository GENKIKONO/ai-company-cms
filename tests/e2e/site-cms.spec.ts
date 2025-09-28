import { test, expect } from '@playwright/test';

/**
 * サイト文言CMS E2E テスト
 * 
 * 要件:
 * - /ops/site にアクセスでき、入力→保存→トップに即反映（リロードで確認）
 * - RLS/ガードで管理者以外は書き込み不可（403/401）
 */
test.describe('サイト文言CMS', () => {
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;
  const testUserEmail = process.env.TEST_USER_EMAIL;
  const testUserPassword = process.env.TEST_USER_PASSWORD;

  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
    
    // 既存のクッキーをクリア
    await page.context().clearCookies();
  });

  test('管理者でのサイト文言編集・保存・反映確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)');
    }

    // 1. 管理者でログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス
    await page.goto('/ops/site');
    await expect(page).toHaveURL(/.*\/ops\/site/);

    // 3. ページが正常に表示されることを確認
    await expect(page.locator('text=サイト文言管理')).toBeVisible();
    await expect(page.locator('text=メインタイトル')).toBeVisible();
    await expect(page.locator('text=サブタイトル')).toBeVisible();
    await expect(page.locator('text=代表メッセージ')).toBeVisible();

    // 4. 現在の設定値を記録
    const originalTitle = await page.locator('input[name="hero_title"]').inputValue();
    const originalSubtitle = await page.locator('textarea[name="hero_subtitle"]').inputValue();
    const originalMessage = await page.locator('textarea[name="representative_message"]').inputValue();

    // 5. テスト用の新しい値を入力
    const testTimestamp = Date.now();
    const testTitle = `テスト用タイトル ${testTimestamp}`;
    const testSubtitle = `テスト用サブタイトル ${testTimestamp}`;
    const testMessage = `テスト用代表メッセージ ${testTimestamp}`;

    await page.fill('input[name="hero_title"]', testTitle);
    await page.fill('textarea[name="hero_subtitle"]', testSubtitle);
    await page.fill('textarea[name="representative_message"]', testMessage);

    // 6. リアルタイムプレビュー確認
    await expect(page.locator('#preview-hero-title')).toHaveText(testTitle);
    await expect(page.locator('#preview-hero-subtitle')).toHaveText(testSubtitle);
    await expect(page.locator('#preview-representative-message')).toHaveText(testMessage);

    // 7. 保存ボタンをクリック
    await page.click('button:has-text("保存")');

    // 8. 保存成功のトーストを確認
    await expect(page.locator('text=保存完了')).toBeVisible();

    // 9. 新しいタブでトップページを開いて反映確認
    const topPage = await page.context().newPage();
    await topPage.goto('/');

    // 10. 変更された文言がトップページに反映されていることを確認
    await expect(topPage.locator('h1')).toContainText(testTitle);
    await expect(topPage.locator('text=' + testSubtitle)).toBeVisible();
    await expect(topPage.locator('text=' + testMessage)).toBeVisible();

    // 11. 元の設定に戻す（クリーンアップ）
    await page.fill('input[name="hero_title"]', originalTitle);
    await page.fill('textarea[name="hero_subtitle"]', originalSubtitle);
    await page.fill('textarea[name="representative_message"]', originalMessage);
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=保存完了')).toBeVisible();

    await topPage.close();
  });

  test('非管理者でのサイト文言管理ページアクセス制限', async ({ page }) => {
    if (!testUserEmail || !testUserPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_USER_EMAIL, TEST_USER_PASSWORD)');
    }

    // 1. 一般ユーザーでログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUserEmail!);
    await page.fill('input[name="password"]', testUserPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス試行
    await page.goto('/ops/site');

    // 3. ダッシュボードにリダイレクトされることを確認（管理者以外はアクセス不可）
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('未認証でのサイト文言管理ページアクセス制限', async ({ page }) => {
    // 1. 未認証でサイト文言管理ページにアクセス
    await page.goto('/ops/site');

    // 2. ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // 3. リダイレクトパラメータが含まれることを確認
    const url = page.url();
    expect(url).toContain('redirect=%2Fops%2Fsite');
  });

  test('デフォルトに戻す機能の確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. 管理者でログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス
    await page.goto('/ops/site');

    // 3. テスト用の値を入力
    const testTitle = 'テスト用タイトル（リセット確認）';
    await page.fill('input[name="hero_title"]', testTitle);
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=保存完了')).toBeVisible();

    // 4. デフォルトに戻すボタンをクリック
    await page.click('button:has-text("デフォルトに戻す")');

    // 5. 確認ダイアログで OK をクリック
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('デフォルトに戻してもよろしいですか');
      await dialog.accept();
    });

    // 6. リセット成功のトーストを確認
    await expect(page.locator('text=リセット完了')).toBeVisible();

    // 7. デフォルト値に戻っていることを確認
    const resetTitle = await page.locator('input[name="hero_title"]').inputValue();
    expect(resetTitle).toBe('AIO Hub AI企業CMS');

    // 8. プレビューも更新されていることを確認
    await expect(page.locator('#preview-hero-title')).toHaveText('AIO Hub AI企業CMS');
  });

  test('実際のページを確認ボタンの動作', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. 管理者でログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス
    await page.goto('/ops/site');

    // 3. 「実際のページを確認」ボタンの動作確認
    const pagePromise = page.context().waitForEvent('page');
    await page.click('button:has-text("実際のページを確認")');

    // 4. 新しいタブでトップページが開かれることを確認
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe(new URL('/', page.url()).href);

    await newPage.close();
  });

  test('プレビューボタンの動作確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. 管理者でログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス
    await page.goto('/ops/site');

    // 3. 「プレビュー」ボタンの動作確認
    const pagePromise = page.context().waitForEvent('page');
    await page.click('a:has-text("プレビュー")');

    // 4. 新しいタブでトップページが開かれることを確認
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe(new URL('/', page.url()).href);

    await newPage.close();
  });

  test('文字数制限の確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. 管理者でログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. サイト文言管理ページにアクセス
    await page.goto('/ops/site');

    // 3. 最大文字数の制限を確認
    const heroTitleInput = page.locator('input[name="hero_title"]');
    const heroSubtitleTextarea = page.locator('textarea[name="hero_subtitle"]');
    const representativeMessageTextarea = page.locator('textarea[name="representative_message"]');

    // 4. maxlength属性の確認
    await expect(heroTitleInput).toHaveAttribute('maxlength', '255');
    await expect(heroSubtitleTextarea).toHaveAttribute('maxlength', '500');
    await expect(representativeMessageTextarea).toHaveAttribute('maxlength', '2000');

    // 5. ヘルプテキストの確認
    await expect(page.locator('text=最大255文字')).toBeVisible();
    await expect(page.locator('text=最大500文字')).toBeVisible();
    await expect(page.locator('text=最大2000文字')).toBeVisible();
  });
});

// エラー時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/site-cms-failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});