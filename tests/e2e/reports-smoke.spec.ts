/**
 * Reports Page Smoke Test
 * Tests that reports page loads without 500/404 errors
 */

import { test, expect } from '@playwright/test';

test.describe('Reports Page Smoke Tests', () => {
  test('Reports page should redirect gracefully when not authenticated', async ({ page }) => {
    // Navigate to reports page
    const response = await page.goto('/dashboard/reports');
    
    // Should not return 500 or 404 error
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
    
    // Should return valid status codes (200 for success, or 30x for redirects)
    expect([200, 301, 302, 303, 307, 308].includes(response?.status() || 0)).toBeTruthy();
    
    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded');
    
    // Page should load some content (either reports content or auth redirect)
    const bodyContent = await page.locator('body').textContent();
    
    // Should have some meaningful content (not empty or just whitespace)
    expect(bodyContent).toBeDefined();
    expect(bodyContent!.length).toBeGreaterThan(0);
    
    // Should contain either reports content or auth/login content
    const hasExpectedContent = bodyContent!.includes('月次レポート') ||
                                bodyContent!.includes('Reports') ||
                                bodyContent!.includes('AIO Hub') ||
                                bodyContent!.includes('ログイン') ||
                                bodyContent!.includes('読み込み中');
    
    expect(hasExpectedContent).toBeTruthy();
  });

  test('Reports page should not have JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Capture any JavaScript errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Navigate to the page
    await page.goto('/dashboard/reports');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Should not have any JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('Page navigation should work without crashing', async ({ page }) => {
    // Try to navigate to reports page
    await page.goto('/dashboard/reports');
    
    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');
    
    // Page should be functional (either showing content or auth flow)
    const currentUrl = page.url();
    
    // URL should be either the reports page or auth redirect
    const isValidUrl = currentUrl.includes('/dashboard/reports') ||
                       currentUrl.includes('/auth/login') ||
                       currentUrl.includes('/auth/signup');
    
    expect(isValidUrl).toBeTruthy();
    
    // Page should be interactive (no frozen states)
    const bodyElement = await page.locator('body').isVisible();
    expect(bodyElement).toBeTruthy();
  });
});