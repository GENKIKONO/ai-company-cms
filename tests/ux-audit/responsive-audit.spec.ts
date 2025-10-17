import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

interface AuditIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'nit';
  viewport: string;
  selector: string;
  evidence: string;
  screenshot: string;
  guideline: string;
}

interface PageAuditResult {
  url: string;
  viewports: string[];
  issues: AuditIssue[];
  a11y: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    violations: any[];
  };
  perf_notes: string[];
  timestamp: string;
}

// 監査対象ページ
const auditPages = [
  { path: '/', name: 'homepage' },
  { path: '/organizations', name: 'organizations' },
  { path: '/o/luxucare', name: 'org-detail' },
  { path: '/services', name: 'services' },
  { path: '/faq', name: 'faq' },
  { path: '/posts', name: 'posts' },
  { path: '/admin/ai-visibility', name: 'admin-ai-visibility' }
];

// ユーティリティ関数
function getViewportString(page: Page): string {
  const viewport = page.viewportSize();
  return viewport ? `${viewport.width}x${viewport.height}` : 'unknown';
}

async function saveScreenshot(page: Page, pageName: string, viewport: string, suffix: string = ''): Promise<string> {
  const filename = `${pageName}-${viewport}${suffix ? '-' + suffix : ''}.png`;
  const screenshotPath = path.join('reports/responsive-audit/screenshots', filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return `screenshots/${filename}`;
}

async function checkHorizontalOverflow(page: Page): Promise<{ hasOverflow: boolean; evidence: string }> {
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  
  if (bodyWidth > viewportWidth) {
    return {
      hasOverflow: true,
      evidence: `Page width ${bodyWidth}px causes horizontal scroll (viewport: ${viewportWidth}px)`
    };
  }
  
  return { hasOverflow: false, evidence: '' };
}

async function checkCTASize(page: Page): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const viewport = getViewportString(page);
  
  // CTAボタンのサイズチェック
  const ctaButtons = await page.locator('button, a[href]').filter({
    hasText: /公式サイト|詳細|お問い合わせ|申し込み|登録|ログイン|送信/i
  }).all();
  
  for (let i = 0; i < ctaButtons.length; i++) {
    const button = ctaButtons[i];
    const boundingBox = await button.boundingBox();
    
    if (boundingBox && boundingBox.height > 72) {
      issues.push({
        id: 'CTA_TOO_LARGE',
        severity: 'major',
        viewport,
        selector: `button:nth-of-type(${i + 1})`,
        evidence: `CTA height ${boundingBox.height}px (> 72px guideline)`,
        screenshot: await saveScreenshot(page, 'cta-issue', viewport, `${i}`),
        guideline: 'CTAは48-72px、単一配置、ラベルは最短'
      });
    }
    
    // タップターゲットサイズチェック
    if (boundingBox && (boundingBox.width < 44 || boundingBox.height < 44)) {
      issues.push({
        id: 'TAP_TARGET_TOO_SMALL',
        severity: 'critical',
        viewport,
        selector: `button:nth-of-type(${i + 1})`,
        evidence: `Tap target ${boundingBox.width}x${boundingBox.height}px (< 44x44px minimum)`,
        screenshot: await saveScreenshot(page, 'tap-target-issue', viewport, `${i}`),
        guideline: 'タップターゲット最小44px角'
      });
    }
  }
  
  return issues;
}

async function checkBrokenLinks(page: Page): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const viewport = getViewportString(page);
  
  // href属性のないリンクをチェック
  const brokenLinks = await page.locator('a:not([href]), a[href=""], a[href="#"]').all();
  
  for (let i = 0; i < brokenLinks.length; i++) {
    const link = brokenLinks[i];
    const text = await link.textContent();
    
    if (text && text.trim().length > 0) {
      issues.push({
        id: 'BROKEN_LINK',
        severity: 'major',
        viewport,
        selector: `a:nth-of-type(${i + 1})`,
        evidence: `Link "${text.trim()}" has no valid href attribute`,
        screenshot: await saveScreenshot(page, 'broken-link', viewport, `${i}`),
        guideline: '未配線のボタン/リンク（onClickなし、hrefなし）が存在しない'
      });
    }
  }
  
  return issues;
}

async function checkImageOptimization(page: Page): Promise<string[]> {
  const notes: string[] = [];
  
  // より安全な方法でイメージの最適化をチェック
  const imageData = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    let unoptimizedCount = 0;
    let nextImageCount = 0;
    
    images.forEach(img => {
      const src = img.src;
      const styles = window.getComputedStyle(img);
      
      // Next.js Image最適化チェック
      if (src && src.includes('_next/image')) {
        nextImageCount++;
      }
      
      // max-width, object-fitチェック
      const maxWidth = styles.maxWidth;
      const objectFit = styles.objectFit;
      
      if (maxWidth === 'none' && objectFit === 'fill') {
        unoptimizedCount++;
      }
    });
    
    return {
      totalImages: images.length,
      unoptimizedCount,
      nextImageCount
    };
  });
  
  if (imageData.unoptimizedCount > 0) {
    notes.push(`${imageData.unoptimizedCount} of ${imageData.totalImages} images may need optimization (missing max-width/object-fit)`);
  }
  
  if (imageData.nextImageCount < imageData.totalImages) {
    const unoptimizedNextImages = imageData.totalImages - imageData.nextImageCount;
    notes.push(`${unoptimizedNextImages} images not using Next.js Image optimization`);
  }
  
  return notes;
}

// メインテスト
for (const auditPage of auditPages) {
  test.describe(`UX Audit: ${auditPage.name}`, () => {
    test(`audit ${auditPage.path}`, async ({ page, browserName }) => {
      const viewport = getViewportString(page);
      const result: PageAuditResult = {
        url: auditPage.path,
        viewports: [viewport],
        issues: [],
        a11y: {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0,
          violations: []
        },
        perf_notes: [],
        timestamp: new Date().toISOString()
      };
      
      try {
        // ページにアクセス
        await page.goto(auditPage.path, { waitUntil: 'networkidle' });
        
        // メインスクリーンショット
        await saveScreenshot(page, auditPage.name, viewport);
        
        // 横スクロールチェック
        const overflowCheck = await checkHorizontalOverflow(page);
        if (overflowCheck.hasOverflow) {
          result.issues.push({
            id: 'HORIZONTAL_OVERFLOW',
            severity: 'critical',
            viewport,
            selector: 'body',
            evidence: overflowCheck.evidence,
            screenshot: await saveScreenshot(page, auditPage.name, viewport, 'overflow'),
            guideline: '横スクロール禁止（カルーセル除く）'
          });
        }
        
        // CTAサイズチェック
        const ctaIssues = await checkCTASize(page);
        result.issues.push(...ctaIssues);
        
        // 壊れたリンクチェック
        const linkIssues = await checkBrokenLinks(page);
        result.issues.push(...linkIssues);
        
        // 画像最適化チェック
        const imageNotes = await checkImageOptimization(page);
        result.perf_notes.push(...imageNotes);
        
        // アクセシビリティ監査
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        
        // 重要度別カウント
        for (const violation of axeResults.violations) {
          switch (violation.impact) {
            case 'critical':
              result.a11y.critical++;
              break;
            case 'serious':
              result.a11y.serious++;
              break;
            case 'moderate':
              result.a11y.moderate++;
              break;
            case 'minor':
              result.a11y.minor++;
              break;
          }
        }
        
        result.a11y.violations = axeResults.violations;
        
        // JSONレポート保存
        const reportPath = path.join('reports/responsive-audit', `${auditPage.name}-${viewport}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
        
        console.log(`✅ Audit completed for ${auditPage.path} (${viewport})`);
        console.log(`   Issues: ${result.issues.length}`);
        console.log(`   A11y Critical: ${result.a11y.critical}, Serious: ${result.a11y.serious}`);
        
      } catch (error) {
        console.error(`❌ Audit failed for ${auditPage.path} (${viewport}):`, error);
        throw error;
      }
    });
  });
}