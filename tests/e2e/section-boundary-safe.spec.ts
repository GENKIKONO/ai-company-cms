import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Section Boundary Safe Spacing
 * Tests section boundaries across key pages to ensure proper spacing between sections
 */

const VIEWPORT_SIZES = [
  { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  { width: 414, height: 896, name: 'Mobile (iPhone 11)' },
  { width: 768, height: 1024, name: 'Tablet (iPad)' },
  { width: 1024, height: 768, name: 'Desktop (Small)' },
  { width: 1440, height: 900, name: 'Desktop (Large)' }
];

const TEST_PAGES = [
  { 
    url: '/', 
    name: 'Home Page',
    sections: [
      { selector: '[data-testid="hero-section"], .section-hero-pad', name: 'Hero Section' },
      { selector: '[data-testid="features-section"], .section-safe.surface-fade-btm', name: 'Features Section' },
      { selector: '[data-testid="service-flow"], #service-flow', name: 'Service Flow Section' },
      { selector: '[data-testid="aio-digest"]', name: 'AIO Digest Section' },
      { selector: '[data-testid="representative-message"], .section-safe-top.surface-fade-top', name: 'Representative Message' },
      { selector: '[data-testid="cta-section"], .section-safe-top.section-safe-btm', name: 'CTA Section' },
      { selector: 'footer', name: 'Footer' }
    ]
  },
  {
    url: '/hearing-service',
    name: 'Hearing Service Page',
    sections: [
      { selector: '[data-testid="hero-section"]', name: 'Hero Section' },
      { selector: '[data-testid="pricing-section"], #pricing', name: 'Pricing Section' },
      { selector: '[data-testid="flow-section"]', name: 'Flow Section' },
      { selector: 'footer', name: 'Footer' }
    ]
  },
  {
    url: '/aio',
    name: 'AIO Page',
    sections: [
      { selector: '[data-testid="hero-section"]', name: 'Hero Section' },
      { selector: '[data-testid="flow-section"]', name: 'Flow Section' },
      { selector: '[data-testid="pricing-section"]', name: 'Pricing Section' },
      { selector: 'footer', name: 'Footer' }
    ]
  },
  {
    url: '/pricing',
    name: 'Pricing Page',
    sections: [
      { selector: '[data-testid="pricing-table"], .section-safe-top.section-safe-btm', name: 'Pricing Table' }
    ]
  }
];

for (const page of TEST_PAGES) {
  for (const viewport of VIEWPORT_SIZES) {
    test(`${page.name} - ${viewport.name} - Section Boundary Safe Spacing`, async ({ page: playwright }) => {
      await playwright.setViewportSize({ width: viewport.width, height: viewport.height });
      await playwright.goto(page.url);
      
      // Wait for page to fully load
      await playwright.waitForLoadState('networkidle');
      
      // Define minimum spacing requirements based on viewport
      const isMobile = viewport.width < 768;
      const minSpacing = isMobile ? 28 : 56;
      
      // Test each section boundary
      for (let i = 0; i < page.sections.length - 1; i++) {
        const currentSection = page.sections[i];
        const nextSection = page.sections[i + 1];
        
        // Get sections using multiple selector attempts
        const currentElements = await playwright.locator(currentSection.selector).all();
        const nextElements = await playwright.locator(nextSection.selector).all();
        
        if (currentElements.length === 0 || nextElements.length === 0) {
          console.warn(`Section not found: ${currentSection.name} or ${nextSection.name} on ${page.name}`);
          continue;
        }
        
        const currentElement = currentElements[0];
        const nextElement = nextElements[0];
        
        // Get bounding boxes
        const currentBox = await currentElement.boundingClientRect();
        const nextBox = await nextElement.boundingClientRect();
        
        // Calculate the gap between sections
        const gap = nextBox.y - (currentBox.y + currentBox.height);
        
        // Test boundary spacing
        expect(gap, `Gap between ${currentSection.name} and ${nextSection.name} should be at least ${minSpacing}px on ${viewport.name}`)
          .toBeGreaterThanOrEqual(minSpacing * 0.9); // 10% tolerance for calculation differences
      }
      
      // Test heading guard spacing
      const headings = await playwright.locator('.heading-guard-top, .heading-guard-btm').all();
      
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const headingBox = await heading.boundingClientRect();
        
        // Check if heading has adequate space from viewport edges
        expect(headingBox.y, `Heading should have adequate top margin on ${viewport.name}`)
          .toBeGreaterThan(16);
        
        // Ensure heading is visible and not cropped
        expect(headingBox.width, `Heading should have reasonable width on ${viewport.name}`)
          .toBeGreaterThan(100);
        expect(headingBox.height, `Heading should have reasonable height on ${viewport.name}`)
          .toBeGreaterThan(20);
      }
      
      // Test section layering (content above decorations)
      const sectionContents = await playwright.locator('.section-content').all();
      const sectionDecos = await playwright.locator('.section-deco').all();
      
      for (let i = 0; i < Math.min(sectionContents.length, sectionDecos.length); i++) {
        const content = sectionContents[i];
        const deco = sectionDecos[i];
        
        const contentStyle = await content.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.zIndex;
        });
        
        const decoStyle = await deco.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.zIndex;
        });
        
        // Content should have higher z-index than decorations
        const contentZ = parseInt(contentStyle) || 0;
        const decoZ = parseInt(decoStyle) || 0;
        
        expect(contentZ, `Content should be layered above decorations`)
          .toBeGreaterThanOrEqual(decoZ);
      }
      
      // Test fade transitions exist where expected
      const fadeSections = await playwright.locator('.surface-fade-top, .surface-fade-btm').all();
      
      for (let i = 0; i < fadeSections.length; i++) {
        const fadeSection = fadeSections[i];
        
        // Check that fade pseudo-elements are properly applied
        const hasBeforeAfter = await fadeSection.evaluate((el) => {
          const style = window.getComputedStyle(el, '::before');
          const afterStyle = window.getComputedStyle(el, '::after');
          return {
            hasBefore: style.content !== 'none',
            hasAfter: afterStyle.content !== 'none'
          };
        });
        
        // At least one fade direction should be active
        expect(hasBeforeAfter.hasBefore || hasBeforeAfter.hasAfter, 
          `Fade section should have pseudo-element styling`).toBeTruthy();
      }
      
      // Take screenshot for visual verification
      await playwright.screenshot({
        path: `tests/screenshots/section-boundary-${page.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    });
  }
}

test('Section Safe Spacing CSS Properties', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Test that section-safe utilities are properly applied
  const safeSections = await page.locator('.section-safe, .section-safe-top, .section-safe-btm').all();
  
  for (let i = 0; i < safeSections.length; i++) {
    const section = safeSections[i];
    
    const computedStyle = await section.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        position: style.position
      };
    });
    
    // Check that padding values are within expected range
    const topPadding = parseInt(computedStyle.paddingTop);
    const bottomPadding = parseInt(computedStyle.paddingBottom);
    
    // Should have minimum spacing (accounting for responsive scaling)
    if (computedStyle.paddingTop !== '0px') {
      expect(topPadding, 'Section should have adequate top padding').toBeGreaterThanOrEqual(20);
    }
    
    if (computedStyle.paddingBottom !== '0px') {
      expect(bottomPadding, 'Section should have adequate bottom padding').toBeGreaterThanOrEqual(20);
    }
  }
});

test('Hero Section Specific Spacing', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Test hero-specific padding
  const heroSections = await page.locator('.section-hero-pad').all();
  
  for (let i = 0; i < heroSections.length; i++) {
    const hero = heroSections[i];
    
    const computedStyle = await hero.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: style.paddingTop
      };
    });
    
    const topPadding = parseInt(computedStyle.paddingTop);
    
    // Hero should have enhanced top padding (minimum 40px based on clamp)
    expect(topPadding, 'Hero section should have enhanced top padding').toBeGreaterThanOrEqual(35);
  }
});