import { test, expect } from '@playwright/test';

test.describe('HorizontalScroller Dots Visibility', () => {
  test('dots are visible and update correctly on all slides', async ({ page }) => {
    await page.goto('/aio');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Only test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Wait for HorizontalScroller to be visible
    const scroller = page.locator('[aria-label="料金プラン"]');
    await expect(scroller).toBeVisible();
    
    // Check if dots are present
    const dotsContainer = page.locator('[role="tablist"][aria-label="ページインジケーター"]');
    await expect(dotsContainer).toBeVisible();
    
    // Get all dot buttons
    const dots = dotsContainer.locator('button[role="tab"]');
    const dotCount = await dots.count();
    
    // Should have at least 2 dots for pricing plans
    expect(dotCount).toBeGreaterThanOrEqual(2);
    
    // Check first dot is active initially
    const firstDot = dots.nth(0);
    await expect(firstDot).toHaveAttribute('aria-selected', 'true');
    
    // Swipe to second slide
    const scrollerElement = scroller.locator('.flex').first();
    await scrollerElement.hover();
    await page.mouse.down();
    await page.mouse.move(-200, 0);
    await page.mouse.up();
    
    // Wait for scroll animation
    await page.waitForTimeout(500);
    
    // Check that dots are still visible on second slide
    await expect(dotsContainer).toBeVisible();
    
    // Check second dot becomes active
    const secondDot = dots.nth(1);
    await expect(secondDot).toHaveAttribute('aria-selected', 'true');
    
    // Check first dot is no longer active
    await expect(firstDot).toHaveAttribute('aria-selected', 'false');
    
    // Test clicking dots for navigation
    await firstDot.click();
    await page.waitForTimeout(300);
    await expect(firstDot).toHaveAttribute('aria-selected', 'true');
    await expect(secondDot).toHaveAttribute('aria-selected', 'false');
    
    // Verify dots have proper z-index (should be above cards but below FAB)
    const dotsZIndex = await dotsContainer.evaluate(el => window.getComputedStyle(el).zIndex);
    expect(parseInt(dotsZIndex)).toBeGreaterThanOrEqual(900);
    expect(parseInt(dotsZIndex)).toBeLessThan(1000);
  });
  
  test('dots have proper styling and hover states', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    const dotsContainer = page.locator('[role="tablist"][aria-label="ページインジケーター"]');
    await expect(dotsContainer).toBeVisible();
    
    const dots = dotsContainer.locator('button[role="tab"]');
    const firstDot = dots.nth(0);
    
    // Check initial opacity (should have fade effect)
    const initialOpacity = await firstDot.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(initialOpacity)).toBeGreaterThanOrEqual(0.6);
    
    // Hover should increase opacity
    await firstDot.hover();
    const hoverOpacity = await firstDot.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(hoverOpacity)).toBeGreaterThan(parseFloat(initialOpacity));
  });
});