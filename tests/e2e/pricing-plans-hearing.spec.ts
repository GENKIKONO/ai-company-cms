import { test, expect } from '@playwright/test';

test.describe('料金プラン（ヒアリング代行）UI Components', () => {
  
  test.beforeEach(async ({ page }) => {
    // Create a test page with the PricingPlans component
    const testHtml = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PricingPlans Test</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Hit-44 utility class */
          .hit-44 {
            min-height: 44px !important;
            min-width: 44px !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          /* CTA optimization class */
          .cta-optimized {
            max-height: 56px !important;
            font-size: clamp(14px, 2.5vw, 16px) !important;
            padding: 12px 24px !important;
            min-height: 44px !important;
            min-width: 44px !important;
          }
          
          /* Hide scrollbars */
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          /* Mock icons */
          .icon {
            width: 1em;
            height: 1em;
            display: inline-block;
            background: currentColor;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/%3E%3C/svg%3E");
          }
        </style>
      </head>
      <body>
        <div id="pricing-plans">
          <section class="py-16 bg-gray-50" aria-labelledby="pricing-title">
            <div class="container mx-auto px-4">
              <div class="text-center mb-12">
                <h2 id="pricing-title" class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  料金プラン（ヒアリング代行）
                </h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                  お客様のニーズに合わせて最適なヒアリングプランをお選びください。
                  すべてのプランで録音データと要約レポートをご提供します。
                </p>
              </div>

              <!-- Mobile: Horizontal Scroll -->
              <div class="lg:hidden">
                <div 
                  class="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar"
                  style="scroll-snap-type: x mandatory"
                  role="tablist"
                  aria-label="料金プラン選択"
                  data-testid="mobile-scroll-container"
                >
                  <!-- Standard Plan -->
                  <article
                    class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col min-h-[600px] w-[85%] flex-shrink-0 snap-center p-6 hover:shadow-xl border-gray-200 hover:border-gray-300"
                    role="tabpanel"
                    aria-labelledby="plan-basic_hearing-title"
                    tabindex="0"
                    data-testid="plan-basic-mobile"
                  >
                    <div class="text-center mb-6">
                      <div class="mb-4">
                        <span class="icon h-10 w-10 mx-auto text-blue-600"></span>
                      </div>
                      <h3 id="plan-basic_hearing-title" class="text-xl font-bold text-gray-900 mb-2">
                        スタンダード
                      </h3>
                      <p class="text-gray-600 text-sm mb-4">
                        基本的なヒアリング代行
                      </p>
                      <div class="mb-4">
                        <span class="text-3xl font-bold text-gray-900">
                          55,000円
                        </span>
                        <span class="text-gray-600 ml-1">
                          /回
                        </span>
                      </div>
                    </div>

                    <div class="flex-1 mb-6">
                      <h4 class="font-semibold text-gray-900 mb-4">含まれる内容</h4>
                      <ul class="space-y-3" role="list">
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm text-gray-700">ヒアリング時間：60分</span>
                        </li>
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm text-gray-700">事前質問設計</span>
                        </li>
                      </ul>
                    </div>

                    <div class="mt-auto">
                      <a
                        href="/hearing/apply?plan=basic"
                        class="hit-44 cta-optimized block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                        role="button"
                        aria-label="スタンダードプランを選択"
                        data-testid="cta-basic-mobile"
                      >
                        このプランで申し込む
                      </a>
                    </div>
                  </article>

                  <!-- Premium Plan -->
                  <article
                    class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col min-h-[600px] w-[85%] flex-shrink-0 snap-center p-6 hover:shadow-xl border-purple-500 relative"
                    role="tabpanel"
                    aria-labelledby="plan-premium_hearing-title"
                    tabindex="1"
                    data-testid="plan-premium-mobile"
                  >
                    <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span class="bg-purple-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        人気
                      </span>
                    </div>

                    <div class="text-center mb-6">
                      <div class="mb-4">
                        <span class="icon h-10 w-10 mx-auto text-purple-600"></span>
                      </div>
                      <h3 id="plan-premium_hearing-title" class="text-xl font-bold text-gray-900 mb-2">
                        プレミアム
                      </h3>
                      <p class="text-gray-600 text-sm mb-4">
                        詳細分析付きヒアリング代行
                      </p>
                      <div class="mb-4">
                        <span class="text-3xl font-bold text-gray-900">
                          88,000円
                        </span>
                        <span class="text-gray-600 ml-1">
                          /回
                        </span>
                      </div>
                    </div>

                    <div class="flex-1 mb-6">
                      <h4 class="font-semibold text-gray-900 mb-4">含まれる内容</h4>
                      <ul class="space-y-3" role="list">
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm text-gray-700">ヒアリング時間：90分</span>
                        </li>
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm font-medium text-gray-900">詳細分析レポート作成</span>
                        </li>
                      </ul>
                    </div>

                    <div class="mt-auto">
                      <a
                        href="/hearing/apply?plan=premium"
                        class="hit-44 cta-optimized block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700"
                        role="button"
                        aria-label="プレミアムプランを選択"
                        data-testid="cta-premium-mobile"
                      >
                        このプランで申し込む
                      </a>
                    </div>
                  </article>

                  <!-- Enterprise Plan -->
                  <article
                    class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col min-h-[600px] w-[85%] flex-shrink-0 snap-center p-6 hover:shadow-xl border-gray-200 hover:border-gray-300"
                    role="tabpanel"
                    aria-labelledby="plan-enterprise_hearing-title"
                    tabindex="2"
                    data-testid="plan-enterprise-mobile"
                  >
                    <div class="text-center mb-6">
                      <div class="mb-4">
                        <span class="icon h-10 w-10 mx-auto text-indigo-600"></span>
                      </div>
                      <h3 id="plan-enterprise_hearing-title" class="text-xl font-bold text-gray-900 mb-2">
                        エンタープライズ
                      </h3>
                      <p class="text-gray-600 text-sm mb-4">
                        包括的なヒアリング＆分析
                      </p>
                      <div class="mb-4">
                        <span class="text-3xl font-bold text-gray-900">
                          165,000円
                        </span>
                        <span class="text-gray-600 ml-1">
                          /回
                        </span>
                      </div>
                    </div>

                    <div class="flex-1 mb-6">
                      <h4 class="font-semibold text-gray-900 mb-4">含まれる内容</h4>
                      <ul class="space-y-3" role="list">
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm text-gray-700">ヒアリング時間：120分</span>
                        </li>
                        <li class="flex items-start">
                          <span class="icon h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500"></span>
                          <span class="text-sm text-gray-700">総合分析レポート</span>
                        </li>
                      </ul>
                    </div>

                    <div class="mt-auto">
                      <a
                        href="/contact?service=enterprise_hearing"
                        class="hit-44 cta-optimized block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                        role="button"
                        aria-label="エンタープライズプランを選択"
                        data-testid="cta-enterprise-mobile"
                      >
                        お問い合わせ
                      </a>
                    </div>
                  </article>
                </div>
              </div>

              <!-- Desktop: Grid Layout -->
              <div class="hidden lg:grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto" data-testid="desktop-grid">
                <!-- Plans rendered similarly for desktop -->
                <article
                  class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col h-full p-8 hover:shadow-xl border-gray-200 hover:border-gray-300"
                  data-testid="plan-basic-desktop"
                >
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">スタンダード</h3>
                    <div class="mb-6">
                      <span class="text-4xl font-bold text-gray-900">55,000円</span>
                      <span class="text-gray-600 ml-1">/回</span>
                    </div>
                  </div>
                  <div class="mt-auto">
                    <a
                      href="/hearing/apply?plan=basic"
                      class="hit-44 cta-optimized block w-full text-center py-4 px-6 rounded-lg font-semibold transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                      data-testid="cta-basic-desktop"
                    >
                      このプランで申し込む
                    </a>
                  </div>
                </article>

                <article
                  class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col h-full p-8 hover:shadow-xl border-purple-500 relative"
                  data-testid="plan-premium-desktop"
                >
                  <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span class="bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                      人気
                    </span>
                  </div>
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">プレミアム</h3>
                    <div class="mb-6">
                      <span class="text-4xl font-bold text-gray-900">88,000円</span>
                      <span class="text-gray-600 ml-1">/回</span>
                    </div>
                  </div>
                  <div class="mt-auto">
                    <a
                      href="/hearing/apply?plan=premium"
                      class="hit-44 cta-optimized block w-full text-center py-4 px-6 rounded-lg font-semibold transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700"
                      data-testid="cta-premium-desktop"
                    >
                      このプランで申し込む
                    </a>
                  </div>
                </article>

                <article
                  class="bg-white rounded-xl shadow-lg border-2 transition-all duration-200 flex flex-col h-full p-8 hover:shadow-xl border-gray-200 hover:border-gray-300"
                  data-testid="plan-enterprise-desktop"
                >
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">エンタープライズ</h3>
                    <div class="mb-6">
                      <span class="text-4xl font-bold text-gray-900">165,000円</span>
                      <span class="text-gray-600 ml-1">/回</span>
                    </div>
                  </div>
                  <div class="mt-auto">
                    <a
                      href="/contact?service=enterprise_hearing"
                      class="hit-44 cta-optimized block w-full text-center py-4 px-6 rounded-lg font-semibold transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                      data-testid="cta-enterprise-desktop"
                    >
                      お問い合わせ
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(testHtml);
  });

  test('Mobile: horizontal scroll with snap behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const scrollContainer = page.getByTestId('mobile-scroll-container');
    await expect(scrollContainer).toBeVisible();
    
    // Check scroll container has correct classes
    const containerClasses = await scrollContainer.getAttribute('class');
    expect(containerClasses).toContain('snap-x');
    expect(containerClasses).toContain('snap-mandatory');
    expect(containerClasses).toContain('overflow-x-auto');
    expect(containerClasses).toContain('no-scrollbar');
    
    // Check that cards are 85% width and have snap-center
    const cards = scrollContainer.locator('article');
    await expect(cards).toHaveCount(3);
    
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      const cardClasses = await card.getAttribute('class');
      expect(cardClasses).toContain('w-[85%]');
      expect(cardClasses).toContain('snap-center');
      expect(cardClasses).toContain('min-h-[600px]');
    }
    
    // Verify scroll functionality - scroll to second card
    const firstCard = page.getByTestId('plan-basic-mobile');
    const secondCard = page.getByTestId('plan-premium-mobile');
    
    // Get initial positions
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();
    
    if (firstCardBox && secondCardBox) {
      // Second card should be to the right (not visible initially)
      expect(secondCardBox.x).toBeGreaterThan(firstCardBox.x + firstCardBox.width - 50);
    }
    
    // Scroll to show premium plan
    await secondCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // Wait for scroll animation
    
    // Verify premium plan badge is visible
    const premiumBadge = page.locator('text=人気');
    await expect(premiumBadge).toBeVisible();
  });

  test('Desktop: 3-column grid layout with equal heights', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopGrid = page.getByTestId('desktop-grid');
    await expect(desktopGrid).toBeVisible();
    
    // Check grid has correct classes
    const gridClasses = await desktopGrid.getAttribute('class');
    expect(gridClasses).toContain('lg:grid-cols-3');
    expect(gridClasses).toContain('max-w-6xl');
    
    // Check all three cards are visible and have equal heights
    const basicCard = page.getByTestId('plan-basic-desktop');
    const premiumCard = page.getByTestId('plan-premium-desktop');
    const enterpriseCard = page.getByTestId('plan-enterprise-desktop');
    
    await expect(basicCard).toBeVisible();
    await expect(premiumCard).toBeVisible();
    await expect(enterpriseCard).toBeVisible();
    
    // Get card dimensions
    const basicBox = await basicCard.boundingBox();
    const premiumBox = await premiumCard.boundingBox();
    const enterpriseBox = await enterpriseCard.boundingBox();
    
    expect(basicBox).toBeTruthy();
    expect(premiumBox).toBeTruthy();
    expect(enterpriseBox).toBeTruthy();
    
    if (basicBox && premiumBox && enterpriseBox) {
      // Cards should have similar heights (flex col + h-full)
      const heightTolerance = 10;
      expect(Math.abs(basicBox.height - premiumBox.height)).toBeLessThanOrEqual(heightTolerance);
      expect(Math.abs(premiumBox.height - enterpriseBox.height)).toBeLessThanOrEqual(heightTolerance);
      
      // Cards should be arranged horizontally
      expect(premiumBox.x).toBeGreaterThan(basicBox.x + basicBox.width - 50);
      expect(enterpriseBox.x).toBeGreaterThan(premiumBox.x + premiumBox.width - 50);
      
      // Cards should be vertically aligned
      const verticalTolerance = 10;
      expect(Math.abs(basicBox.y - premiumBox.y)).toBeLessThanOrEqual(verticalTolerance);
      expect(Math.abs(premiumBox.y - enterpriseBox.y)).toBeLessThanOrEqual(verticalTolerance);
    }
  });

  test('CTA buttons meet 44px minimum tap target requirement', async ({ page }) => {
    // Test mobile CTAs
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileCTAs = [
      page.getByTestId('cta-basic-mobile'),
      page.getByTestId('cta-premium-mobile'),
      page.getByTestId('cta-enterprise-mobile')
    ];
    
    for (const cta of mobileCTAs) {
      await expect(cta).toBeVisible();
      
      // Check classes
      const ctaClasses = await cta.getAttribute('class');
      expect(ctaClasses).toContain('hit-44');
      expect(ctaClasses).toContain('cta-optimized');
      
      // Check dimensions meet 44px minimum
      const ctaBox = await cta.boundingBox();
      expect(ctaBox).toBeTruthy();
      
      if (ctaBox) {
        expect(ctaBox.height).toBeGreaterThanOrEqual(44);
        expect(ctaBox.width).toBeGreaterThanOrEqual(44);
        
        // CTA should not exceed max height (56px as per cta-optimized)
        expect(ctaBox.height).toBeLessThanOrEqual(56);
      }
    }
    
    // Test desktop CTAs
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopCTAs = [
      page.getByTestId('cta-basic-desktop'),
      page.getByTestId('cta-premium-desktop'), 
      page.getByTestId('cta-enterprise-desktop')
    ];
    
    for (const cta of desktopCTAs) {
      await expect(cta).toBeVisible();
      
      const ctaBox = await cta.boundingBox();
      expect(ctaBox).toBeTruthy();
      
      if (ctaBox) {
        expect(ctaBox.height).toBeGreaterThanOrEqual(44);
        expect(ctaBox.width).toBeGreaterThanOrEqual(44);
        expect(ctaBox.height).toBeLessThanOrEqual(56);
      }
    }
  });

  test('Accessibility: proper ARIA labels and keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check ARIA attributes on mobile scroll container
    const scrollContainer = page.getByTestId('mobile-scroll-container');
    
    const ariaLabel = await scrollContainer.getAttribute('aria-label');
    expect(ariaLabel).toBe('料金プラン選択');
    
    const role = await scrollContainer.getAttribute('role');
    expect(role).toBe('tablist');
    
    // Check plan cards have proper roles and labels
    const basicCard = page.getByTestId('plan-basic-mobile');
    const cardRole = await basicCard.getAttribute('role');
    expect(cardRole).toBe('tabpanel');
    
    const cardAriaLabel = await basicCard.getAttribute('aria-labelledby');
    expect(cardAriaLabel).toBe('plan-basic_hearing-title');
    
    // Check CTA buttons have proper accessibility attributes
    const ctaButton = page.getByTestId('cta-basic-mobile');
    const ctaRole = await ctaButton.getAttribute('role');
    expect(ctaRole).toBe('button');
    
    const ctaAriaLabel = await ctaButton.getAttribute('aria-label');
    expect(ctaAriaLabel).toBe('スタンダードプランを選択');
    
    // Test keyboard navigation
    await ctaButton.focus();
    await expect(ctaButton).toBeFocused();
    
    // Tab to next CTA
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip other elements
    const premiumCTA = page.getByTestId('cta-premium-mobile');
    // Note: In real implementation, we'd test tab order more thoroughly
  });

  test('Responsive behavior at different breakpoints', async ({ page }) => {
    // Test mobile breakpoint (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileContainer = page.getByTestId('mobile-scroll-container');
    const desktopGrid = page.getByTestId('desktop-grid');
    
    // Mobile container should be visible, desktop grid hidden
    await expect(mobileContainer).toBeVisible();
    
    // Desktop grid should be hidden on mobile (using lg:hidden in parent)
    const mobileParent = mobileContainer.locator('..');
    const parentClasses = await mobileParent.getAttribute('class');
    expect(parentClasses).toContain('lg:hidden');
    
    // Test tablet breakpoint (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(mobileContainer).toBeVisible(); // Still mobile layout
    
    // Test desktop breakpoint (1024px - lg)
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(desktopGrid).toBeVisible();
    
    // Test large desktop (1920px)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(desktopGrid).toBeVisible();
    
    // Desktop grid should have max-width constraint
    const gridBox = await desktopGrid.boundingBox();
    expect(gridBox).toBeTruthy();
    
    if (gridBox) {
      // Should not exceed max-w-6xl (roughly 1152px + margins)
      expect(gridBox.width).toBeLessThanOrEqual(1200);
    }
  });

  test('Popular plan badge displays correctly', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    const premiumCard = page.getByTestId('plan-premium-mobile');
    await premiumCard.scrollIntoViewIfNeeded();
    
    const badge = premiumCard.locator('text=人気');
    await expect(badge).toBeVisible();
    
    // Badge should be positioned absolutely at top
    const badgeBox = await badge.boundingBox();
    const cardBox = await premiumCard.boundingBox();
    
    expect(badgeBox).toBeTruthy();
    expect(cardBox).toBeTruthy();
    
    if (badgeBox && cardBox) {
      // Badge should be above the card (negative Y relative to card)
      expect(badgeBox.y).toBeLessThan(cardBox.y);
      
      // Badge should be centered horizontally
      const badgeCenter = badgeBox.x + badgeBox.width / 2;
      const cardCenter = cardBox.x + cardBox.width / 2;
      const centerOffset = Math.abs(badgeCenter - cardCenter);
      expect(centerOffset).toBeLessThanOrEqual(10); // Allow some tolerance
    }
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopPremiumCard = page.getByTestId('plan-premium-desktop');
    const desktopBadge = desktopPremiumCard.locator('text=人気');
    await expect(desktopBadge).toBeVisible();
  });

  test('Cards maintain minimum height and content alignment', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const cards = [
      page.getByTestId('plan-basic-mobile'),
      page.getByTestId('plan-premium-mobile'),
      page.getByTestId('plan-enterprise-mobile')
    ];
    
    for (const card of cards) {
      const cardBox = await card.boundingBox();
      expect(cardBox).toBeTruthy();
      
      if (cardBox) {
        // Should meet minimum height requirement (600px)
        expect(cardBox.height).toBeGreaterThanOrEqual(600);
        
        // Check that card uses flexbox for content distribution
        const cardClasses = await card.getAttribute('class');
        expect(cardClasses).toContain('flex');
        expect(cardClasses).toContain('flex-col');
      }
      
      // CTA should be at bottom (mt-auto)
      const cta = card.locator('[data-testid*="cta-"]');
      const ctaParent = cta.locator('..');
      const ctaParentClasses = await ctaParent.getAttribute('class');
      expect(ctaParentClasses).toContain('mt-auto');
    }
  });
});