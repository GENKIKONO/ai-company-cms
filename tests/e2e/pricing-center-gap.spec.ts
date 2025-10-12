import { test, expect } from '@playwright/test';

test.describe('Pricing Cards Center Alignment and Gap', () => {
  test('pricing cards are properly centered on the page', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Find the pricing grid container
    const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    await expect(pricingGrid).toBeVisible();
    
    // Check that container has proper centering classes
    const containerClasses = await pricingGrid.getAttribute('class');
    expect(containerClasses).toContain('justify-center');
    expect(containerClasses).toContain('mx-auto');
    
    // Check max-width is appropriate for centering
    const maxWidth = await pricingGrid.evaluate((el) => 
      getComputedStyle(el).maxWidth
    );
    // Should be max-w-5xl (1024px)
    expect(maxWidth).toBe('1024px');
  });

  test('pricing cards have consistent gap spacing', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Set desktop viewport to ensure 2-column layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    
    // Check gap classes
    const containerClasses = await pricingGrid.getAttribute('class');
    expect(containerClasses).toContain('gap-20');
    expect(containerClasses).toContain('lg:gap-24');
    
    // Verify actual gap spacing
    const gap = await pricingGrid.evaluate((el) => 
      getComputedStyle(el).gap
    );
    // On desktop should be 96px (gap-24)
    expect(gap).toBe('96px');
  });

  test('pricing cards maintain 2-column layout on desktop', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const pricingCards = page.locator('.ui-card');
    const cardCount = await pricingCards.count();
    
    // Should have exactly 2 main pricing cards (Free and Starter)
    expect(cardCount).toBe(2);
    
    // Check that cards are in a grid layout
    const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    const gridCols = await pricingGrid.evaluate((el) => 
      getComputedStyle(el).gridTemplateColumns
    );
    
    // Should have 2 equal columns on desktop
    expect(gridCols).toBe('repeat(2, minmax(0, 1fr))');
  });

  test('pricing cards stack on mobile viewport', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    const gridCols = await pricingGrid.evaluate((el) => 
      getComputedStyle(el).gridTemplateColumns
    );
    
    // Should have 1 column on mobile
    expect(gridCols).toBe('repeat(1, minmax(0, 1fr))');
    
    // Gap should be smaller on mobile
    const gap = await pricingGrid.evaluate((el) => 
      getComputedStyle(el).gap
    );
    expect(gap).toBe('80px'); // gap-20
  });

  test('pricing cards are visually centered within viewport', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    const gridBounds = await pricingGrid.boundingBox();
    
    if (gridBounds) {
      const viewportWidth = 1200;
      const gridCenter = gridBounds.x + (gridBounds.width / 2);
      const viewportCenter = viewportWidth / 2;
      
      // Grid should be centered within reasonable tolerance (±50px)
      const centerDifference = Math.abs(gridCenter - viewportCenter);
      expect(centerDifference).toBeLessThan(50);
    }
  });

  test('pricing cards have proper card styling and spacing', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const pricingCards = page.locator('.ui-card');
    const cardCount = await pricingCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = pricingCards.nth(i);
      
      // Check card has proper styling classes
      const cardClasses = await card.getAttribute('class');
      expect(cardClasses).toContain('ui-card');
      expect(cardClasses).toContain('flex');
      expect(cardClasses).toContain('flex-col');
      expect(cardClasses).toContain('rounded-2xl');
      expect(cardClasses).toContain('p-6');
      
      // Check card has reasonable dimensions
      const cardBounds = await card.boundingBox();
      if (cardBounds) {
        expect(cardBounds.width).toBeGreaterThan(200);
        expect(cardBounds.height).toBeGreaterThan(300);
      }
    }
  });

  test('popular badge positioning on centered cards', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Find the popular card (should be Starter plan)
    const popularBadge = page.locator('span:has-text("人気")');
    if (await popularBadge.count() > 0) {
      await expect(popularBadge).toBeVisible();
      
      // Check badge positioning
      const badgeClasses = await popularBadge.getAttribute('class');
      expect(badgeClasses).toContain('absolute');
      expect(badgeClasses).toContain('-top-4');
      expect(badgeClasses).toContain('left-1/2');
      expect(badgeClasses).toContain('-translate-x-1/2');
      
      // Badge should be properly centered above its card
      const badgeBounds = await popularBadge.boundingBox();
      expect(badgeBounds).toBeTruthy();
    }
  });

  test('pricing section responsive behavior', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { width: 375, height: 667, expectedCols: 1 },
      { width: 768, height: 1024, expectedCols: 1 },
      { width: 1024, height: 768, expectedCols: 2 },
      { width: 1200, height: 800, expectedCols: 2 },
      { width: 1920, height: 1080, expectedCols: 2 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100); // Brief wait for responsive changes
      
      const pricingGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
      const gridCols = await pricingGrid.evaluate((el) => 
        getComputedStyle(el).gridTemplateColumns
      );
      
      if (viewport.expectedCols === 1) {
        expect(gridCols).toBe('repeat(1, minmax(0, 1fr))');
      } else {
        expect(gridCols).toBe('repeat(2, minmax(0, 1fr))');
      }
    }
  });

  test('additional plans link is properly centered below cards', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Find the additional plans section
    const additionalPlansSection = page.locator('text=その他のプラン（Business・Enterprise）はお問い合わせください').locator('..');
    if (await additionalPlansSection.count() > 0) {
      const sectionClasses = await additionalPlansSection.getAttribute('class');
      expect(sectionClasses).toContain('text-center');
      
      // Check the link has proper styling
      const detailsLink = page.locator('text=詳細プランを見る');
      await expect(detailsLink).toBeVisible();
      
      const linkClasses = await detailsLink.getAttribute('class');
      expect(linkClasses).toContain('ui-flat');
      expect(linkClasses).toContain('min-h-[52px]');
    }
  });
});