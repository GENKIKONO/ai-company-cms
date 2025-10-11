/**
 * スクリーンショット撮影による視覚的検証
 * フラットデザイン実装の最終確認用
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Validation Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Homepage - Full page visual verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full-flat-design.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Take specific section screenshots
    
    // Hero section
    const heroSection = page.locator('.section-hero-pad').first();
    await expect(heroSection).toHaveScreenshot('homepage-hero-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Features section
    const featuresSection = page.locator('.bg-gray-50').first();
    await expect(featuresSection).toHaveScreenshot('homepage-features-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Dark CTA section  
    const darkCTA = page.locator('.bg-gray-800').first();
    await expect(darkCTA).toHaveScreenshot('homepage-dark-cta-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('AIO Page - Full page visual verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('aio-full-flat-design.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Hero section
    const heroSection = page.locator('.section-hero-pad').first();
    await expect(heroSection).toHaveScreenshot('aio-hero-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Pricing section (2-column layout)
    const pricingSection = page.locator('.bg-gray-50').first();
    await expect(pricingSection).toHaveScreenshot('aio-pricing-section-2column.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Features section
    const featuresSection = page.locator('.container-article').first();
    await expect(featuresSection).toHaveScreenshot('aio-features-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('Hearing Service Page - Full page visual verification', async ({ page }) => {
    await page.goto('/hearing-service');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('hearing-service-full-flat-design.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Hero section
    const heroSection = page.locator('.section-hero-pad').first();
    await expect(heroSection).toHaveScreenshot('hearing-service-hero-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Pricing section
    const pricingSection = page.locator('#pricing').first();
    await expect(pricingSection).toHaveScreenshot('hearing-service-pricing-section.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('Container Standards - Visual verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Container article (960px)
    const containerArticle = page.locator('.container-article').first();
    await expect(containerArticle).toHaveScreenshot('container-article-960px.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Container hero (1080px)
    const containerHero = page.locator('.container-hero').first();
    await expect(containerHero).toHaveScreenshot('container-hero-1080px.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // Container wide (1200px) - Pricing section
    const containerWide = page.locator('.container-wide').first();
    await expect(containerWide).toHaveScreenshot('container-wide-1200px-pricing.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('Section Buffers - Visual verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Section buffer visual check
    const sectionBuffers = page.locator('.section-buffer');
    
    for (let i = 0; i < Math.min(await sectionBuffers.count(), 3); i++) {
      await expect(sectionBuffers.nth(i)).toHaveScreenshot(`section-buffer-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });

  test('Mobile Responsiveness - Visual verification', async ({ page }) => {
    // Test different mobile viewports
    const viewports = [
      { width: 375, height: 667, name: 'mobile-iphone' },
      { width: 768, height: 1024, name: 'tablet-ipad' },
      { width: 1024, height: 768, name: 'desktop-small' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Homepage
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        animations: 'disabled'
      });
      
      // AIO page
      await page.goto('/aio');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`aio-${viewport.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });

  test('Flat Design Cards - Visual verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find cards with ui-flat class
    const flatCards = page.locator('.ui-flat, .ui-card');
    const cardCount = await flatCards.count();
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      await expect(flatCards.nth(i)).toHaveScreenshot(`flat-card-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });

  test('Typography and Tabular Numbers - Visual verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Tabular numbers in pricing
    const tabularNums = page.locator('.tabular-nums');
    
    for (let i = 0; i < Math.min(await tabularNums.count(), 3); i++) {
      await expect(tabularNums.nth(i)).toHaveScreenshot(`tabular-numbers-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
    
    // Heading guards
    const headingGuards = page.locator('.heading-guard-top, .heading-guard-btm');
    
    for (let i = 0; i < Math.min(await headingGuards.count(), 3); i++) {
      await expect(headingGuards.nth(i)).toHaveScreenshot(`heading-guard-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });

  test('Section Rhythm - Visual verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Section gaps
    const sectionGaps = page.locator('.section-gap');
    
    for (let i = 0; i < Math.min(await sectionGaps.count(), 3); i++) {
      await expect(sectionGaps.nth(i)).toHaveScreenshot(`section-gap-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
    
    // Hero gaps
    const heroGaps = page.locator('.section-gap-hero');
    
    for (let i = 0; i < Math.min(await heroGaps.count(), 2); i++) {
      await expect(heroGaps.nth(i)).toHaveScreenshot(`section-gap-hero-${i + 1}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });
});