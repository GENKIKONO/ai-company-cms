import { test, expect } from '@playwright/test';

/**
 * Security Headers E2E Tests
 * セキュリティヘッダーの存在とCSP/HSTSの動作確認
 */

test.describe('Security Headers Verification', () => {
  test('should have HSTS header on main page', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    
    // Development環境ではHSTSヘッダーは設定されない
    if (process.env.NODE_ENV === 'production') {
      expect(headers['strict-transport-security']).toContain('max-age=31536000');
    }
  });

  test('should have CSP header on all pages', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/about'];
    
    for (const path of pagesToTest) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      
      const headers = response?.headers() || {};
      expect(headers['content-security-policy']).toBeDefined();
      expect(headers['content-security-policy']).toContain("default-src 'self'");
    }
  });

  test('should have comprehensive security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    
    // Basic security headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    
    // Cross-Origin policies
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
    
    // Permissions Policy
    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
  });

  test('should have response time header', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    expect(headers['x-response-time']).toMatch(/\d+ms/);
  });
});