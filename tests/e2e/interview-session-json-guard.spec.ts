/**
 * Interview Session JSON Response Guard Tests
 * Validates that the interview session page handles malformed/non-JSON API responses gracefully
 */

import { test, expect } from '@playwright/test';

test.describe('Interview Session JSON Guard Tests', () => {
  
  test('should not crash on invalid session ID without JSON response crashes', async ({ page }) => {
    // Listen for all requests to identify 500 sources
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        console.log(`REQUEST: ${response.url()} - STATUS: ${response.status()}`);
        try {
          const body = await response.text();
          console.log(`RESPONSE BODY: ${body.substring(0, 200)}`);
        } catch (e) {
          console.log(`RESPONSE BODY: Unable to read - ${e}`);
        }
      }
    });

    // Visit interview session page with invalid UUID
    const response = await page.goto('/dashboard/interview/00000000-0000-0000-0000-000000000000');
    
    console.log(`MAIN RESPONSE: URL=${response?.url()} STATUS=${response?.status()}`);
    
    // Should not return 500 (server crash) - 401/403/404 are acceptable
    expect(response?.status()).not.toBe(500);
    expect([200, 401, 403, 404]).toContain(response?.status() || 200);
    
    // Page should be visible (not white screen)
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some form of error handling (not crash)
    const hasErrorContent = await page.locator('text=エラー, text=見つかりません, text=アクセス, text=認証, text=ログイン').count() > 0;
    const hasLoginRedirect = page.url().includes('/login');
    
    // Either shows error message or redirects to login (both are acceptable)
    expect(hasErrorContent || hasLoginRedirect).toBe(true);
  });

  test('should handle route access without JSON parsing crashes', async ({ page }) => {
    // Listen for all requests to identify 500 sources
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        console.log(`REQUEST: ${response.url()} - STATUS: ${response.status()}`);
        try {
          const body = await response.text();
          console.log(`RESPONSE BODY: ${body.substring(0, 200)}`);
        } catch (e) {
          console.log(`RESPONSE BODY: Unable to read - ${e}`);
        }
      }
    });

    // Test that page doesn't crash on initial route access
    const response = await page.goto('/dashboard/interview/session-test-id');
    
    console.log(`MAIN RESPONSE: URL=${response?.url()} STATUS=${response?.status()}`);
    
    // Should not be server error - 401/403/404 are acceptable
    expect(response?.status()).not.toBe(500);
    expect([200, 401, 403, 404]).toContain(response?.status() || 200);
    
    // Page should render something (not blank)
    await expect(page.locator('body')).toBeVisible();
    const bodyContent = await page.locator('body *').count();
    expect(bodyContent).toBeGreaterThan(0);
  });
});