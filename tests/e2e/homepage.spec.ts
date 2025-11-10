/**
 * Phase 4 - E2E Testing: Homepage Critical Journey
 * ホームページの主要ユーザーフロー自動テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Critical User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // ホームページに移動
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // ページタイトル確認
    await expect(page).toHaveTitle(/AIO Hub/i);
    
    // メインヘッダー存在確認
    await expect(page.locator('h1')).toBeVisible();
    
    // ナビゲーション要素確認
    await expect(page.locator('header')).toBeVisible();
  });

  test('should display main sections', async ({ page }) => {
    // ヒーローセクション確認
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    
    // 主要CTA確認
    const ctaButton = page.locator('a[href*="pricing"], button').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // 料金プランリンク確認
    const pricingLink = page.locator('a[href="/pricing"]');
    if (await pricingLink.count() > 0) {
      await expect(pricingLink.first()).toBeVisible();
      await pricingLink.first().click();
      await expect(page).toHaveURL(/\/pricing/);
      await page.goBack();
    }

    // ヒアリング代行リンク確認
    const hearingLink = page.locator('a[href="/hearing-service"]');
    if (await hearingLink.count() > 0) {
      await expect(hearingLink.first()).toBeVisible();
      await hearingLink.first().click();
      await expect(page).toHaveURL(/\/hearing-service/);
      await page.goBack();
    }
  });

  test('should display glass morphism effects correctly', async ({ page }) => {
    // glass-card クラスを持つ要素が存在することを確認
    const glassCards = page.locator('.glass-card');
    if (await glassCards.count() > 0) {
      await expect(glassCards.first()).toBeVisible();
      
      // backdrop-filter が適用されていることを確認（CSSプロパティチェック）
      const backdropFilter = await glassCards.first().evaluate(el => 
        getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter
      );
      expect(backdropFilter).toContain('blur');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ページが正常に表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // モバイルナビゲーション確認（UnifiedMobileNav）
    const mobileNav = page.locator('[aria-label*="メニュー"], [aria-label*="navigation"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors: Error[] = [];
    
    page.on('pageerror', error => jsErrors.push(error));
    page.on('requestfailed', request => {
      console.warn(`Failed request: ${request.url()}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // JSエラーがないことを確認
    expect(jsErrors).toHaveLength(0);
  });

  test('should have working Apple HIG spring animations', async ({ page }) => {
    // spring-bounce クラスを持つ要素を確認
    const springElements = page.locator('.spring-bounce');
    
    if (await springElements.count() > 0) {
      await expect(springElements.first()).toBeVisible();
      
      // CSS transition が設定されていることを確認
      const transition = await springElements.first().evaluate(el => 
        getComputedStyle(el).transition
      );
      expect(transition).toContain('transform');
    }
  });

  test('should have accessible focus states', async ({ page }) => {
    // キーボードナビゲーション確認
    await page.keyboard.press('Tab');
    
    // フォーカス可能な要素を確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // focus-visible スタイルが適用されることを確認
    const outline = await focusedElement.evaluate(el => 
      getComputedStyle(el).outline
    );
    expect(outline).not.toBe('none');
  });

  test('should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // 3秒以内でロード完了することを確認
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Homepage loaded in ${loadTime}ms`);
  });

  test('should have valid structured data', async ({ page }) => {
    await page.goto('/');
    
    // JSON-LD 構造化データの存在確認
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    
    if (count > 0) {
      // 最初のJSON-LDが有効なJSONであることを確認
      const jsonContent = await jsonLd.first().textContent();
      expect(() => JSON.parse(jsonContent || '')).not.toThrow();
      
      const parsedJson = JSON.parse(jsonContent || '{}');
      expect(parsedJson['@context']).toBeDefined();
      expect(parsedJson['@type']).toBeDefined();
    }
  });
});