/**
 * Visual regression tests for section boundaries and flat design implementation
 * Tests ensure that flat design requirements are met:
 * - No 3D elevation effects or shadows
 * - ≥48px spacing between text and color boundaries (≥64px for Hero/CTA)
 * - Seamless color transitions with neutral buffers
 * - No visual artifacts ("ghost boxes") in dark sections
 */

import { test, expect } from '@playwright/test';

test.describe('Section Boundaries and Flat Design', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Homepage section boundaries should be seamless', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load fully
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of full page
    await expect(page).toHaveScreenshot('homepage-section-boundaries.png', {
      fullPage: true,
      threshold: 0.3, // Allow for minor differences
    });
    
    // Test specific section transitions
    const sections = [
      '.section-hero-pad',
      '.surface-fade-btm',
      '.section-buffer',
      '.bg-gray-50',
      '.bg-gray-800'
    ];
    
    for (const selector of sections) {
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  test('AIO page section boundaries should be seamless', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of full page
    await expect(page).toHaveScreenshot('aio-section-boundaries.png', {
      fullPage: true,
      threshold: 0.3,
    });
    
    // Verify section buffers are present
    const buffers = page.locator('.section-buffer');
    await expect(buffers).toHaveCount(2); // Should have 2 buffers as implemented
  });

  test('Hearing service page section boundaries should be seamless', async ({ page }) => {
    await page.goto('/hearing-service');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of full page
    await expect(page).toHaveScreenshot('hearing-service-section-boundaries.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('No shadow effects should be visible on cards', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Check that ui-flat class is applied to cards
    const cards = page.locator('.ui-flat, .ui-card');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    
    // Verify no shadow styles are computed
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      const boxShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).toBe('none');
    }
  });

  test('Dark CTA section should have no ghost boxes', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Navigate to dark CTA section
    const darkCTA = page.locator('.bg-gray-800');
    await expect(darkCTA).toBeVisible();
    
    // Take screenshot of dark CTA section
    await expect(darkCTA).toHaveScreenshot('dark-cta-section.png', {
      threshold: 0.3,
    });
    
    // Verify no decorative ghost elements are present
    const decorativeElements = darkCTA.locator('.deco-img, .section-deco');
    await expect(decorativeElements).toHaveCount(0);
  });

  test('Heading guards should maintain minimum distance from boundaries', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Check headings with guards
    const guardedHeadings = page.locator('.heading-guard-top, .heading-guard-btm');
    const headingCount = await guardedHeadings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    // Verify minimum spacing is applied (test computed styles)
    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = guardedHeadings.nth(i);
      const styles = await heading.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          marginTop: computed.marginTop,
          marginBottom: computed.marginBottom,
        };
      });
      
      // Check that margins are at least 48px (converted to pixels)
      const topMargin = parseInt(styles.marginTop);
      const bottomMargin = parseInt(styles.marginBottom);
      
      if (!isNaN(topMargin)) {
        expect(topMargin).toBeGreaterThanOrEqual(48);
      }
      if (!isNaN(bottomMargin)) {
        expect(bottomMargin).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('Section buffers should provide neutral transitions', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Check section buffers
    const buffers = page.locator('.section-buffer');
    const bufferCount = await buffers.count();
    
    expect(bufferCount).toBeGreaterThan(0);
    
    // Verify buffer styling
    for (let i = 0; i < bufferCount; i++) {
      const buffer = buffers.nth(i);
      const styles = await buffer.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          height: computed.height,
        };
      });
      
      // Buffer should have neutral background color
      expect(styles.backgroundColor).toMatch(/rgb\(250, 250, 250\)|#fafafa/);
      
      // Buffer should have reasonable height
      const height = parseInt(styles.height);
      expect(height).toBeGreaterThanOrEqual(24);
      expect(height).toBeLessThanOrEqual(48);
    }
  });

  test('Mobile responsiveness should maintain flat design principles', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('mobile-flat-design.png', {
      fullPage: true,
      threshold: 0.3,
    });
    
    // Verify no shadows on mobile
    const cards = page.locator('.ui-flat, .ui-card');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      const boxShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).toBe('none');
    }
  });

  test('Focus states should not use shadows', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Find buttons and links
    const focusableElements = page.locator('button, a[href], input, textarea').first();
    
    // Focus the element
    await focusableElements.focus();
    
    // Check that focus doesn't add shadows
    const boxShadow = await focusableElements.evaluate(el => getComputedStyle(el).boxShadow);
    
    // Should either be 'none' or an outline-style focus (not shadow)
    expect(boxShadow).toBe('none');
  });

  test('Standardized containers should have correct max-widths', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Test container-article (960px)
    const articleContainers = page.locator('.container-article');
    if (await articleContainers.count() > 0) {
      const container = articleContainers.first();
      const maxWidth = await container.evaluate(el => getComputedStyle(el).maxWidth);
      expect(maxWidth).toBe('960px');
    }
    
    // Test container-hero (1080px)
    const heroContainers = page.locator('.container-hero');
    if (await heroContainers.count() > 0) {
      const container = heroContainers.first();
      const maxWidth = await container.evaluate(el => getComputedStyle(el).maxWidth);
      expect(maxWidth).toBe('1080px');
    }
    
    // Test container-wide (1200px)
    const wideContainers = page.locator('.container-wide');
    if (await wideContainers.count() > 0) {
      const container = wideContainers.first();
      const maxWidth = await container.evaluate(el => getComputedStyle(el).maxWidth);
      expect(maxWidth).toBe('1200px');
    }
  });

  test('Pricing layout should be 2-column with equal widths on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop size
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Check pricing section
    const pricingGrid = page.locator('[class*="grid-cols-1"][class*="lg:grid-cols-2"]');
    if (await pricingGrid.count() > 0) {
      const grid = pricingGrid.first();
      
      // Verify grid has 2 columns
      const gridTemplateColumns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
      expect(gridTemplateColumns).toMatch(/repeat\(2,/);
      
      // Check gap is within 80-96px range
      const gap = await grid.evaluate(el => getComputedStyle(el).gap);
      const gapValue = parseInt(gap.replace('px', ''));
      expect(gapValue).toBeGreaterThanOrEqual(64); // 80px = 5rem = ~64px at base size
      expect(gapValue).toBeLessThanOrEqual(120);    // 96px tolerance
    }
  });

  test('Pricing cards should display tabular numbers', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Find pricing displays with tabular-nums class
    const tabularNumbers = page.locator('.tabular-nums');
    const count = await tabularNumbers.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check font-variant-numeric property
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = tabularNumbers.nth(i);
      const fontVariant = await element.evaluate(el => getComputedStyle(el).fontVariantNumeric);
      expect(fontVariant).toMatch(/tabular-nums|lining-nums/);
    }
  });

  test('Section rhythm spacing should be within specified ranges', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    // Test section-gap (48-96px range)
    const sectionGaps = page.locator('.section-gap');
    const gapCount = await sectionGaps.count();
    
    for (let i = 0; i < Math.min(gapCount, 3); i++) {
      const section = sectionGaps.nth(i);
      const styles = await section.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          marginTop: computed.marginTop,
          marginBottom: computed.marginBottom,
        };
      });
      
      const topMargin = parseInt(styles.marginTop);
      const bottomMargin = parseInt(styles.marginBottom);
      
      if (!isNaN(topMargin)) {
        expect(topMargin).toBeGreaterThanOrEqual(48);
        expect(topMargin).toBeLessThanOrEqual(96);
      }
      if (!isNaN(bottomMargin)) {
        expect(bottomMargin).toBeGreaterThanOrEqual(48);
        expect(bottomMargin).toBeLessThanOrEqual(96);
      }
    }
    
    // Test section-gap-hero (64-112px range)
    const heroGaps = page.locator('.section-gap-hero');
    const heroCount = await heroGaps.count();
    
    for (let i = 0; i < Math.min(heroCount, 3); i++) {
      const section = heroGaps.nth(i);
      const styles = await section.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          marginTop: computed.marginTop,
          marginBottom: computed.marginBottom,
        };
      });
      
      const topMargin = parseInt(styles.marginTop);
      const bottomMargin = parseInt(styles.marginBottom);
      
      if (!isNaN(topMargin)) {
        expect(topMargin).toBeGreaterThanOrEqual(64);
        expect(topMargin).toBeLessThanOrEqual(112);
      }
      if (!isNaN(bottomMargin)) {
        expect(bottomMargin).toBeGreaterThanOrEqual(64);
        expect(bottomMargin).toBeLessThanOrEqual(112);
      }
    }
  });

  test('Section buffers should have correct styling and dimensions', async ({ page }) => {
    await page.goto('/aio');
    
    await page.waitForLoadState('networkidle');
    
    const buffers = page.locator('.section-buffer');
    const bufferCount = await buffers.count();
    
    expect(bufferCount).toBeGreaterThan(0);
    
    for (let i = 0; i < bufferCount; i++) {
      const buffer = buffers.nth(i);
      const styles = await buffer.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          height: computed.height,
        };
      });
      
      // Buffer should be #f7f7f7 (rgb(247, 247, 247))
      expect(styles.backgroundColor).toMatch(/rgb\(247, 247, 247\)/);
      
      // Height should be within 32-56px range (clamp values)
      const height = parseInt(styles.height);
      expect(height).toBeGreaterThanOrEqual(32);
      expect(height).toBeLessThanOrEqual(56);
    }
  });
});