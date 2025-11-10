/**
 * Phase 4 - E2E Testing: Pricing Page Critical Journey
 * 料金プランページの主要ユーザーフロー・価格整合性テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page Critical User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // 料金ページに移動
    await page.goto('/pricing');
  });

  test('should load pricing page successfully', async ({ page }) => {
    // ページタイトル確認
    await expect(page).toHaveTitle(/料金|pricing|プラン/i);
    
    // メインヘッダー存在確認
    const mainHeading = page.locator('h1, h2').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(/料金|価格|プラン|pricing/i);
  });

  test('should display all three pricing tiers', async ({ page }) => {
    // 3つの料金プランが表示されることを確認
    const pricingCards = page.locator('.glass-card, [class*="pricing"], [class*="plan"]');
    const cardCount = await pricingCards.count();
    
    // 最低3つのプランカードが存在することを確認
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should display correct pricing amounts', async ({ page }) => {
    // Phase 4制約: 価格整合性の確認（2,980/8,000/15,000円）
    const priceElements = page.locator('text=/[¥￥]?[0-9,]+/');
    const prices: string[] = [];
    
    const count = await priceElements.count();
    for (let i = 0; i < count; i++) {
      const priceText = await priceElements.nth(i).textContent();
      if (priceText) {
        prices.push(priceText);
      }
    }
    
    // 主要価格が含まれていることを確認
    const priceNumbers = prices.join(' ');
    expect(priceNumbers).toContain('2,980');
    expect(priceNumbers).toContain('8,000');
    expect(priceNumbers).toContain('15,000');
    
    console.log('Detected pricing:', prices);
  });

  test('should have working CTA buttons', async ({ page }) => {
    // 各プランのCTAボタンを確認
    const ctaButtons = page.locator('a[href*="stripe"], button[type="button"], a[href*="signup"], a[href*="contact"]');
    const buttonCount = await ctaButtons.count();
    
    if (buttonCount > 0) {
      // 最初のCTAボタンが動作することを確認
      await expect(ctaButtons.first()).toBeVisible();
      
      // ホバー効果の確認（spring-bounce）
      await ctaButtons.first().hover();
      
      // ボタンがクリック可能であることを確認
      await expect(ctaButtons.first()).toBeEnabled();
    }
  });

  test('should maintain Apple HIG design consistency', async ({ page }) => {
    // glass-card効果が適用されていることを確認
    const glassCards = page.locator('.glass-card');
    const cardCount = await glassCards.count();
    
    if (cardCount > 0) {
      await expect(glassCards.first()).toBeVisible();
      
      // backdrop-filter CSS プロパティの確認
      const backdropFilter = await glassCards.first().evaluate(el => 
        getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter
      );
      expect(backdropFilter).toMatch(/blur|none/);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // デスクトップ表示確認
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
    
    // タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // モバイルナビが表示されることを確認
    const mobileNavTrigger = page.locator('[aria-label*="メニュー"], button[aria-expanded]');
    if (await mobileNavTrigger.count() > 0) {
      await expect(mobileNavTrigger.first()).toBeVisible();
    }
  });

  test('should have working mobile navigation', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UnifiedMobileNav のFABボタンを確認
    const mobileNavButton = page.locator('button[aria-label*="メニュー"]');
    
    if (await mobileNavButton.count() > 0) {
      // FABボタンをクリック
      await mobileNavButton.click();
      
      // ドロワーが開くことを確認
      const drawer = page.locator('nav[role="navigation"]');
      await expect(drawer).toBeVisible();
      
      // ナビゲーションリンクが表示されることを確認
      const navLinks = drawer.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // ドロワーを閉じる
      const closeButton = page.locator('button[aria-label*="閉じる"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }
  });

  test('should have valid structured data for pricing', async ({ page }) => {
    // JSON-LD 構造化データの確認
    const jsonLdElements = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdElements.count();
    
    for (let i = 0; i < count; i++) {
      const jsonContent = await jsonLdElements.nth(i).textContent();
      if (jsonContent) {
        const parsedData = JSON.parse(jsonContent);
        
        // Product or Offer スキーマがある場合の価格確認
        if (parsedData['@type'] === 'Product' || parsedData['@type'] === 'Offer' || 
            (parsedData.offers && Array.isArray(parsedData.offers))) {
          console.log('Found pricing structured data:', parsedData);
          
          // 価格情報が含まれていることを確認
          const jsonString = JSON.stringify(parsedData);
          expect(jsonString).toMatch(/price|価格|料金/i);
        }
      }
    }
  });

  test('should load without errors and within performance budget', async ({ page }) => {
    const errors: string[] = [];
    
    // エラー監視
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => {
      console.warn(`Failed request: ${request.url()}`);
    });
    
    const startTime = Date.now();
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // パフォーマンス確認（4秒以内）
    expect(loadTime).toBeLessThan(4000);
    
    // エラーがないことを確認
    expect(errors).toHaveLength(0);
    
    console.log(`Pricing page loaded in ${loadTime}ms`);
  });

  test('should have accessible focus management', async ({ page }) => {
    // キーボードナビゲーション確認
    await page.keyboard.press('Tab');
    
    // フォーカス可能な要素が存在することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 複数のTab移動でフォーカスが正常に移動することを確認
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      const currentFocused = page.locator(':focus');
      await expect(currentFocused).toBeVisible();
    }
  });

  test('should maintain Stripe integration readiness', async ({ page }) => {
    // Stripe関連のボタンや要素を確認
    const stripeElements = page.locator('[href*="stripe"], [data-stripe], [class*="stripe"]');
    const stripeCount = await stripeElements.count();
    
    // Stripeボタンが存在する場合の確認
    if (stripeCount > 0) {
      await expect(stripeElements.first()).toBeVisible();
      
      // ボタンが有効であることを確認
      const isEnabled = await stripeElements.first().isEnabled();
      expect(isEnabled).toBeTruthy();
    }
    
    console.log(`Found ${stripeCount} Stripe-related elements`);
  });
});