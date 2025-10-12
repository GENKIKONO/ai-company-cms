import { test, expect } from '@playwright/test';

test.describe('CTA Button Size Consistency', () => {
  test('all main CTA buttons have unified 52px height', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test homepage CTA buttons
    const homepageCtaButtons = await page.locator('.cta-nowrap').all();
    
    for (const button of homepageCtaButtons) {
      const minHeight = await button.evaluate((el) => 
        getComputedStyle(el).minHeight
      );
      expect(minHeight).toBe('52px');
      
      // Also check that actual height meets or exceeds 52px
      const actualHeight = await button.evaluate((el) => 
        el.getBoundingClientRect().height
      );
      expect(actualHeight).toBeGreaterThanOrEqual(52);
    }
  });

  test('pricing table CTA buttons have unified 52px height', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    // Test pricing table CTA buttons
    const pricingCtaButtons = page.locator('.ui-flat');
    const buttonCount = await pricingCtaButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = pricingCtaButtons.nth(i);
      
      // Check if this is a main CTA button (not a small secondary button)
      const classList = await button.evaluate((el) => el.className);
      if (classList.includes('px-4') || classList.includes('px-6')) {
        const minHeight = await button.evaluate((el) => 
          getComputedStyle(el).minHeight
        );
        expect(minHeight).toBe('52px');
        
        // Check actual height
        const actualHeight = await button.evaluate((el) => 
          el.getBoundingClientRect().height
        );
        expect(actualHeight).toBeGreaterThanOrEqual(52);
      }
    }
  });

  test('AIO page CTA buttons have unified 52px height', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Test AIO page CTA buttons
    const aioCtaButtons = page.locator('.cta-nowrap');
    const buttonCount = await aioCtaButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = aioCtaButtons.nth(i);
      const minHeight = await button.evaluate((el) => 
        getComputedStyle(el).minHeight
      );
      expect(minHeight).toBe('52px');
      
      // Check actual height
      const actualHeight = await button.evaluate((el) => 
        el.getBoundingClientRect().height
      );
      expect(actualHeight).toBeGreaterThanOrEqual(52);
    }
  });

  test('無料で始める buttons have nowrap behavior', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find buttons containing "無料で始める" text
    const freeStartButtons = page.locator('text=無料で始める');
    const buttonCount = await freeStartButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = freeStartButtons.nth(i);
      
      // Check if parent or element has nowrap styling
      const whiteSpace = await button.evaluate((el) => {
        // Check the element itself and its parent
        const elementStyle = getComputedStyle(el);
        const parentStyle = getComputedStyle(el.parentElement || el);
        
        return {
          element: elementStyle.whiteSpace,
          parent: parentStyle.whiteSpace
        };
      });
      
      // Should have nowrap or the parent should have cta-nowrap class
      const hasNowrapClass = await button.evaluate((el) => {
        const element = el.closest('.cta-nowrap');
        return element !== null;
      });
      
      expect(hasNowrapClass || whiteSpace.element === 'nowrap' || whiteSpace.parent === 'nowrap').toBe(true);
    }
  });

  test('CTA button heights are consistent across different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1024, height: 768 },  // Desktop
      { width: 1920, height: 1080 }  // Large desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const ctaButtons = page.locator('.cta-nowrap');
      const buttonCount = await ctaButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = ctaButtons.nth(i);
        const actualHeight = await button.evaluate((el) => 
          el.getBoundingClientRect().height
        );
        
        // Height should be at least 52px on all viewports
        expect(actualHeight).toBeGreaterThanOrEqual(52);
      }
    }
  });

  test('CTA buttons maintain proper padding and spacing with 52px height', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const ctaButtons = page.locator('.cta-nowrap');
    const buttonCount = await ctaButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i);
      
      const styles = await button.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
          height: el.getBoundingClientRect().height,
          minHeight: computed.minHeight
        };
      });
      
      // Ensure proper padding is maintained
      expect(parseInt(styles.paddingTop)).toBeGreaterThan(0);
      expect(parseInt(styles.paddingBottom)).toBeGreaterThan(0);
      expect(parseInt(styles.paddingLeft)).toBeGreaterThan(0);
      expect(parseInt(styles.paddingRight)).toBeGreaterThan(0);
      
      // Ensure height constraint is working
      expect(styles.minHeight).toBe('52px');
      expect(styles.height).toBeGreaterThanOrEqual(52);
    }
  });

  test('CTA buttons are accessible with proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const ctaButtons = page.locator('.cta-nowrap');
    const buttonCount = await ctaButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i);
      
      // Check if it's a link or button element
      const tagName = await button.evaluate((el) => el.tagName.toLowerCase());
      
      if (tagName === 'a') {
        // Links should have proper href
        const href = await button.getAttribute('href');
        expect(href).toBeTruthy();
      }
      
      // Should have proper text content
      const textContent = await button.textContent();
      expect(textContent?.trim()).toBeTruthy();
      
      // Should be focusable
      await button.focus();
      await expect(button).toBeFocused();
    }
  });
});