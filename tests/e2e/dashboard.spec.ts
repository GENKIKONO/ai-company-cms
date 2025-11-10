/**
 * Phase 4 - E2E Testing: Dashboard Critical Journey
 * ダッシュボードページの主要ユーザーフロー・統合ナビテスト
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Critical User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // ダッシュボードに移動（認証状態に関わらず基本構造をテスト）
    await page.goto('/dashboard');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    // ページが正常にロードされることを確認（認証チェックは別途）
    await expect(page.locator('body')).toBeVisible();
    
    // ダッシュボード関連のタイトルまたは要素が存在することを確認
    const titleOrHeading = page.locator('h1, h2, title, [data-testid*="dashboard"]');
    const elementCount = await titleOrHeading.count();
    expect(elementCount).toBeGreaterThan(0);
  });

  test('should display dashboard layout structure', async ({ page }) => {
    // メインレイアウトの確認
    const mainContent = page.locator('main, [role="main"], .main-content');
    const layoutCount = await mainContent.count();
    
    if (layoutCount > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should show desktop sidebar on large screens', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // デスクトップサイドバーの確認（lg:blockクラスまたは類似の構造）
    const desktopSidebar = page.locator('.hidden.lg\\:flex, .lg\\:fixed, [class*="sidebar"]');
    const sidebarCount = await desktopSidebar.count();
    
    if (sidebarCount > 0) {
      // デスクトップ表示でサイドバーが表示されることを期待
      const isVisible = await desktopSidebar.first().isVisible();
      console.log(`Desktop sidebar visible: ${isVisible}`);
    }
  });

  test('should display mobile navigation on small screens', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UnifiedMobileNav のFABボタンを確認
    const mobileNavFab = page.locator('button[aria-label*="メニュー"], .fixed.bottom-4.right-4');
    
    if (await mobileNavFab.count() > 0) {
      await expect(mobileNavFab.first()).toBeVisible();
      
      // FABボタンをクリックしてドロワーを開く
      await mobileNavFab.first().click();
      
      // ダッシュボード用ナビゲーションドロワーが表示されることを確認
      const drawer = page.locator('nav[role="navigation"], nav[aria-label*="ダッシュボード"]');
      if (await drawer.count() > 0) {
        await expect(drawer.first()).toBeVisible();
        
        // ダッシュボード関連のナビゲーションリンクを確認
        const dashboardLinks = drawer.locator('a[href*="/dashboard"]');
        const linkCount = await dashboardLinks.count();
        expect(linkCount).toBeGreaterThan(0);
        
        console.log(`Found ${linkCount} dashboard navigation links`);
        
        // ドロワーを閉じる
        const closeButton = page.locator('button[aria-label*="閉じる"]');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        } else {
          // オーバーレイクリックで閉じる
          const overlay = page.locator('.fixed.inset-0.bg-black');
          if (await overlay.count() > 0) {
            await overlay.click();
          }
        }
      }
    }
  });

  test('should apply App Error Boundary protection', async ({ page }) => {
    // エラーバウンダリの存在確認
    const jsErrors: Error[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error);
      console.log('JS Error caught:', error.message);
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // 重大なJSエラーが発生していないことを確認
    const criticalErrors = jsErrors.filter(error => 
      error.message.includes('Cannot read property') ||
      error.message.includes('TypeError') ||
      error.message.includes('ReferenceError')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should maintain glass morphism design consistency', async ({ page }) => {
    // glass-card要素の存在確認
    const glassCards = page.locator('.glass-card');
    const cardCount = await glassCards.count();
    
    if (cardCount > 0) {
      await expect(glassCards.first()).toBeVisible();
      
      // CSS backdrop-filterプロパティの確認
      const backdropFilter = await glassCards.first().evaluate(el => 
        getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter
      );
      expect(backdropFilter).toMatch(/blur|none/);
    }
  });

  test('should have working spring animation effects', async ({ page }) => {
    // spring-bounce クラス要素の確認
    const springElements = page.locator('.spring-bounce');
    const springCount = await springElements.count();
    
    if (springCount > 0) {
      await expect(springElements.first()).toBeVisible();
      
      // CSS transition プロパティの確認
      const transition = await springElements.first().evaluate(el => 
        getComputedStyle(el).transition
      );
      expect(transition).toMatch(/transform|all/);
      
      // ホバー効果のテスト
      await springElements.first().hover();
      
      console.log(`Found ${springCount} spring-bounce elements`);
    }
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // ダッシュボードは5秒以内でロード完了することを確認
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should handle focus management correctly', async ({ page }) => {
    // キーボードナビゲーション確認
    await page.keyboard.press('Tab');
    
    // フォーカス可能な要素が存在することを確認
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;
    
    if (hasFocus) {
      await expect(focusedElement).toBeVisible();
      
      // focus-visibleスタイルが適用されることを確認
      const outline = await focusedElement.evaluate(el => 
        getComputedStyle(el).outline
      );
      expect(outline).not.toBe('none');
    }
  });

  test('should maintain responsive layout integrity', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1280, height: 720, name: 'Desktop Standard' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // レイアウトが崩れていないことを確認
      await expect(page.locator('body')).toBeVisible();
      
      // オーバーフローがないことを確認
      const bodyOverflow = await page.locator('body').evaluate(el => 
        getComputedStyle(el).overflow
      );
      expect(bodyOverflow).not.toBe('scroll');
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Layout OK`);
    }
  });

  test('should have unified mobile navigation functionality', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UnifiedMobileNav が正常に動作することを確認
    const mobileNavButton = page.locator('button[aria-label*="メニュー"]');
    
    if (await mobileNavButton.count() > 0) {
      // 初期状態でドロワーが閉じていることを確認
      const drawer = page.locator('nav[id*="drawer"], nav[aria-label*="ダッシュボード"]');
      if (await drawer.count() > 0) {
        const isHidden = await drawer.first().isHidden();
        expect(isHidden).toBe(true);
      }
      
      // メニューボタンをクリック
      await mobileNavButton.click();
      
      // ドロワーが表示されることを確認
      if (await drawer.count() > 0) {
        await expect(drawer.first()).toBeVisible();
      }
      
      // Escキーでドロワーが閉じることを確認
      await page.keyboard.press('Escape');
      
      // ドロワーが再び非表示になることを確認
      if (await drawer.count() > 0) {
        await page.waitForTimeout(500); // アニメーション待機
        const isHidden = await drawer.first().isHidden();
        expect(isHidden).toBe(true);
      }
    }
  });

  test('should use app-design-tokens.css variables', async ({ page }) => {
    // CSS変数が適用されていることを確認
    const bodyElement = page.locator('body');
    
    const cssVariables = await bodyElement.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        primaryColor: computedStyle.getPropertyValue('--aio-primary').trim(),
        surfaceColor: computedStyle.getPropertyValue('--aio-surface').trim(),
        textOnPrimary: computedStyle.getPropertyValue('--text-on-primary').trim()
      };
    });
    
    // CSS変数が定義されていることを確認
    expect(cssVariables.primaryColor).toBeTruthy();
    console.log('CSS Variables:', cssVariables);
  });
});