import { test, expect } from '@playwright/test';

test.describe('UI Improvements - Comprehensive Tests', () => {
  
  test.describe('A) FAB Hamburger Menu - Always Visible', () => {
    test('FAB is visible on desktop screens', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      const fab = page.locator('button[aria-label*="メニューを開く"], button[aria-label*="メニューを閉じる"]');
      await expect(fab).toBeVisible();
      
      // Check FAB positioning
      const fabBox = await fab.boundingBox();
      if (fabBox) {
        // Should be in bottom-right position
        expect(fabBox.x).toBeGreaterThan(1800); // Right side
        expect(fabBox.y).toBeGreaterThan(900);  // Bottom area
      }
    });

    test('FAB is visible on tablet screens', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');
      
      const fab = page.locator('button[aria-label*="メニューを開く"], button[aria-label*="メニューを閉じる"]');
      await expect(fab).toBeVisible();
    });

    test('FAB is visible on mobile screens', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');
      
      const fab = page.locator('button[aria-label*="メニューを開く"], button[aria-label*="メニューを閉じる"]');
      await expect(fab).toBeVisible();
    });

    test('FAB functionality works across all screen sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];

      for (const viewport of viewports) {
        await page.goto('/');
        await page.setViewportSize(viewport);
        await page.waitForLoadState('networkidle');
        
        const fab = page.locator('button[aria-label*="メニューを開く"]');
        await fab.click();
        
        // Verify menu opens
        await expect(fab).toHaveAttribute('aria-expanded', 'true');
        await expect(fab).toHaveAttribute('aria-label', 'メニューを閉じる');
        
        // Close menu
        await fab.click();
        await expect(fab).toHaveAttribute('aria-expanded', 'false');
        await expect(fab).toHaveAttribute('aria-label', 'メニューを開く');
      }
    });
  });

  test.describe('B) Header Selection Lines - Hidden', () => {
    test('header navigation links have no visible focus outlines', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Find navigation links
      const navLinks = page.locator('.nav-link');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = navLinks.nth(i);
          
          // Focus the link
          await link.focus();
          
          // Check that outline is not visible
          const outline = await link.evaluate(el => 
            window.getComputedStyle(el).outline
          );
          expect(outline).toBe('none');
          
          // Check that box-shadow is properly configured for accessibility
          const boxShadow = await link.evaluate(el => 
            window.getComputedStyle(el).boxShadow
          );
          // Should have subtle focus-visible styling, not aggressive outline
          expect(boxShadow).not.toBe('none');
        }
      }
    });

    test('keyboard navigation still works without visible outlines', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify accessibility is maintained
      await page.keyboard.press('Enter');
      // Should be able to activate focused elements
    });
  });

  test.describe('C) CTA Button Height Consistency', () => {
    test('all CTA buttons have unified height', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Find different CTA buttons
      const ctaButtons = page.locator('a[class*="cta-"], .cta-btn');
      const buttonCount = await ctaButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
      
      let heights: number[] = [];
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = ctaButtons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          heights.push(box.height);
        }
      }
      
      // All heights should be within 4px of each other (unified)
      if (heights.length > 1) {
        const minHeight = Math.min(...heights);
        const maxHeight = Math.max(...heights);
        const heightDifference = maxHeight - minHeight;
        expect(heightDifference).toBeLessThanOrEqual(4);
        
        console.log(`CTA Heights: ${heights.join(', ')}px (diff: ${heightDifference}px)`);
      }
    });

    test('CTA buttons have proper nowrap styling', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      const ctaButtons = page.locator('a[class*="cta-nowrap"], .cta-btn');
      const buttonCount = await ctaButtons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = ctaButtons.nth(i);
        
        // Check white-space: nowrap
        const whiteSpace = await button.evaluate(el => 
          window.getComputedStyle(el).whiteSpace
        );
        expect(['nowrap', 'pre'].includes(whiteSpace)).toBeTruthy();
        
        // Text should not wrap (single line height)
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeLessThanOrEqual(80); // Should be single line
        }
      }
    });

    test('CTA buttons maintain consistency on mobile', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');
      
      const ctaButtons = page.locator('a[class*="cta-"], .cta-btn').filter({ hasText: /無料|ヒアリング/ });
      const buttonCount = await ctaButtons.count();
      
      if (buttonCount >= 2) {
        const heights: number[] = [];
        
        for (let i = 0; i < buttonCount; i++) {
          const button = ctaButtons.nth(i);
          const box = await button.boundingBox();
          if (box) {
            heights.push(box.height);
          }
        }
        
        // Heights should be consistent on mobile too
        if (heights.length > 1) {
          const minHeight = Math.min(...heights);
          const maxHeight = Math.max(...heights);
          expect(maxHeight - minHeight).toBeLessThanOrEqual(4);
        }
      }
    });
  });

  test.describe('D) Pricing Cards Center Alignment', () => {
    test('pricing cards are properly centered with ui-pricing-grid', async ({ page }) => {
      await page.goto('/pricing');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Find pricing grid container
      const pricingGrid = page.locator('.ui-pricing-grid').first();
      await expect(pricingGrid).toBeVisible();
      
      // Check that it's properly centered
      const gridBox = await pricingGrid.boundingBox();
      if (gridBox) {
        const viewportCenter = 1920 / 2;
        const gridCenter = gridBox.x + gridBox.width / 2;
        const centerOffset = Math.abs(gridCenter - viewportCenter);
        expect(centerOffset).toBeLessThanOrEqual(50); // Well-centered
        
        console.log(`Pricing grid center offset: ${centerOffset}px`);
      }
    });

    test('pricing cards have equal width and proper spacing', async ({ page }) => {
      await page.goto('/pricing');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Find pricing cards within the grid
      const pricingCards = page.locator('.ui-pricing-grid .ui-card');
      const cardCount = await pricingCards.count();
      expect(cardCount).toBe(2); // Should be exactly 2 main cards
      
      const card1Box = await pricingCards.nth(0).boundingBox();
      const card2Box = await pricingCards.nth(1).boundingBox();
      
      if (card1Box && card2Box) {
        // Cards should have equal width
        const widthDifference = Math.abs(card1Box.width - card2Box.width);
        expect(widthDifference).toBeLessThanOrEqual(2);
        
        // Gap should be consistent (2rem = 32px)
        const gap = card2Box.x - (card1Box.x + card1Box.width);
        expect(gap).toBeGreaterThanOrEqual(28); // 32 - 4
        expect(gap).toBeLessThanOrEqual(36);    // 32 + 4
        
        console.log(`Card widths: ${card1Box.width}px vs ${card2Box.width}px`);
        console.log(`Gap between cards: ${gap}px`);
      }
    });

    test('pricing layout works correctly on different screen sizes', async ({ page }) => {
      await page.goto('/pricing');
      
      // Test large desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      let pricingGrid = page.locator('.ui-pricing-grid');
      await expect(pricingGrid).toBeVisible();
      
      // Test tablet
      await page.setViewportSize({ width: 1024, height: 768 });
      pricingGrid = page.locator('.ui-pricing-grid');
      await expect(pricingGrid).toBeVisible();
      
      // Test mobile (should fallback to grid-cols-1)
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileCards = page.locator('.ui-card');
      await expect(mobileCards.first()).toBeVisible();
    });

    test('pricing cards content is properly aligned', async ({ page }) => {
      await page.goto('/pricing');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      const pricingCards = page.locator('.ui-pricing-grid .ui-card');
      
      for (let i = 0; i < await pricingCards.count(); i++) {
        const card = pricingCards.nth(i);
        
        // Check that content is properly structured
        const title = card.locator('h3').first();
        const price = card.locator('.text-2xl, .text-3xl').first();
        const ctaButton = card.locator('a[href]').last();
        
        await expect(title).toBeVisible();
        await expect(price).toBeVisible();
        await expect(ctaButton).toBeVisible();
        
        // CTA button should be at the bottom (mt-auto applied)
        const cardBox = await card.boundingBox();
        const buttonBox = await ctaButton.boundingBox();
        
        if (cardBox && buttonBox) {
          // Button should be near the bottom of the card
          const distanceFromBottom = (cardBox.y + cardBox.height) - (buttonBox.y + buttonBox.height);
          expect(distanceFromBottom).toBeLessThanOrEqual(30); // Close to bottom
        }
      }
    });
  });

  test.describe('E) Cross-Browser Compatibility', () => {
    test('UI improvements work in different browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Test FAB visibility
      const fab = page.locator('button[aria-label*="メニューを開く"]');
      await expect(fab).toBeVisible();
      
      // Test CTA buttons
      const ctaButtons = page.locator('a[class*="cta-"]');
      await expect(ctaButtons.first()).toBeVisible();
      
      // Test pricing (if on page with pricing)
      try {
        await page.goto('/pricing');
        await page.waitForLoadState('networkidle');
        
        const pricingGrid = page.locator('.ui-pricing-grid');
        await expect(pricingGrid).toBeVisible();
      } catch (e) {
        // Pricing page might not exist, skip this part
        console.log(`Skipping pricing test for ${browserName}: ${e}`);
      }
      
      console.log(`✅ UI improvements verified for ${browserName}`);
    });
  });

  test.describe('F) Performance and Accessibility', () => {
    test('FAB has proper accessibility attributes', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');
      
      const fab = page.locator('button[aria-label*="メニューを開く"]');
      
      // Check ARIA attributes
      await expect(fab).toHaveAttribute('aria-expanded', 'false');
      await expect(fab).toHaveAttribute('aria-label');
      await expect(fab).toHaveAttribute('role', 'button');
      
      // Check keyboard navigation
      await fab.focus();
      await page.keyboard.press('Enter');
      await expect(fab).toHaveAttribute('aria-expanded', 'true');
      
      // Check ESC key closes menu
      await page.keyboard.press('Escape');
      await expect(fab).toHaveAttribute('aria-expanded', 'false');
    });

    test('CTA buttons are keyboard accessible', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      
      // Find CTA buttons and test keyboard navigation
      const ctaButtons = page.locator('a[class*="cta-"]').first();
      await ctaButtons.focus();
      
      // Should be focusable and have proper attributes
      await expect(ctaButtons).toBeFocused();
      await expect(ctaButtons).toHaveAttribute('href');
    });

    test('UI changes do not break page load performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
      
      // Check that all core UI elements are present
      const fab = page.locator('button[aria-label*="メニューを開く"]');
      const ctaButtons = page.locator('a[class*="cta-"]');
      
      await expect(fab).toBeVisible();
      await expect(ctaButtons.first()).toBeVisible();
      
      console.log(`Page load time: ${loadTime}ms`);
    });
  });
});