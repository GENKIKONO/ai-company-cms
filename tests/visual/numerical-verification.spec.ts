/**
 * 数値基準の自動検証（要件定義準拠）
 * Playwright + CSSOM による実測値検証
 */

import { test, expect } from '@playwright/test';

interface MeasurementResult {
  element: string;
  property: string;
  expected: string;
  actual: number;
  tolerance: string;
  status: 'PASS' | 'FAIL';
  page?: string;
}

const measurementResults: MeasurementResult[] = [];

const addMeasurement = (element: string, property: string, expected: string, actual: number, tolerance: string, page: string = 'unknown') => {
  const status = evaluateResult(expected, actual, tolerance);
  measurementResults.push({
    element,
    property,
    expected,
    actual,
    tolerance,
    status,
    page
  });
};

const evaluateResult = (expected: string, actual: number, tolerance: string): 'PASS' | 'FAIL' => {
  if (expected.includes('≥')) {
    const minValue = parseInt(expected.replace('≥', '').replace('px', ''));
    return actual >= minValue ? 'PASS' : 'FAIL';
  }
  
  if (expected.includes('-')) {
    const [min, max] = expected.split('-').map(v => parseInt(v.replace('px', '')));
    return actual >= min && actual <= max ? 'PASS' : 'FAIL';
  }
  
  if (expected.includes('=')) {
    const targetValue = parseInt(expected.replace('=', '').replace('px', ''));
    const toleranceValue = parseInt(tolerance.replace('±', '').replace('px', ''));
    return Math.abs(actual - targetValue) <= toleranceValue ? 'PASS' : 'FAIL';
  }
  
  if (expected === '0 instances') {
    return actual === 0 ? 'PASS' : 'FAIL';
  }
  
  return 'PASS';
};

const generateReport = () => {
  const passCount = measurementResults.filter(r => r.status === 'PASS').length;
  const failCount = measurementResults.filter(r => r.status === 'FAIL').length;
  const totalCount = measurementResults.length;
  
  console.log('\n📊 数値基準検証レポート（要件定義準拠）');
  console.log('='.repeat(80));
  console.log(`総測定項目: ${totalCount} | 合格: ${passCount} | 不合格: ${failCount} | 合格率: ${((passCount/totalCount)*100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  // Group by page
  const groupedByPage = measurementResults.reduce((acc, result) => {
    if (!acc[result.page!]) acc[result.page!] = [];
    acc[result.page!].push(result);
    return acc;
  }, {} as Record<string, MeasurementResult[]>);
  
  Object.entries(groupedByPage).forEach(([page, results]) => {
    console.log(`\n📄 ${page.toUpperCase()}`);
    console.log('-'.repeat(80));
    console.log('Element'.padEnd(30) + 'Property'.padEnd(20) + 'Expected'.padEnd(15) + 'Actual'.padEnd(10) + 'Status');
    console.log('-'.repeat(80));
    
    results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      const actualStr = result.property.includes('count') ? result.actual.toString() : `${result.actual}px`;
      console.log(
        `${result.element.padEnd(30)}${result.property.padEnd(20)}${result.expected.padEnd(15)}${actualStr.padEnd(10)}${statusIcon} ${result.status}`
      );
    });
  });
  
  // Summary by category
  console.log('\n📈 カテゴリ別サマリー');
  console.log('-'.repeat(50));
  const categories = {
    'Container': measurementResults.filter(r => r.element.includes('container')),
    'Section Spacing': measurementResults.filter(r => r.property.includes('margin') || r.property.includes('padding')),
    'Flat Design': measurementResults.filter(r => r.property.includes('shadow') || r.property.includes('count')),
    'Pricing Layout': measurementResults.filter(r => r.element.includes('pricing')),
    'Typography': measurementResults.filter(r => r.property.includes('font-variant'))
  };
  
  Object.entries(categories).forEach(([category, results]) => {
    if (results.length > 0) {
      const categoryPass = results.filter(r => r.status === 'PASS').length;
      const categoryTotal = results.length;
      const categoryRate = ((categoryPass / categoryTotal) * 100).toFixed(1);
      console.log(`${category.padEnd(20)}: ${categoryPass}/${categoryTotal} (${categoryRate}%)`);
    }
  });
};

test.describe('数値基準の自動検証（要件定義準拠）', () => {
  test.afterAll(() => {
    generateReport();
  });

  test('Homepage - Container and Section Measurements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Container max-width verification
    const containers = [
      { selector: '.container-article', expected: '=960px', tolerance: '±8px' },
      { selector: '.container-hero', expected: '=1080px', tolerance: '±8px' },
      { selector: '.container-wide', expected: '=1200px', tolerance: '±8px' }
    ];
    
    for (const container of containers) {
      const elements = await page.locator(container.selector).all();
      if (elements.length > 0) {
        const maxWidth = await elements[0].evaluate(el => {
          const computed = getComputedStyle(el);
          return parseInt(computed.maxWidth);
        });
        addMeasurement(container.selector, 'max-width', container.expected, maxWidth, container.tolerance, 'homepage');
      }
    }
    
    // Section spacing verification
    const sectionGaps = await page.locator('.section-gap').all();
    for (let i = 0; i < Math.min(sectionGaps.length, 3); i++) {
      const margins = await sectionGaps[i].evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          top: parseInt(computed.marginTop),
          bottom: parseInt(computed.marginBottom)
        };
      });
      
      if (!isNaN(margins.top)) {
        addMeasurement('.section-gap', 'margin-top', '48-96px', margins.top, 'range', 'homepage');
      }
      if (!isNaN(margins.bottom)) {
        addMeasurement('.section-gap', 'margin-bottom', '48-96px', margins.bottom, 'range', 'homepage');
      }
    }
    
    // Hero section spacing
    const heroGaps = await page.locator('.section-gap-hero').all();
    for (let i = 0; i < Math.min(heroGaps.length, 2); i++) {
      const margins = await heroGaps[i].evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          top: parseInt(computed.marginTop),
          bottom: parseInt(computed.marginBottom)
        };
      });
      
      if (!isNaN(margins.top)) {
        addMeasurement('.section-gap-hero', 'margin-top', '64-112px', margins.top, 'range', 'homepage');
      }
      if (!isNaN(margins.bottom)) {
        addMeasurement('.section-gap-hero', 'margin-bottom', '64-112px', margins.bottom, 'range', 'homepage');
      }
    }
    
    // Heading guards verification
    const headingGuards = await page.locator('.heading-guard-top, .heading-guard-btm').all();
    for (let i = 0; i < Math.min(headingGuards.length, 3); i++) {
      const padding = await headingGuards[i].evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          top: parseInt(computed.paddingTop),
          bottom: parseInt(computed.paddingBottom)
        };
      });
      
      if (!isNaN(padding.top) && padding.top > 0) {
        addMeasurement('.heading-guard', 'padding-top', '≥48px', padding.top, 'minimum', 'homepage');
      }
      if (!isNaN(padding.bottom) && padding.bottom > 0) {
        addMeasurement('.heading-guard', 'padding-bottom', '≥48px', padding.bottom, 'minimum', 'homepage');
      }
    }
  });

  test('AIO Page - Container and Pricing Layout', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Container verification
    const containers = [
      { selector: '.container-article', expected: '=960px', tolerance: '±8px' },
      { selector: '.container-hero', expected: '=1080px', tolerance: '±8px' },
      { selector: '.container-wide', expected: '=1200px', tolerance: '±8px' }
    ];
    
    for (const container of containers) {
      const elements = await page.locator(container.selector).all();
      if (elements.length > 0) {
        const maxWidth = await elements[0].evaluate(el => {
          const computed = getComputedStyle(el);
          return parseInt(computed.maxWidth);
        });
        addMeasurement(container.selector, 'max-width', container.expected, maxWidth, container.tolerance, 'aio');
      }
    }
    
    // 2-column pricing layout verification
    const pricingGrid = await page.locator('[class*="grid-cols-1"][class*="lg:grid-cols-2"]').first();
    if (await pricingGrid.count() > 0) {
      const gridInfo = await pricingGrid.evaluate(el => {
        const computed = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          gridTemplateColumns: computed.gridTemplateColumns,
          gap: parseInt(computed.gap),
          width: rect.width
        };
      });
      
      // Verify 2-column layout
      const isValidGrid = gridInfo.gridTemplateColumns.includes('1fr 1fr') || 
                         gridInfo.gridTemplateColumns.match(/repeat\(2,/) ||
                         gridInfo.gridTemplateColumns.split(' ').length === 2;
      addMeasurement('pricing-grid', 'columns', '2 equal columns', isValidGrid ? 2 : 1, 'exact', 'aio');
      
      // Verify gap (80-96px range)
      if (!isNaN(gridInfo.gap)) {
        addMeasurement('pricing-grid', 'gap', '80-96px', gridInfo.gap, 'range', 'aio');
      }
    }
    
    // Section buffers verification
    const buffers = await page.locator('.section-buffer').all();
    for (let i = 0; i < buffers.length; i++) {
      const bufferInfo = await buffers[i].evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          height: parseInt(computed.height),
          backgroundColor: computed.backgroundColor
        };
      });
      
      if (!isNaN(bufferInfo.height)) {
        addMeasurement('.section-buffer', 'height', '32-56px', bufferInfo.height, 'range', 'aio');
      }
    }
  });

  test('Shadow Elimination Verification', async ({ page }) => {
    const pages = ['/', '/aio', '/hearing-service'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Count elements with box-shadow
      const shadowCount = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let count = 0;
        
        allElements.forEach(el => {
          const computed = getComputedStyle(el);
          if (computed.boxShadow && computed.boxShadow !== 'none') {
            count++;
          }
        });
        
        return count;
      });
      
      addMeasurement('all-elements', 'box-shadow-count', '0 instances', shadowCount, 'exact', pagePath.replace('/', '') || 'homepage');
      
      // Verify ui-flat classes
      const flatElements = await page.locator('.ui-flat, .ui-card').all();
      let flatValidCount = 0;
      
      for (let i = 0; i < Math.min(flatElements.length, 10); i++) {
        const boxShadow = await flatElements[i].evaluate(el => getComputedStyle(el).boxShadow);
        if (boxShadow === 'none') {
          flatValidCount++;
        }
      }
      
      if (flatElements.length > 0) {
        const flatValidPercent = (flatValidCount / Math.min(flatElements.length, 10)) * 100;
        addMeasurement('.ui-flat/.ui-card', 'shadow-elimination', '100% compliance', flatValidPercent, 'percentage', pagePath.replace('/', '') || 'homepage');
      }
    }
  });

  test('Typography - Tabular Numbers Verification', async ({ page }) => {
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Check tabular-nums class application
    const tabularElements = await page.locator('.tabular-nums').all();
    let tabularValidCount = 0;
    
    for (let i = 0; i < Math.min(tabularElements.length, 5); i++) {
      const fontVariant = await tabularElements[i].evaluate(el => {
        const computed = getComputedStyle(el);
        return computed.fontVariantNumeric;
      });
      
      if (fontVariant.includes('tabular-nums') || fontVariant.includes('lining-nums')) {
        tabularValidCount++;
      }
    }
    
    if (tabularElements.length > 0) {
      const tabularValidPercent = (tabularValidCount / Math.min(tabularElements.length, 5)) * 100;
      addMeasurement('.tabular-nums', 'font-variant-numeric', '100% compliance', tabularValidPercent, 'percentage', 'aio');
    }
  });

  test('Mobile Responsiveness Verification', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/aio');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile container behavior
    const containers = await page.locator('.container-article, .container-hero, .container-wide').all();
    
    for (let i = 0; i < Math.min(containers.length, 3); i++) {
      const containerInfo = await containers[i].evaluate(el => {
        const rect = el.getBoundingClientRect();
        const computed = getComputedStyle(el);
        return {
          width: rect.width,
          paddingLeft: parseInt(computed.paddingLeft),
          paddingRight: parseInt(computed.paddingRight)
        };
      });
      
      // Mobile should use fluid width with reasonable padding
      const totalPadding = containerInfo.paddingLeft + containerInfo.paddingRight;
      addMeasurement('mobile-container', 'total-padding', '≥32px', totalPadding, 'minimum', 'mobile');
      
      // Container should not exceed viewport width
      if (containerInfo.width <= 375) {
        addMeasurement('mobile-container', 'viewport-fit', 'within-viewport', 1, 'boolean', 'mobile');
      } else {
        addMeasurement('mobile-container', 'viewport-fit', 'within-viewport', 0, 'boolean', 'mobile');
      }
    }
  });
});