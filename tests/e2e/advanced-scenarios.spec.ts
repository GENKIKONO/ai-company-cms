/**
 * Advanced E2E Test Scenarios
 * 高度なシナリオとエッジケースのテスト
 */

import { test, expect } from '@playwright/test';

test.describe('Advanced E2E Test Scenarios', () => {
  
  test.describe('Search and Discovery', () => {
    test('Advanced search functionality', async ({ page }) => {
      await page.goto('/search/enhanced');
      
      // 高度検索フィルターの動作確認
      await page.fill('input[placeholder*="検索"]', 'AI システム開発');
      await page.click('button:has-text("検索")');
      
      // 検索結果の表示確認
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // フィルター適用
      await page.click('input[name="industry"][value="AI"]');
      await page.click('input[name="region"][value="東京都"]');
      await page.click('button:has-text("フィルター適用")');
      
      // フィルタリング結果の確認
      await expect(page.locator('text=AI')).toBeVisible();
      await expect(page.locator('text=東京')).toBeVisible();
    });

    test('Smart search with natural language', async ({ page }) => {
      await page.goto('/search');
      
      // 自然言語検索のテスト
      const queries = [
        '東京のAI企業を探している',
        'スタートアップの機械学習サービス',
        '大阪でDX導入事例',
        '2020年設立のクラウドサービス会社'
      ];
      
      for (const query of queries) {
        await page.fill('input[placeholder*="検索"]', query);
        await page.press('input[placeholder*="検索"]', 'Enter');
        
        // 結果が表示されることを確認
        await expect(page.locator('[data-testid="search-results"]').or(page.locator('text=検索結果'))).toBeVisible();
        
        // 検索意図の説明が表示されることを確認
        await expect(page.locator('[data-testid="search-explanation"]').or(page.locator('text=検索しました'))).toBeVisible();
      }
    });

    test('Search suggestions and autocomplete', async ({ page }) => {
      await page.goto('/search');
      
      // 検索サジェストの動作確認
      await page.fill('input[placeholder*="検索"]', 'AI');
      await page.waitForTimeout(500); // サジェスト表示を待機
      
      // サジェストリストが表示されることを確認
      const suggestions = page.locator('[data-testid="search-suggestions"] li');
      await expect(suggestions.first()).toBeVisible();
      
      // サジェストをクリックして検索実行
      await suggestions.first().click();
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });

  test.describe('Content Management Workflow', () => {
    test('Complete content lifecycle', async ({ page }) => {
      // ログイン
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'test-user@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // 組織作成
      await page.goto('/organizations/new');
      const orgName = `テスト企業_${Date.now()}`;
      const orgSlug = `test-org-${Date.now()}`;
      
      await page.fill('input[name="name"]', orgName);
      await page.fill('input[name="slug"]', orgSlug);
      await page.fill('textarea[name="description"]', 'E2Eテスト用の企業です');
      await page.fill('input[name="url"]', 'https://test-example.com');
      await page.fill('input[name="telephone"]', '03-1234-5678');
      await page.click('button:has-text("作成")');
      
      // サービス作成
      await page.goto(`/organizations/${orgSlug}/services/new`);
      await page.fill('input[name="name"]', 'テストサービス');
      await page.fill('textarea[name="description"]', 'E2Eテスト用のサービスです');
      await page.fill('input[name="category"]', 'システム開発');
      await page.click('button:has-text("作成")');
      
      // 事例作成
      await page.goto(`/organizations/${orgSlug}/case-studies/new`);
      await page.fill('input[name="title"]', 'テスト導入事例');
      await page.fill('textarea[name="problem"]', 'テスト問題');
      await page.fill('textarea[name="solution"]', 'テスト解決策');
      await page.fill('textarea[name="result"]', 'テスト結果');
      await page.click('button:has-text("作成")');
      
      // FAQ作成
      await page.goto(`/organizations/${orgSlug}/faqs/new`);
      await page.fill('input[name="question"]', 'よくある質問テスト');
      await page.fill('textarea[name="answer"]', 'テスト回答です');
      await page.click('button:has-text("作成")');
      
      // 公開ページでの表示確認
      await page.goto(`/o/${orgSlug}`);
      await expect(page.locator(`text=${orgName}`)).toBeVisible();
      await expect(page.locator('text=テストサービス')).toBeVisible();
      await expect(page.locator('text=テスト導入事例')).toBeVisible();
      await expect(page.locator('text=よくある質問テスト')).toBeVisible();
    });

    test('Content validation and publishing', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'test-user@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // バリデーションエラーのテスト
      await page.goto('/organizations/new');
      await page.click('button:has-text("作成")'); // 必須項目なしで作成試行
      
      // エラーメッセージの表示確認
      await expect(page.locator('text=必須').or(page.locator('text=required'))).toBeVisible();
      
      // 正しい情報を入力
      await page.fill('input[name="name"]', 'バリデーションテスト企業');
      await page.fill('input[name="slug"]', 'validation-test');
      await page.fill('textarea[name="description"]', 'バリデーションテスト用');
      await page.fill('input[name="url"]', 'https://validation-test.com');
      await page.fill('input[name="telephone"]', '03-9999-8888');
      
      // 作成成功
      await page.click('button:has-text("作成")');
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Performance and Reliability', () => {
    test('Page load performance across site', async ({ page }) => {
      const pages = [
        '/',
        '/search',
        '/search/enhanced', 
        '/organizations',
        '/auth/login',
        '/auth/signup'
      ];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - startTime;
        
        console.log(`${pagePath}: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000); // 3秒以内
      }
    });

    test('API reliability under load', async ({ page }) => {
      const endpoints = [
        '/api/health',
        '/api/organizations',
        '/api/search?q=test'
      ];
      
      // 並列リクエストでの安定性テスト
      for (const endpoint of endpoints) {
        const requests = Array.from({ length: 5 }, () => 
          page.request.get(endpoint)
        );
        
        const responses = await Promise.all(requests);
        
        responses.forEach(response => {
          expect(response.status()).toBeLessThan(500); // サーバーエラーなし
        });
      }
    });

    test('Error handling and graceful degradation', async ({ page }) => {
      // ネットワークエラーシミュレーション
      await page.route('/api/organizations', route => {
        route.abort('failed');
      });
      
      await page.goto('/organizations');
      
      // エラー状態での適切な表示確認
      await expect(page.locator('text=エラー').or(page.locator('text=Error')).or(page.locator('text=読み込めませんでした'))).toBeVisible();
      
      // リトライボタンの存在確認
      await expect(page.locator('button:has-text("再試行")').or(page.locator('button:has-text("Retry")'))).toBeVisible();
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('Keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // タブキーでナビゲーション
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // フォーカス状態の確認
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Enterキーでの操作
      await page.keyboard.press('Enter');
    });

    test('Screen reader compatibility', async ({ page }) => {
      await page.goto('/');
      
      // ARIAラベルの存在確認
      await expect(page.locator('[aria-label]').first()).toBeVisible();
      
      // 見出し構造の確認
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      expect(h1Count).toBeLessThanOrEqual(1); // 1ページに1つのh1
    });

    test('Language switching', async ({ page }) => {
      await page.goto('/');
      
      // 言語切り替えボタンの確認
      const languageSelector = page.locator('[data-testid="language-selector"]').or(page.locator('text=言語').or(page.locator('text=Language')));
      
      if (await languageSelector.count() > 0) {
        await languageSelector.click();
        
        // 言語オプションの表示
        await expect(page.locator('text=English').or(page.locator('text=日本語'))).toBeVisible();
      }
    });
  });

  test.describe('SEO and Metadata', () => {
    test('Meta tags and structured data', async ({ page }) => {
      await page.goto('/');
      
      // 基本的なメタタグの確認
      const title = await page.locator('title').textContent();
      expect(title).toBeTruthy();
      expect(title!.length).toBeGreaterThan(10);
      expect(title!.length).toBeLessThan(60);
      
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThan(160);
      
      // OGPタグの確認
      await expect(page.locator('meta[property="og:title"]')).toBeVisible();
      await expect(page.locator('meta[property="og:description"]')).toBeVisible();
      await expect(page.locator('meta[property="og:type"]')).toBeVisible();
    });

    test('Sitemap and robots.txt', async ({ page }) => {
      // robots.txtの確認
      const robotsResponse = await page.request.get('/robots.txt');
      expect(robotsResponse.status()).toBe(200);
      
      const robotsText = await robotsResponse.text();
      expect(robotsText).toContain('User-agent');
      expect(robotsText).toContain('Sitemap');
      
      // サイトマップの確認
      const sitemapResponse = await page.request.get('/sitemap.xml');
      expect(sitemapResponse.status()).toBe(200);
      
      const sitemapText = await sitemapResponse.text();
      expect(sitemapText).toContain('<?xml');
      expect(sitemapText).toContain('<urlset');
    });
  });

  test.describe('Security', () => {
    test('CSRF protection', async ({ page }) => {
      // CSRFトークンなしでのPOSTリクエスト
      const response = await page.request.post('/api/organizations', {
        data: { name: 'Test Org' }
      });
      
      // 適切な認証エラーまたはCSRF保護
      expect([401, 403, 422]).toContain(response.status());
    });

    test('Input sanitization', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // XSSペイロードの入力テスト
      const xssPayload = '<script>alert("xss")</script>';
      await page.fill('input[name="email"]', xssPayload);
      await page.fill('input[name="password"]', 'TestPassword123!');
      
      // サニタイゼーションの確認（スクリプトが実行されないこと）
      let alertDialogAppeared = false;
      page.on('dialog', () => {
        alertDialogAppeared = true;
      });
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      expect(alertDialogAppeared).toBe(false);
    });

    test('SQL injection protection', async ({ page }) => {
      // SQLインジェクション試行（検索機能）
      const sqlPayload = "'; DROP TABLE organizations; --";
      
      const response = await page.request.get(`/api/search?q=${encodeURIComponent(sqlPayload)}`);
      
      // エラーレスポンスまたは空の結果（データベースエラーではない）
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Data Management', () => {
    test('Data export functionality', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'test-user@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard');
      
      // データエクスポート機能があれば確認
      const exportButton = page.locator('button:has-text("エクスポート")').or(page.locator('button:has-text("Export")'));
      
      if (await exportButton.count() > 0) {
        await exportButton.click();
        
        // ダウンロード処理の確認
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("ダウンロード")');
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toBeTruthy();
      }
    });

    test('Data backup and recovery', async ({ page }) => {
      // バックアップAPIエンドポイントのテスト
      const backupResponse = await page.request.get('/api/ops/backup');
      
      // 権限がない場合は401、ある場合は200または302
      expect([200, 302, 401, 403]).toContain(backupResponse.status());
    });
  });
});

test.describe('Mobile-Specific Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size
  
  test('Mobile navigation and UX', async ({ page }) => {
    await page.goto('/');
    
    // モバイルメニューの動作確認
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]').or(page.locator('button[aria-label*="メニュー"]'));
    
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      
      // メニューが表示されることを確認
      await expect(page.locator('[data-testid="mobile-menu"]').or(page.locator('[role="menu"]'))).toBeVisible();
    }
  });

  test('Touch interactions', async ({ page }) => {
    await page.goto('/search');
    
    // タッチスクリーンでの操作
    await page.tap('input[placeholder*="検索"]');
    await page.fill('input[placeholder*="検索"]', 'タッチテスト');
    
    // 仮想キーボードを考慮した表示確認
    await expect(page.locator('input[placeholder*="検索"]')).toBeVisible();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Basic functionality in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
      
      await page.goto('/');
      
      // 基本的な表示確認
      await expect(page.locator('h1').or(page.locator('[role="banner"]'))).toBeVisible();
      
      // JavaScript実行の確認
      const result = await page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      expect(result).toBe(true);
    });
  });
});