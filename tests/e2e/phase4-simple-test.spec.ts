/**
 * フェーズ4: 最小スモークテスト
 * 基本的な認証ガードとAPIアクセス制御の確認
 */

import { test, expect } from '@playwright/test';

test.describe('フェーズ4 最小スモークテスト', () => {

  test('未認証でダッシュボードアクセス → サインインリダイレクト確認', async ({ page }) => {
    // 未認証でダッシュボードに直接アクセス
    await page.goto('/dashboard');
    
    // サインインページまたはログインページにリダイレクトされることを確認
    // Note: プロジェクトによってパスが異なる場合があります（/auth/signin, /auth/login等）
    await expect(page).toHaveURL(/.*\/auth\/(signin|login)/, { timeout: 10000 });
    
    // リダイレクトパラメータが含まれることを確認
    expect(page.url()).toMatch(/redirect.*dashboard/);

    console.log('✅ 認証ガード: ダッシュボードアクセス制御確認完了');
  });

  test('未認証で /api/me アクセス → 401確認', async ({ page }) => {
    // 未認証時の /api/me は401を返すことを確認
    const response = await page.request.get('/api/me');
    expect(response.status()).toBe(401);

    console.log('✅ API認証ガード: /api/me アクセス制御確認完了');
  });

  test('未認証で validateOrgAccess API群 → 401確認', async ({ page }) => {
    // validateOrgAccess統一済みAPI群が認証を要求することを確認
    const unifiedApis = [
      '/api/my/faqs?organizationId=test',
      '/api/my/materials?organizationId=test',
      '/api/my/qa/entries?organizationId=test'
    ];

    for (const api of unifiedApis) {
      const response = await page.request.get(api);
      expect(response.status()).toBe(401);
      console.log(`✅ ${api}: 401 (未認証)`);
    }

    console.log('✅ API認証ガード: validateOrgAccess統一API群確認完了');
  });

  test('基本ページアクセス → 正常表示確認', async ({ page }) => {
    // ホームページが正常に表示されることを確認
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main, [role="main"], body').first();
    await expect(main).toBeVisible({ timeout: 5000 });

    console.log('✅ 基本ページアクセス: ホームページ表示確認完了');
  });

  test('サインインページアクセス → フォーム表示確認', async ({ page }) => {
    // サインインページに直接アクセス
    await page.goto('/auth/signin');
    
    // メールとパスワードの入力フィールドが存在することを確認
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // ログインボタンが存在することを確認
    const loginButton = page.locator('button[type="submit"], button:has-text("ログイン"), button:has-text("サインイン")');
    await expect(loginButton.first()).toBeVisible();

    console.log('✅ サインインページ: フォーム要素確認完了');
  });
});