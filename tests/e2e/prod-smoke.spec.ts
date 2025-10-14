import { test, expect, type Page } from '@playwright/test';

/**
 * Production Smoke Tests for AIO Hub (https://aiohub.jp)
 * 
 * READ-ONLY monitoring tests to verify:
 * - Public page availability
 * - SEO meta tags and structured data
 * - Static asset loading
 * - Authentication flow (temporary user)
 * - Security redirects
 * 
 * PROHIBITED OPERATIONS:
 * - No database writes
 * - No destructive operations
 * - No billing/Stripe interactions
 */

const PRODUCTION_DOMAIN = 'https://aiohub.jp';

const PUBLIC_PAGES = [
  '/',
  '/aio',
  '/pricing', 
  '/hearing-service',
  '/o/luxucare', // Representative organization page
];

const REQUIRED_ASSETS = [
  '/favicon.ico',
  '/_next/static/css/', // CSS bundles (partial path)
  // Note: Exact asset paths may vary due to Next.js build hashing
];

test.describe('Production Smoke Tests - AIO Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production environment
    test.setTimeout(60000);
    
    // Set user agent for monitoring identification
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (compatible; AIoHub-SmokeTest/1.0; +https://aiohub.jp/monitoring)'
    });
  });

  test.describe('Public Page Availability', () => {
    for (const pagePath of PUBLIC_PAGES) {
      test(`${pagePath} returns 200 and loads successfully`, async ({ page }) => {
        const response = await page.goto(`${PRODUCTION_DOMAIN}${pagePath}`);
        
        expect(response?.status()).toBe(200);
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        
        // Verify page has content (not blank)
        const bodyText = await page.textContent('body');
        expect(bodyText?.length).toBeGreaterThan(100);
        
        // Verify no obvious error messages
        const hasErrorText = await page.getByText('Error').first().isVisible().catch(() => false);
        expect(hasErrorText).toBe(false);
      });
    }
  });

  test.describe('SEO Meta Tags', () => {
    for (const pagePath of PUBLIC_PAGES) {
      test(`${pagePath} has canonical tag`, async ({ page }) => {
        await page.goto(`${PRODUCTION_DOMAIN}${pagePath}`);
        
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        expect(canonical).toContain(PRODUCTION_DOMAIN);
      });
    }

    test('Home page has basic meta tags', async ({ page }) => {
      await page.goto(PRODUCTION_DOMAIN);
      
      // Title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      
      // Description
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
      
      // Open Graph
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle).toBeTruthy();
    });
  });

  test.describe('Structured Data (JSON-LD)', () => {
    test('Home page has Organization schema', async ({ page }) => {
      await page.goto(PRODUCTION_DOMAIN);
      
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      expect(jsonLdScripts.length).toBeGreaterThan(0);
      
      let hasOrganizationSchema = false;
      
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const data = JSON.parse(content);
            if (data['@context'] && data['@type'] === 'Organization') {
              hasOrganizationSchema = true;
              expect(data['@context']).toContain('schema.org');
              expect(data.name).toBeTruthy();
              break;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      expect(hasOrganizationSchema).toBe(true);
    });

    test('FAQ-related pages have FAQ schema when applicable', async ({ page }) => {
      // Check if FAQ section exists and has proper schema
      await page.goto(`${PRODUCTION_DOMAIN}/aio`);
      
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const data = JSON.parse(content);
            if (data['@type'] === 'FAQPage') {
              expect(data['@context']).toContain('schema.org');
              expect(data.mainEntity).toBeDefined();
              break;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });
  });

  test.describe('Static Assets', () => {
    test('Favicon loads successfully', async ({ page }) => {
      const response = await page.request.get(`${PRODUCTION_DOMAIN}/favicon.ico`);
      expect(response.status()).toBe(200);
    });

    test('Main CSS files load', async ({ page }) => {
      await page.goto(PRODUCTION_DOMAIN);
      
      // Wait for stylesheets to load
      await page.waitForLoadState('networkidle');
      
      const stylesheets = await page.locator('link[rel="stylesheet"]').all();
      expect(stylesheets.length).toBeGreaterThan(0);
      
      // Check at least one stylesheet loads successfully
      let hasWorkingStylesheet = false;
      for (const stylesheet of stylesheets.slice(0, 3)) { // Check first 3
        const href = await stylesheet.getAttribute('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${PRODUCTION_DOMAIN}${href}`;
          const response = await page.request.get(fullUrl);
          if (response.status() === 200) {
            hasWorkingStylesheet = true;
            break;
          }
        }
      }
      expect(hasWorkingStylesheet).toBe(true);
    });
  });

  test.describe('robots.txt and Sitemap', () => {
    test('robots.txt exists and has content', async ({ page }) => {
      const response = await page.request.get(`${PRODUCTION_DOMAIN}/robots.txt`);
      expect(response.status()).toBe(200);
      
      const content = await response.text();
      expect(content).toContain('User-agent:');
      expect(content).toContain('Sitemap:');
    });

    test('Sitemap XML exists', async ({ page }) => {
      const response = await page.request.get(`${PRODUCTION_DOMAIN}/sitemap.xml`);
      expect(response.status()).toBe(200);
      
      const content = await response.text();
      expect(content).toContain('<?xml');
      expect(content).toContain('<urlset');
    });
  });

  test.describe('Authentication Flow', () => {
    test('Login page loads and authentication works', async ({ page }) => {
      // Navigate to login page
      await page.goto(`${PRODUCTION_DOMAIN}/auth/login`);
      expect(page.url()).toContain('/auth/login');
      
      // Wait for form to load
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Fill login credentials (temporary test user)
      const email = process.env.PROD_SMOKE_TEST_EMAIL || 'smoke-test@aiohub.jp';
      const password = process.env.PROD_SMOKE_TEST_PASSWORD || 'TempSmoke123!';
      
      await page.fill('input[type="email"], input[name="email"]', email);
      await page.fill('input[type="password"], input[name="password"]', password);
      
      // Submit form
      await page.click('button[type="submit"], input[type="submit"]');
      
      // Wait for redirect to dashboard or success
      await page.waitForURL(/\/(dashboard|app)/, { timeout: 15000 });
      
      // Verify we're logged in (should see dashboard or user area)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|app)/);
      
      // Logout to clean up session
      const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("ログアウト"), button:has-text("Sign out")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Wait for redirect to public page
        await page.waitForTimeout(2000);
        const finalUrl = page.url();
        expect(finalUrl).not.toMatch(/\/(dashboard|app)/);
      }
    });
  });

  test.describe('Security', () => {
    test('Dashboard requires authentication', async ({ page }) => {
      // Try to access dashboard without login
      const response = await page.goto(`${PRODUCTION_DOMAIN}/dashboard`);
      
      // Should redirect to login or return 401/403
      const currentUrl = page.url();
      const statusCode = response?.status() || 200;
      
      const isRedirectedToAuth = currentUrl.includes('/auth/login') || currentUrl.includes('/login');
      const isUnauthorized = statusCode === 401 || statusCode === 403;
      
      expect(isRedirectedToAuth || isUnauthorized).toBe(true);
    });

    test('Admin routes require proper permissions', async ({ page }) => {
      // Try to access admin area without proper auth
      const response = await page.goto(`${PRODUCTION_DOMAIN}/admin`);
      
      const statusCode = response?.status() || 200;
      const currentUrl = page.url();
      
      // Should be redirected or receive error status
      const isSecured = statusCode >= 400 || currentUrl.includes('/auth/') || currentUrl.includes('/login');
      expect(isSecured).toBe(true);
    });
  });

  test.describe('Core Functionality Check', () => {
    test('Search functionality on public pages', async ({ page }) => {
      await page.goto(`${PRODUCTION_DOMAIN}/aio`);
      
      // Look for search input or functionality
      const searchInput = page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="search"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('AI');
        await page.keyboard.press('Enter');
        
        // Wait for results or response
        await page.waitForTimeout(2000);
        
        // Verify no JavaScript errors occurred
        const hasErrors = await page.locator('.error, [class*="error"]').isVisible().catch(() => false);
        expect(hasErrors).toBe(false);
      }
    });

    test('Navigation menu works', async ({ page }) => {
      await page.goto(PRODUCTION_DOMAIN);
      
      // Check main navigation
      const navLinks = await page.locator('nav a, header a').all();
      expect(navLinks.length).toBeGreaterThan(0);
      
      // Test first few navigation links (avoid external links)
      for (const link of navLinks.slice(0, 3)) {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('mailto:') && !href.includes('tel:')) {
          const linkResponse = await page.request.get(`${PRODUCTION_DOMAIN}${href}`);
          expect(linkResponse.status()).toBe(200);
        }
      }
    });
  });
});