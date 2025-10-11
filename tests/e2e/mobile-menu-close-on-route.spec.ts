import { test, expect } from '@playwright/test';

test.describe('Mobile Menu Route Change Behavior', () => {
  test('menu closes automatically on route navigation', async ({ page }) => {
    await page.goto('/aio');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu using FAB
    const fab = page.locator('button[aria-label*="メニューを開く"]');
    await expect(fab).toBeVisible();
    await fab.click();
    
    // Verify menu is open
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(fab).toHaveAttribute('aria-label', 'メニューを閉じる');
    
    // Check that body scroll is locked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');
    
    // Click on a navigation link that would cause route change
    // Assuming there's a link to hearing-service or another page
    const menuLink = page.locator('a[href="/hearing-service"]').first();
    if (await menuLink.count() > 0) {
      await menuLink.click();
      
      // Wait for navigation
      await page.waitForURL('**/hearing-service**');
      
      // Verify menu auto-closed
      const newFab = page.locator('button[aria-label*="メニューを開く"]');
      await expect(newFab).toBeVisible();
      await expect(newFab).toHaveAttribute('aria-expanded', 'false');
      
      // Check that body scroll is unlocked
      const newBodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(newBodyOverflow).not.toBe('hidden');
    }
  });
  
  test('menu closes on browser back/forward navigation', async ({ page }) => {
    // Start on hearing-service page
    await page.goto('/hearing-service');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to AIO page via browser navigation
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const fab = page.locator('button[aria-label*="メニューを開く"]');
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Menu should be closed on the previous page
    const backPageFab = page.locator('button[aria-label*="メニューを開く"]');
    await expect(backPageFab).toBeVisible();
    await expect(backPageFab).toHaveAttribute('aria-expanded', 'false');
    
    // Body scroll should be unlocked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).not.toBe('hidden');
  });
  
  test('menu state persists correctly across interactions', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    
    const fab = page.locator('button[aria-label*="メニューを開く"]');
    
    // Test multiple open/close cycles
    for (let i = 0; i < 3; i++) {
      // Open menu
      await fab.click();
      await expect(fab).toHaveAttribute('aria-expanded', 'true');
      
      // Close menu with ESC key
      await page.keyboard.press('Escape');
      await expect(fab).toHaveAttribute('aria-expanded', 'false');
      
      // Verify scroll is unlocked
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).not.toBe('hidden');
    }
  });
  
  test('menu closes when clicking outside overlay', async ({ page }) => {
    await page.goto('/aio');
    await page.setViewportSize({ width: 375, height: 667 });
    
    const fab = page.locator('button[aria-label*="メニューを開く"]');
    await fab.click();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    
    // Click outside the menu (on main content)
    const mainContent = page.locator('main').first();
    if (await mainContent.count() > 0) {
      await mainContent.click({ position: { x: 100, y: 100 } });
      
      // Menu should close
      await expect(fab).toHaveAttribute('aria-expanded', 'false');
      
      // Scroll should be unlocked
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).not.toBe('hidden');
    }
  });
});