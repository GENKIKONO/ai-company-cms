import { test, expect } from '@playwright/test';

test.describe('Pricing Desktop Layout Balance', () => {
  test('pricing cards have equal width on desktop', async ({ page }) => {
    await page.goto('/aio');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Wait for pricing cards to be visible
    const pricingCards = page.locator('[data-index]').filter({ hasText: 'シングルヒアリング' });
    await expect(pricingCards.first()).toBeVisible();
    
    // Get all pricing plan cards
    const card1 = page.locator('[data-index="0"]').first();
    const card2 = page.locator('[data-index="1"]').first();
    
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();
    
    // Get card dimensions
    const card1Box = await card1.boundingBox();
    const card2Box = await card2.boundingBox();
    
    if (card1Box && card2Box) {
      // Cards should have equal width (±4px tolerance)
      const widthDifference = Math.abs(card1Box.width - card2Box.width);
      expect(widthDifference).toBeLessThanOrEqual(4);
      
      // Calculate gap between cards
      const gap = card2Box.x - (card1Box.x + card1Box.width);
      
      // Gap should be centered (±8px tolerance from expected center)
      // Expected gap should be around 64px (gap-16 = 4rem = 64px)
      expect(gap).toBeGreaterThanOrEqual(56); // 64 - 8
      expect(gap).toBeLessThanOrEqual(72);    // 64 + 8
      
      // Cards should be aligned vertically (same top position ±4px)
      const verticalAlignment = Math.abs(card1Box.y - card2Box.y);
      expect(verticalAlignment).toBeLessThanOrEqual(4);
      
      console.log(`Card widths: ${card1Box.width}px vs ${card2Box.width}px (diff: ${widthDifference}px)`);
      console.log(`Gap between cards: ${gap}px`);
      console.log(`Vertical alignment: ${verticalAlignment}px`);
    }
  });
  
  test('pricing text uses proper measure classes', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Check that pricing descriptions have measure-pricing class
    const descriptions = page.locator('.measure-pricing');
    const descriptionCount = await descriptions.count();
    expect(descriptionCount).toBeGreaterThan(0);
    
    // Check that pricing amounts have tabular-nums
    const priceAmounts = page.locator('.tabular-nums');
    const priceCount = await priceAmounts.count();
    expect(priceCount).toBeGreaterThan(0);
    
    // Verify that measure-pricing text doesn't exceed expected width
    for (let i = 0; i < Math.min(descriptionCount, 4); i++) {
      const description = descriptions.nth(i);
      const box = await description.boundingBox();
      if (box) {
        // measure-pricing should be max 46ch, roughly ~600px at normal font size
        expect(box.width).toBeLessThanOrEqual(700);
      }
    }
  });
  
  test('pricing layout containers have proper spacing', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Check that pricing section has max-w-6xl container
    const pricingSection = page.locator('#pricing');
    const sectionBox = await pricingSection.boundingBox();
    
    // Check that inner container has max-w-6xl (should be ~1152px max)
    const container = page.locator('#pricing .max-w-6xl').first();
    const containerBox = await container.boundingBox();
    
    if (containerBox) {
      // Container should not exceed max-width plus padding
      expect(containerBox.width).toBeLessThanOrEqual(1200); // 1152px + some padding tolerance
      
      // Container should be centered in viewport
      const viewportCenter = 1920 / 2;
      const containerCenter = containerBox.x + containerBox.width / 2;
      const centerOffset = Math.abs(containerCenter - viewportCenter);
      expect(centerOffset).toBeLessThanOrEqual(50); // Allow some tolerance for padding
    }
  });
  
  test('price display uses nowrap correctly', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Find price display elements
    const priceContainers = page.locator('.price-nowrap');
    const priceCount = await priceContainers.count();
    expect(priceCount).toBeGreaterThan(0);
    
    // Check that price text doesn't wrap
    for (let i = 0; i < Math.min(priceCount, 2); i++) {
      const priceContainer = priceContainers.nth(i);
      
      // Check computed style for white-space: nowrap
      const whiteSpace = await priceContainer.evaluate(el => 
        window.getComputedStyle(el).whiteSpace
      );
      expect(whiteSpace).toBe('nowrap');
      
      // Price should be on single line (height should be consistent)
      const box = await priceContainer.boundingBox();
      if (box) {
        // Height should be reasonable for single line (not wrapped)
        expect(box.height).toBeLessThanOrEqual(80);
      }
    }
  });
  
  test('responsive breakpoint behavior', async ({ page }) => {
    await page.goto('/aio');
    
    // Test tablet breakpoint (1024px)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    const card1 = page.locator('[data-index="0"]').first();
    const card2 = page.locator('[data-index="1"]').first();
    
    const card1Box = await card1.boundingBox();
    const card2Box = await card2.boundingBox();
    
    if (card1Box && card2Box) {
      // On lg breakpoint, should still have 2-column layout
      const widthDifference = Math.abs(card1Box.width - card2Box.width);
      expect(widthDifference).toBeLessThanOrEqual(4);
      
      // Cards should be side by side (x positions differ significantly)
      const horizontalGap = Math.abs(card1Box.x - card2Box.x);
      expect(horizontalGap).toBeGreaterThan(100); // Should be side by side, not stacked
    }
    
    // Test mobile breakpoint (375px) - should stack
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    const mobileCard1Box = await card1.boundingBox();
    const mobileCard2Box = await card2.boundingBox();
    
    if (mobileCard1Box && mobileCard2Box) {
      // On mobile, cards should be in horizontal scroll (similar x positions)
      const mobileHorizontalGap = Math.abs(mobileCard1Box.x - mobileCard2Box.x);
      expect(mobileHorizontalGap).toBeGreaterThan(200); // Cards should be in horizontal scroll
    }
  });
});