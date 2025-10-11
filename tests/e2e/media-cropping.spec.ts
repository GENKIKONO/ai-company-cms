import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Media Cropping Prevention
 * Tests image display across multiple viewport sizes to ensure no cropping occurs
 */

const VIEWPORT_SIZES = [
  { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  { width: 414, height: 896, name: 'Mobile (iPhone 11)' },
  { width: 768, height: 1024, name: 'Tablet (iPad)' },
  { width: 1024, height: 768, name: 'Desktop (Small)' },
  { width: 1440, height: 900, name: 'Desktop (Large)' }
];

const TEST_PAGES = [
  { url: '/', name: 'Home Page' },
  { url: '/aio', name: 'AIO Page' },
  { url: '/hearing-service', name: 'Hearing Service Page' },
  { url: '/pricing', name: 'Pricing Page' }
];

for (const page of TEST_PAGES) {
  for (const viewport of VIEWPORT_SIZES) {
    test(`${page.name} - ${viewport.name} - Media Cropping Prevention`, async ({ page: playwright }) => {
      await playwright.setViewportSize({ width: viewport.width, height: viewport.height });
      await playwright.goto(page.url);
      
      // Wait for page to fully load
      await playwright.waitForLoadState('networkidle');
      
      // Check for images with media-contain class
      const mediaContainImages = await playwright.locator('.media-contain').all();
      
      for (let i = 0; i < mediaContainImages.length; i++) {
        const image = mediaContainImages[i];
        
        // Ensure image is visible
        await expect(image).toBeVisible();
        
        // Check if image container is properly sized
        const boundingBox = await image.boundingClientRect();
        
        // Image should have reasonable dimensions (not cropped to 0)
        expect(boundingBox.width).toBeGreaterThan(10);
        expect(boundingBox.height).toBeGreaterThan(10);
        
        // For images with natural dimensions, check aspect ratio preservation
        const naturalDimensions = await image.evaluate((img) => {
          if (img instanceof HTMLImageElement) {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          }
          return null;
        });
        
        if (naturalDimensions && naturalDimensions.naturalWidth > 0 && naturalDimensions.naturalHeight > 0) {
          const naturalRatio = naturalDimensions.naturalWidth / naturalDimensions.naturalHeight;
          const displayRatio = naturalDimensions.clientWidth / naturalDimensions.clientHeight;
          
          // Allow for some tolerance in aspect ratio preservation (within 10%)
          const tolerance = 0.1;
          const ratioError = Math.abs(naturalRatio - displayRatio) / naturalRatio;
          
          expect(ratioError).toBeLessThan(tolerance);
        }
      }
      
      // Check decoration elements don't overflow containers
      const decoElements = await playwright.locator('.deco-img, .bg-deco-safe').all();
      
      for (let i = 0; i < decoElements.length; i++) {
        const deco = decoElements[i];
        const decoBox = await deco.boundingClientRect();
        
        // Find parent container
        const parent = await deco.locator('..').first();
        const parentBox = await parent.boundingClientRect();
        
        // Decoration should not extend significantly beyond parent (allow 5% tolerance)
        const tolerance = 0.05;
        const allowedOverflow = Math.min(parentBox.width, parentBox.height) * tolerance;
        
        expect(decoBox.x).toBeGreaterThanOrEqual(parentBox.x - allowedOverflow);
        expect(decoBox.y).toBeGreaterThanOrEqual(parentBox.y - allowedOverflow);
        expect(decoBox.x + decoBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + allowedOverflow);
        expect(decoBox.y + decoBox.height).toBeLessThanOrEqual(parentBox.y + parentBox.height + allowedOverflow);
      }
      
      // Check CTA sections have proper minimum heights
      const ctaSections = await playwright.locator('.cta-safe-minh').all();
      
      for (let i = 0; i < ctaSections.length; i++) {
        const cta = ctaSections[i];
        const ctaBox = await cta.boundingClientRect();
        
        // CTA should meet minimum height requirements
        const expectedMinHeight = Math.max(320, viewport.width * 0.48, 540);
        expect(ctaBox.height).toBeGreaterThanOrEqual(expectedMinHeight * 0.9); // 10% tolerance
      }
      
      // Check content doesn't overlap with decorations
      const contentElements = await playwright.locator('.content-above-deco').all();
      const decorationElements = await playwright.locator('.deco-img').all();
      
      for (let i = 0; i < contentElements.length; i++) {
        const content = contentElements[i];
        const contentBox = await content.boundingClientRect();
        
        for (let j = 0; j < decorationElements.length; j++) {
          const decoration = decorationElements[j];
          const decoBox = await decoration.boundingClientRect();
          
          // Check if elements are in the same container
          const contentParent = await content.locator('..').first();
          const decoParent = await decoration.locator('..').first();
          
          const isSameContainer = await contentParent.evaluate((contentEl, decoEl) => {
            return contentEl.contains(decoEl) || decoEl.contains(contentEl) || contentEl === decoEl;
          }, await decoParent.elementHandle());
          
          if (isSameContainer) {
            // Content and decoration should not significantly overlap
            const overlapX = Math.max(0, Math.min(contentBox.x + contentBox.width, decoBox.x + decoBox.width) - Math.max(contentBox.x, decoBox.x));
            const overlapY = Math.max(0, Math.min(contentBox.y + contentBox.height, decoBox.y + decoBox.height) - Math.max(contentBox.y, decoBox.y));
            const overlapArea = overlapX * overlapY;
            const contentArea = contentBox.width * contentBox.height;
            
            if (contentArea > 0) {
              const overlapPercentage = overlapArea / contentArea;
              expect(overlapPercentage).toBeLessThan(0.1); // Less than 10% overlap
            }
          }
        }
      }
      
      // Take screenshot for visual verification
      await playwright.screenshot({
        path: `tests/screenshots/media-cropping-${page.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    });
  }
}

test('Media Frame Aspect Ratios', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const mediaFrames = await page.locator('.media-frame').all();
  
  for (let i = 0; i < mediaFrames.length; i++) {
    const frame = mediaFrames[i];
    
    // Get the custom aspect ratio property
    const aspectRatio = await frame.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.getPropertyValue('--media-ar') || style.aspectRatio;
    });
    
    if (aspectRatio && aspectRatio !== 'auto') {
      const frameBoundingBox = await frame.boundingClientRect();
      
      // Parse aspect ratio (e.g., "16/9" or "1.777")
      let expectedRatio: number;
      if (aspectRatio.includes('/')) {
        const [w, h] = aspectRatio.split('/').map(n => parseFloat(n.trim()));
        expectedRatio = w / h;
      } else {
        expectedRatio = parseFloat(aspectRatio);
      }
      
      if (!isNaN(expectedRatio) && frameBoundingBox.width > 0 && frameBoundingBox.height > 0) {
        const actualRatio = frameBoundingBox.width / frameBoundingBox.height;
        const tolerance = 0.05; // 5% tolerance
        const ratioError = Math.abs(expectedRatio - actualRatio) / expectedRatio;
        
        expect(ratioError).toBeLessThan(tolerance);
      }
    }
  }
});

test('Background Decoration Safe Scaling', async ({ page }) => {
  const viewports = [375, 768, 1024, 1440];
  
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const bgDecoElements = await page.locator('.bg-deco-safe').all();
    
    for (let i = 0; i < bgDecoElements.length; i++) {
      const element = bgDecoElements[i];
      
      const backgroundSize = await element.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.backgroundSize;
      });
      
      // Background should be scaled appropriately
      expect(backgroundSize).not.toBe('auto');
      expect(backgroundSize).toContain('px'); // Should have calculated size
      
      // Extract size values and ensure they're within reasonable bounds
      const sizeMatch = backgroundSize.match(/(\d+(?:\.\d+)?)px/);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        
        // Size should be between min (560px) and max (1200px) as defined in CSS
        expect(size).toBeGreaterThanOrEqual(560);
        expect(size).toBeLessThanOrEqual(1200);
        
        // At 80vw, size should approximately match viewport width * 0.8
        const expectedSize = width * 0.8;
        const clampedExpected = Math.max(560, Math.min(expectedSize, 1200));
        
        // Allow for some browser calculation differences
        expect(Math.abs(size - clampedExpected)).toBeLessThan(50);
      }
    }
  }
});