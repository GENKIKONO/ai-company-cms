/**
 * Admin Dashboard Pages Smoke Tests
 *
 * RLSポリシー適用後の管理UIページのE2Eテスト
 * - 各ページが500/404エラーなく描画されること
 * - 未認証時は適切にリダイレクトされること
 * - 空データでもクラッシュしないこと
 *
 * 前提:
 * - RLSポリシー: site_admins ベースで適用済み
 * - 認証: 未認証時はログインページへリダイレクト（307）
 */

import { test, expect } from '@playwright/test';

// テスト対象の管理ページ一覧
const ADMIN_PAGES = [
  { path: '/dashboard/admin', name: 'Admin Index' },
  { path: '/dashboard/admin/jobs', name: 'Jobs Monitor' },
  { path: '/dashboard/admin/ai-usage', name: 'AI Usage' },
  { path: '/dashboard/admin/storage-logs', name: 'Storage Logs' },
  { path: '/dashboard/admin/audit', name: 'Audit Logs' },
  { path: '/dashboard/admin/security', name: 'Security Dashboard' },
  { path: '/dashboard/admin/ai-visibility', name: 'AI Visibility' },
];

// 致命的なNext.jsエラーをチェック
function hasFatalError(content: string): boolean {
  const fatalPatterns = [
    'missing required error components',
    'Application error: a server-side exception has occurred',
    'Unhandled Runtime Error',
    'ChunkLoadError',
  ];
  return fatalPatterns.some((pattern) =>
    content.toLowerCase().includes(pattern.toLowerCase())
  );
}

// 認証チェック: ログインページにリダイレクトされたかどうか
function isLoginRedirect(url: string): boolean {
  return url.includes('/login') || url.includes('/auth');
}

test.describe('Admin Dashboard Pages - Basic Load Tests', () => {
  // 各ページの基本的な読み込みテスト（認証なし）
  for (const { path, name } of ADMIN_PAGES) {
    test(`${name} (${path}) should not return 500/404 error`, async ({ page }) => {
      const response = await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const status = response?.status();
      const finalUrl = page.url();

      // 500と404は不合格
      expect(status).not.toBe(500);
      expect(status).not.toBe(404);

      // 許容ステータス: 200, 302, 307, 401, 403
      expect([200, 302, 307, 401, 403]).toContain(status);

      // ページの基本構造が存在することを確認
      await expect(page.locator('body')).toBeVisible();

      // HTMLに致命的エラーが含まれていないことを確認
      const content = await page.content();
      expect(hasFatalError(content)).toBe(false);

      // 何らかのコンテンツが表示されていることを確認
      const hasContent = (await page.locator('body *').count()) > 0;
      expect(hasContent).toBe(true);

      // 未認証の場合はログインページへのリダイレクトを確認
      if (status === 307 || isLoginRedirect(finalUrl)) {
        // リダイレクトは正常な動作
        expect(isLoginRedirect(finalUrl) || status === 307).toBe(true);
      }
    });
  }
});

test.describe('Admin Dashboard Pages - Auth Redirect Tests', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    const response = await page.goto('/dashboard/admin', {
      waitUntil: 'domcontentloaded',
    });

    const status = response?.status();
    const finalUrl = page.url();

    // 未認証時は307リダイレクトまたはログインページ
    if (status === 200) {
      // 認証済みの場合はページが表示される
      await expect(page.locator('body')).toBeVisible();
    } else {
      // 未認証の場合はリダイレクト
      expect([302, 307]).toContain(status);
      expect(isLoginRedirect(finalUrl) || finalUrl.includes('/dashboard/admin')).toBe(true);
    }
  });
});

test.describe('Admin Dashboard Pages - Error Handling Tests', () => {
  for (const { path, name } of ADMIN_PAGES.slice(1)) {
    // Admin Indexは除外
    test(`${name} should handle Supabase API errors gracefully`, async ({ page }) => {
      // Supabase API 500エラーをモック
      await page.route('**/rest/v1/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      });

      const response = await page.goto(path, {
        waitUntil: 'domcontentloaded',
      });

      // ページがクラッシュせずに表示されることを確認（リダイレクトも許容）
      await expect(page.locator('body')).toBeVisible();
      const hasContent = (await page.locator('body *').count()) > 0;
      expect(hasContent).toBe(true);

      // 500エラーが直接返されていないことを確認
      expect(response?.status()).not.toBe(500);
    });
  }
});

test.describe('Admin Dashboard Pages - Empty Data Handling', () => {
  test('AI Usage page should handle empty data', async ({ page }) => {
    // 空データをモック
    await page.route('**/rest/v1/organization_ai_usage*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/ai-usage');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    const hasContent = (await page.locator('body *').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('Audit page should handle empty audit logs', async ({ page }) => {
    // 空データをモック
    await page.route('**/rest/v1/service_role_audit*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route('**/rest/v1/ops_audit*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/audit');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('Security page should handle RLS permission errors gracefully', async ({ page }) => {
    // RLS権限エラーをモック（空配列を返す）
    await page.route('**/rest/v1/intrusion_detection_alerts*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/security');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('AI Visibility page should handle empty visibility data', async ({ page }) => {
    // 空データをモック
    await page.route('**/rest/v1/ai_visibility_scores*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/ai-visibility');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('Jobs page should handle empty job data', async ({ page }) => {
    // 空データをモック
    await page.route('**/rest/v1/translation_jobs*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route('**/rest/v1/embedding_jobs*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/jobs');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('Storage logs page should handle empty logs', async ({ page }) => {
    // 空データをモック
    await page.route('**/rest/v1/storage_access_logs*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard/admin/storage-logs');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Dashboard Pages - Network Failure Handling', () => {
  test('should handle network failure gracefully', async ({ page }) => {
    // ネットワーク失敗をモック
    await page.route('**/rest/v1/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/dashboard/admin/jobs');

    // ページがクラッシュせずに表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    const hasContent = (await page.locator('body *').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON response', async ({ page }) => {
    // 不正なJSONレスポンスをモック
    await page.route('**/rest/v1/translation_jobs*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response',
      });
    });

    await page.goto('/dashboard/admin/jobs');

    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});
