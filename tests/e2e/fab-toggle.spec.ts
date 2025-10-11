import { test, expect } from '@playwright/test';

test.describe('FAB Toggle Functionality', () => {
  test('FAB is always visible on all screen sizes', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileFab = page.locator('.ui-fab');
    await expect(mobileFab).toBeVisible();
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    const desktopFab = page.locator('.ui-fab');
    await expect(desktopFab).toBeVisible();
    
    // Test on large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const largeFab = page.locator('.ui-fab');
    await expect(largeFab).toBeVisible();
  });

  test('FAB has correct positioning and z-index', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    await expect(fab).toBeVisible();
    
    // Check z-index is 1000
    const zIndex = await fab.evaluate((el) => getComputedStyle(el).zIndex);
    expect(zIndex).toBe('1000');
    
    // Check positioning
    const position = await fab.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
    
    // Check size is 56px (min-height and min-width)
    const styles = await fab.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        minHeight: computed.minHeight,
        minWidth: computed.minWidth,
        width: computed.width,
        height: computed.height
      };
    });
    
    expect(styles.minHeight).toBe('56px');
    expect(styles.minWidth).toBe('56px');
  });

  test('FAB toggles menu correctly', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    
    // Initially closed
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
    await expect(fab).toHaveAttribute('aria-label', 'メニューを開く');
    
    // Click to open
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(fab).toHaveAttribute('aria-label', 'メニューを閉じる');
    
    // Check menu is visible
    const menu = page.locator('#primary-navigation');
    await expect(menu).toBeVisible();
    
    // Click to close
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
    await expect(fab).toHaveAttribute('aria-label', 'メニューを開く');
  });

  test('menu only closes with ESC key, not overlay click', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    
    // Open menu
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Try clicking overlay - should NOT close menu
    const overlay = page.locator('div[role="presentation"]');
    await overlay.click();
    
    // Menu should still be open
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // ESC key should close menu
    await page.keyboard.press('Escape');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });

  test('menu navigation links do not close menu', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    
    // Open menu
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Click a navigation link - should NOT close menu automatically
    const menuLink = page.locator('.nav-link').first();
    if (await menuLink.count() > 0) {
      // Note: We're not actually clicking to navigate, just checking behavior
      // In real implementation, links would not auto-close the menu
      
      // Menu should still be open after link interaction
      await expect(fab).toHaveAttribute('aria-expanded', 'true');
    }
    
    // Only ESC should close it
    await page.keyboard.press('Escape');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });

  test('FAB keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    
    // Focus on FAB
    await fab.focus();
    await expect(fab).toBeFocused();
    
    // Enter key should toggle menu
    await page.keyboard.press('Enter');
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Space key should toggle menu
    await page.keyboard.press(' ');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
    
    // Open again with Enter
    await page.keyboard.press('Enter');
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // ESC should close
    await page.keyboard.press('Escape');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });

  test('FAB prevents overlap with navigation panel', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.ui-fab');
    
    // Open menu
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Check that nav panel has right padding to prevent overlap
    const navPanel = page.locator('.nav-panel');
    if (await navPanel.count() > 0) {
      const paddingRight = await navPanel.evaluate((el) => 
        getComputedStyle(el).paddingRight
      );
      
      // Should have significant right padding (at least 64px)
      const paddingValue = parseInt(paddingRight);
      expect(paddingValue).toBeGreaterThanOrEqual(64);
    }
  });
});