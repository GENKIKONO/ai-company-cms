import { test, expect } from '@playwright/test';

const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp';

test.describe('Hearing Service Integration with PricingPlans', () => {
  
  test.beforeEach(async ({ page }) => {
    // Add error logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('Production: /hearing-service loads with new PricingPlans component', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title contains hearing service info
    const title = await page.title();
    expect(title).toContain('ヒアリング');
    
    // Verify hero section exists (should be preserved)
    const heroSection = page.locator('h1').filter({ hasText: 'AI最適化' });
    await expect(heroSection).toBeVisible();
    
    // Verify new PricingPlans component is loaded
    const pricingTitle = page.locator('h2').filter({ hasText: '料金プラン（ヒアリング代行）' });
    await expect(pricingTitle).toBeVisible();
    
    // Check that pricing cards are visible (3 cards expected)
    const pricingCards = page.locator('article').filter({ hasNot: page.locator('[role="button"]') });
    await expect(pricingCards).toHaveCount(3);
    
    // Verify plan names from new component (updated structure)
    await expect(page.locator('text=スタンダード')).toBeVisible();
    await expect(page.locator('text=ビジネス')).toBeVisible(); 
    await expect(page.locator('text=エンタープライズ')).toBeVisible();
    
    // Verify "人気" badge on business plan
    await expect(page.locator('text=人気')).toBeVisible();
    
    // Verify data-component attribute for PricingPlans
    const pricingComponent = page.locator('[data-component="PricingPlans"]');
    await expect(pricingComponent).toBeVisible();
  });

  test('Production: CTA buttons meet 44px tap target requirement', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Find all CTA buttons with hit-44 class
    const ctaButtons = page.locator('.hit-44').filter({ hasText: /申し込む|お問い合わせ/ });
    const buttonCount = await ctaButtons.count();
    
    expect(buttonCount).toBeGreaterThanOrEqual(3); // At least 3 plan CTAs
    
    // Verify each CTA meets 44px minimum requirement
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = ctaButtons.nth(i);
      await expect(button).toBeVisible();
      
      const buttonBox = await button.boundingBox();
      expect(buttonBox).toBeTruthy();
      
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        
        // Should not exceed cta-optimized max height
        expect(buttonBox.height).toBeLessThanOrEqual(56);
      }
    }
  });

  test('Production: Mobile horizontal scroll behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Scroll to pricing section
    await page.locator('text=料金プラン（ヒアリング代行）').scrollIntoViewIfNeeded();
    
    // Check mobile layout is active
    const mobileContainer = page.locator('.lg\\:hidden .overflow-x-auto').first();
    await expect(mobileContainer).toBeVisible();
    
    // Verify cards have 85% width
    const cards = mobileContainer.locator('article');
    await expect(cards.first()).toBeVisible();
    
    const firstCard = cards.first();
    const cardClasses = await firstCard.getAttribute('class');
    expect(cardClasses).toContain('w-[85%]');
    expect(cardClasses).toContain('snap-center');
    
    // Test horizontal scroll functionality
    const secondCard = cards.nth(1);
    await secondCard.scrollIntoViewIfNeeded();
    await expect(secondCard).toBeVisible();
    
    // Verify business plan is accessible via scroll
    const businessTitle = secondCard.locator('text=ビジネス');
    await expect(businessTitle).toBeVisible();
  });

  test('Production: Desktop grid layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Scroll to pricing section
    await page.locator('text=料金プラン（ヒアリング代行）').scrollIntoViewIfNeeded();
    
    // Check desktop layout is active
    const desktopGrid = page.locator('.lg\\:grid.lg\\:grid-cols-3').first();
    await expect(desktopGrid).toBeVisible();
    
    // Verify all three cards are visible side by side
    const cards = desktopGrid.locator('article');
    await expect(cards).toHaveCount(3);
    
    // Check cards have equal heights (flex layout)
    const card1 = cards.nth(0);
    const card2 = cards.nth(1);
    const card3 = cards.nth(2);
    
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();
    await expect(card3).toBeVisible();
    
    // Get card dimensions for layout validation
    const card1Box = await card1.boundingBox();
    const card2Box = await card2.boundingBox();
    const card3Box = await card3.boundingBox();
    
    if (card1Box && card2Box && card3Box) {
      // Cards should have similar heights (within tolerance)
      const heightTolerance = 20;
      expect(Math.abs(card1Box.height - card2Box.height)).toBeLessThanOrEqual(heightTolerance);
      expect(Math.abs(card2Box.height - card3Box.height)).toBeLessThanOrEqual(heightTolerance);
      
      // Cards should be arranged horizontally
      expect(card2Box.x).toBeGreaterThan(card1Box.x + card1Box.width - 50);
      expect(card3Box.x).toBeGreaterThan(card2Box.x + card2Box.width - 50);
    }
  });

  test('Production: Accessibility compliance', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Scroll to pricing section
    await page.locator('text=料金プラン（ヒアリング代行）').scrollIntoViewIfNeeded();
    
    // Check ARIA attributes
    const pricingSection = page.locator('section').filter({ hasText: '料金プラン（ヒアリング代行）' });
    await expect(pricingSection).toBeVisible();
    
    // Verify heading structure
    const mainHeading = page.locator('h2').filter({ hasText: '料金プラン（ヒアリング代行）' });
    await expect(mainHeading).toHaveAttribute('id', 'pricing-title');
    
    // Check CTA buttons have proper roles and labels
    const ctaButtons = page.locator('[role="button"]').filter({ hasText: /申し込む|お問い合わせ/ });
    const ctaCount = await ctaButtons.count();
    
    for (let i = 0; i < Math.min(ctaCount, 3); i++) {
      const button = ctaButtons.nth(i);
      await expect(button).toBeVisible();
      
      // Should have aria-label for screen readers
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/(スタンダード|ビジネス|エンタープライズ).*選択/);
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
  });

  test('Production: Page performance and loading', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Check for any JavaScript errors
    let hasErrors = false;
    page.on('pageerror', () => {
      hasErrors = true;
    });
    
    await page.waitForTimeout(1000); // Wait for any delayed errors
    expect(hasErrors).toBe(false);
    
    // Verify critical content is visible
    await expect(page.locator('text=料金プラン（ヒアリング代行）')).toBeVisible();
    await expect(page.locator('text=スタンダード')).toBeVisible();
    await expect(page.locator('text=ビジネス')).toBeVisible();
    await expect(page.locator('text=エンタープライズ')).toBeVisible();
  });

  test('Production: Integration with existing sections', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Verify all main sections are present in correct order
    const sections = [
      'AI最適化', // Hero section
      'サービス', // Flow section  
      '料金プラン（ヒアリング代行）', // New PricingPlans
      'よくある質問', // FAQ section
      '今すぐ' // CTA section
    ];
    
    for (const sectionText of sections) {
      const section = page.locator(`h1, h2, h3`).filter({ hasText: new RegExp(sectionText) });
      await expect(section.first()).toBeVisible();
    }
    
    // Verify no duplicate CTA buttons (avoid conflicts)
    const allCtaButtons = page.locator('a').filter({ hasText: /申し込む|お問い合わせ|相談/ });
    const ctaCount = await allCtaButtons.count();
    
    // Should have CTAs from PricingPlans (3) + main CTA section (reasonable total)
    expect(ctaCount).toBeGreaterThanOrEqual(3);
    expect(ctaCount).toBeLessThanOrEqual(10); // Avoid excessive duplicates
  });

  test('Production: FAQ tab keyboard navigation', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Scroll to FAQ section
    await page.locator('text=よくある質問').scrollIntoViewIfNeeded();
    
    // Focus on first category tab
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();
    await expect(firstTab).toBeFocused();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    const secondTab = page.locator('[role="tab"]').nth(1);
    await expect(secondTab).toBeFocused();
    
    // Test Enter key selection
    await page.keyboard.press('Enter');
    const activeTab = page.locator('[aria-selected="true"]');
    await expect(activeTab).toBeVisible();
    
    // Test Space key selection
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press(' ');
    const newActiveTab = page.locator('[aria-selected="true"]');
    await expect(newActiveTab).toBeVisible();
    
    // Verify FAQ content updates based on category selection
    const faqContent = page.locator('#faq-content');
    await expect(faqContent).toBeVisible();
  });

  test('Production: Cache and revalidation verification', async ({ page }) => {
    // First request - may serve from cache
    await page.goto(`${PRODUCTION_URL}/hearing-service`);
    await page.waitForLoadState('networkidle');
    
    // Verify new content is served
    await expect(page.locator('text=料金プラン（ヒアリング代行）')).toBeVisible();
    
    // Second request - should also serve updated content
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Content should remain consistent
    await expect(page.locator('text=料金プラン（ヒアリング代行）')).toBeVisible();
    await expect(page.locator('text=スタンダード')).toBeVisible();
    await expect(page.locator('text=ビジネス')).toBeVisible();
    
    // Verify no old pricing section remains
    const oldPricingText = ['ライトヒアリング', 'アドバンスヒアリング', 'フルヒアリング'];
    
    for (const oldText of oldPricingText) {
      const oldSection = page.locator(`text=${oldText}`);
      // Should not be visible if replacement was successful
      await expect(oldSection).not.toBeVisible();
    }
  });
});