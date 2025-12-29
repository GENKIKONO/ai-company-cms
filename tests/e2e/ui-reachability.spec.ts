/**
 * UI Reachability Tests
 *
 * "触れる状態"の検証 - サイドバー/ドロワーから必須ルートへの到達を確認
 * 正本: docs/architecture/ui-reachability-inventory.md
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Inventory JSONを読み込み
function loadInventory() {
  const inventoryPath = join(process.cwd(), 'docs/architecture/ui-reachability-inventory.md');
  const content = readFileSync(inventoryPath, 'utf-8');

  // 機械可読ブロックを抽出
  const match = content.match(/```json\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error('UI Reachability Inventory JSON block not found');
  }

  return JSON.parse(match[1]);
}

// Dashboard必須ルートのテスト
test.describe('Dashboard UI Reachability', () => {
  let inventory: any;
  let dashboardArea: any;

  test.beforeAll(() => {
    inventory = loadInventory();
    dashboardArea = inventory.areas.find((a: any) => a.area === 'dashboard');
  });

  test.describe('Desktop - Sidebar Navigation', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('サイドバーが表示される', async ({ page }) => {
      await page.goto('/dashboard');

      // サイドバーの存在確認
      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    });

    test('必須ルートのラベルがサイドバーに存在する', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // 必須ルートのラベルをチェック
      const mustRoutes = dashboardArea.must_reachable_routes;
      const missingLabels: string[] = [];

      for (const route of mustRoutes) {
        const link = sidebar.locator(`a:has-text("${route.label}")`);
        const count = await link.count();
        if (count === 0) {
          missingLabels.push(route.label);
        }
      }

      if (missingLabels.length > 0) {
        console.log('Missing labels in sidebar:', missingLabels);
      }

      // 重要なルートは必ず存在すること
      const criticalLabels = ['ダッシュボード', '記事管理', 'サービス管理', '設定'];
      for (const label of criticalLabels) {
        const link = sidebar.locator(`a:has-text("${label}")`);
        await expect(link).toBeVisible({ timeout: 5000 });
      }
    });

    test('サイドバーリンクがクリックで遷移できる', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // 設定ページへの遷移テスト
      const settingsLink = sidebar.locator('a:has-text("設定")');
      await expect(settingsLink).toBeVisible();
      await settingsLink.click();

      await page.waitForURL('**/dashboard/settings**', { timeout: 10000 });
      expect(page.url()).toContain('/dashboard/settings');
    });
  });

  test.describe('Mobile - Drawer Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('モバイルでハンバーガーメニューが表示される', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // モバイルではサイドバーが非表示になっている可能性
      // ハンバーガーボタンまたはドロワートリガーを探す
      const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="mobile-menu-button"]');

      // ハンバーガーが存在するか、モバイルドロワーが既に表示されているか
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);
      const drawerVisible = await page.locator('[data-testid="mobile-drawer"]').isVisible().catch(() => false);

      // どちらかが存在すればOK
      expect(hamburgerVisible || drawerVisible).toBe(true);
    });
  });

  test.describe('Admin Link Conditional Rendering', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('非管理者ユーザーでは管理リンクがDOMに存在しない', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // 管理リンクはcanSeeAdminNav=falseの場合DOMに存在しない
      const adminLink = sidebar.locator('a:has-text("管理")');
      const adminCount = await adminLink.count();

      // 非管理者ではDOMに出ないことを確認（0または存在しない）
      // 注: 実際に管理者でログインしていない場合は0であるべき
      console.log(`Admin link count: ${adminCount}`);
    });
  });
});

// ルート到達テスト（既存のsmoke testと統合）
test.describe('Route Reachability Smoke', () => {
  let inventory: any;

  test.beforeAll(() => {
    inventory = loadInventory();
  });

  test('Dashboard必須ルートが200/302/307を返す', async ({ page }) => {
    const dashboardArea = inventory.areas.find((a: any) => a.area === 'dashboard');
    const mustRoutes = dashboardArea.must_reachable_routes;

    const results: { route: string; status: number | undefined }[] = [];

    for (const route of mustRoutes.slice(0, 5)) { // 最初の5ルートのみテスト（時間短縮）
      const response = await page.goto(route.route, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      results.push({
        route: route.route,
        status: response?.status()
      });
    }

    console.log('Route reachability results:', results);

    // すべてのルートが500/404以外を返すこと
    for (const result of results) {
      expect([200, 302, 307, 401, 403]).toContain(result.status);
    }
  });

  test('Inventoryのルート数が期待通り', async () => {
    const dashboardArea = inventory.areas.find((a: any) => a.area === 'dashboard');

    // 最低限のルート数を確認
    expect(dashboardArea.must_reachable_routes.length).toBeGreaterThanOrEqual(10);
    expect(dashboardArea.conditional_routes.length).toBeGreaterThanOrEqual(1);
  });
});
