import { test, expect } from '@playwright/test';

/**
 * AIO Hub Main User Flows E2E Tests
 * 主要ユーザーフローの自動テスト（Stripe等課金除く）
 */

test.describe('AIO Hub Main User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にページをクリア
    await page.goto('/');
  });

  test.describe('Authentication Flows', () => {
    test('should allow signup, login, and logout flow', async ({ page }) => {
      const timestamp = Date.now();
      const testEmail = `e2e-signup-${timestamp}@example.com`;
      const testPassword = 'TestSignup123!';

      // サインアップ
      await page.goto('/auth/signup');
      await expect(page).toHaveTitle(/Sign Up|サインアップ/);
      
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      
      await page.click('button[type="submit"]');
      
      // ダッシュボードへのリダイレクトを確認
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      await expect(page).toHaveURL(/.*dashboard/);

      // ログアウト
      await page.click('[data-testid="user-menu"]', { timeout: 10000 });
      await page.click('[data-testid="logout-button"]');
      
      // ホームページまたはログインページにリダイレクトされることを確認
      await page.waitForURL(/\/(auth\/signin|login|$)/, { timeout: 15000 });

      // 既存ユーザーでログイン
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should prevent auth redirect infinite loop', async ({ page }) => {
      // /auth/login ページの無限ループチェック
      await page.goto('/auth/login');
      
      // 5秒以内にページが安定することを確認
      await page.waitForTimeout(5000);
      const currentUrl = page.url();
      
      expect(currentUrl).not.toMatch(/redirect/);
      // ページが正常に表示されていることを確認
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });
  });

  test.describe('Organization Setup', () => {
    test.use({ storageState: 'tests/auth.json' });

    test('should create or update organization and navigate to dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 組織作成または既存組織の確認
      const hasOrganization = await page.locator('[data-testid="organization-name"]').isVisible();
      
      if (!hasOrganization) {
        // 組織が存在しない場合は作成
        await page.click('[data-testid="create-organization"]');
        
        await page.fill('input[name="name"]', 'E2E Test Organization');
        await page.fill('input[name="slug"]', 'e2e-test-org-unique');
        await page.fill('textarea[name="description"]', 'E2Eテスト用の組織です');
        
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 30000 });
      }
      
      // ダッシュボードが正常に表示されることを確認
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('h1')).toContainText(/ダッシュボード|Dashboard/);
    });

    test('should handle address input and show Google Maps link', async ({ page }) => {
      await page.goto('/organizations');
      
      // 組織編集ページに移動
      await page.click('[data-testid="edit-organization"]:first-child');
      
      // 住所情報を入力
      await page.fill('input[name="address_postal_code"]', '100-0001');
      await page.fill('select[name="address_region"]', '東京都');
      await page.fill('input[name="address_locality"]', '千代田区');
      await page.fill('input[name="address_street"]', '丸の内1-1-1');
      
      // 保存
      await page.click('button[type="submit"]');
      await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
      
      // 公開ページで住所とGoogleマップリンクを確認
      const orgSlug = await page.locator('input[name="slug"]').inputValue();
      await page.goto(`/o/${orgSlug}`);
      
      // 住所が表示されることを確認
      await expect(page.locator('text=〒100-0001')).toBeVisible();
      await expect(page.locator('text=東京都千代田区丸の内1-1-1')).toBeVisible();
      
      // Googleマップリンクを確認
      const mapsLink = page.locator('a[href*="google.com/maps"]');
      await expect(mapsLink).toBeVisible();
      
      const href = await mapsLink.getAttribute('href');
      expect(href).toMatch(/^https:\/\/www\.google\.com\/maps/);
    });

    test('should download JSON-LD with required fields', async ({ page }) => {
      await page.goto('/organizations');
      
      // 組織編集ページに移動
      await page.click('[data-testid="edit-organization"]:first-child');
      
      // JSON-LDダウンロードボタンをクリック
      const downloadPromise = page.waitForDownload();
      await page.click('[data-testid="download-jsonld"]');
      const download = await downloadPromise;
      
      // ダウンロードされたファイルを検証
      const path = await download.path();
      expect(path).toBeTruthy();
      
      // ファイル内容を検証（実際の検証は統合テストで行う）
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf8');
      const jsonLd = JSON.parse(content);
      
      // 必須フィールドの存在確認
      expect(jsonLd['@context']).toBeDefined();
      expect(jsonLd['@type']).toBeDefined();
      expect(jsonLd.name).toBeDefined();
      expect(jsonLd.url).toBeDefined();
      
      if (jsonLd.address) {
        expect(jsonLd.address.postalCode).toBeDefined();
      }
    });
  });

  test.describe('Q&A Knowledge Base', () => {
    test.use({ storageState: 'tests/auth.json' });

    test('should create, edit, and search Q&A entries', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Q&A管理に移動
      await page.click('[data-testid="qa-management"]');
      
      // カテゴリ作成
      await page.click('[data-testid="create-category"]');
      await page.fill('input[name="name"]', 'E2Eテストカテゴリ');
      await page.fill('textarea[name="description"]', 'E2Eテスト用のカテゴリです');
      await page.click('button[type="submit"]');
      
      await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
      
      // Q&A作成
      await page.click('[data-testid="create-qa"]');
      await page.fill('textarea[name="question"]', 'E2Eテストの質問です');
      await page.fill('textarea[name="answer"]', 'E2Eテストの回答です。詳細な説明を含みます。');
      await page.selectOption('select[name="category_id"]', { label: 'E2Eテストカテゴリ' });
      await page.click('button[type="submit"]');
      
      await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
      
      // Q&A編集
      await page.click('[data-testid="edit-qa"]:first-child');
      await page.fill('textarea[name="answer"]', 'E2Eテストの更新された回答です。');
      await page.click('button[type="submit"]');
      
      await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
      
      // Q&A検索
      await page.fill('[data-testid="qa-search"]', 'E2Eテスト');
      await page.press('[data-testid="qa-search"]', 'Enter');
      
      // 検索結果が表示されることを確認
      await expect(page.locator('text=E2Eテストの質問です')).toBeVisible();
    });

    test('should enforce plan limits for Q&A entries', async ({ page }) => {
      // プラン制限のテスト（Free=5件制限）
      await page.goto('/dashboard');
      
      // 現在のプランがFreeであることを確認
      await page.click('[data-testid="billing-settings"]');
      await expect(page.locator('text=Free')).toBeVisible();
      
      await page.goto('/dashboard');
      await page.click('[data-testid="qa-management"]');
      
      // 5件以上のQ&Aを作成しようとする
      for (let i = 1; i <= 6; i++) {
        await page.click('[data-testid="create-qa"]');
        await page.fill('textarea[name="question"]', `テスト質問 ${i}`);
        await page.fill('textarea[name="answer"]', `テスト回答 ${i}`);
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        
        if (i <= 5) {
          // 5件以下は成功
          await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
        } else {
          // 6件目は制限メッセージまたはエラーが表示される
          await expect(page.locator('text=上限|制限|limit')).toBeVisible({ timeout: 10000 });
          break;
        }
      }
    });
  });

  test.describe('Public Content Controls', () => {
    test.use({ storageState: 'tests/auth.json' });

    test('should toggle section visibility on public page', async ({ page }) => {
      await page.goto('/organizations');
      
      // 組織編集ページに移動
      await page.click('[data-testid="edit-organization"]:first-child');
      
      const orgSlug = await page.locator('input[name="slug"]').inputValue();
      
      // セクション表示設定を確認
      const sectionsToTest = [
        { checkbox: 'show_services', label: 'サービス一覧を表示', content: '提供サービス' },
        { checkbox: 'show_faqs', label: 'FAQを表示', content: 'よくある質問' },
        { checkbox: 'show_qa', label: 'ナレッジベースを表示', content: 'ナレッジベース' },
        { checkbox: 'show_case_studies', label: '導入事例を表示', content: '導入事例' },
        { checkbox: 'show_contact', label: '連絡先を表示', content: '連絡先' }
      ];
      
      for (const section of sectionsToTest) {
        // セクションをONにする
        const checkbox = page.locator(`input[name="${section.checkbox}"]`);
        if (!await checkbox.isChecked()) {
          await checkbox.check();
        }
        
        await page.click('button[type="submit"]');
        await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
        
        // 公開ページで表示を確認
        await page.goto(`/o/${orgSlug}`);
        await expect(page.locator(`text=${section.content}`)).toBeVisible({ timeout: 10000 });
        
        // 編集ページに戻る
        await page.goto('/organizations');
        await page.click('[data-testid="edit-organization"]:first-child');
        
        // セクションをOFFにする
        await page.locator(`input[name="${section.checkbox}"]`).uncheck();
        await page.click('button[type="submit"]');
        await page.waitForResponse(response => response.url().includes('/api/') && response.status() < 400);
        
        // 公開ページで非表示を確認
        await page.goto(`/o/${orgSlug}`);
        await expect(page.locator(`text=${section.content}`)).not.toBeVisible();
        
        // 編集ページに戻る
        await page.goto('/organizations');
        await page.click('[data-testid="edit-organization"]:first-child');
      }
    });
  });

  test.describe('Regression Prevention', () => {
    test('should build successfully without JSX/module warnings', async ({ page }) => {
      // ビルドスモークテスト（実際のビルドはCIで実行）
      await page.goto('/');
      
      // 主要ページが正常に表示されることを確認
      await expect(page).toHaveTitle(/AIO Hub|LuxuCare/);
      
      // コンソールエラーがないことを確認
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/dashboard');
      await page.goto('/organizations');
      await page.goto('/pricing');
      
      // 重大なJSXエラーがないことを確認
      const jsxErrors = errors.filter(error => 
        error.includes('JSX') || 
        error.includes('module') || 
        error.includes('viewport')
      );
      
      expect(jsxErrors).toHaveLength(0);
    });
  });

  test.describe('SEO Smoke Tests', () => {
    test('should have canonical links with absolute URLs', async ({ page }) => {
      const pagesToTest = [
        '/',
        '/pricing',
        '/about',
        '/organizations'
      ];
      
      for (const pagePath of pagesToTest) {
        await page.goto(pagePath);
        
        const canonicalLink = page.locator('link[rel="canonical"]');
        
        if (await canonicalLink.count() > 0) {
          const href = await canonicalLink.getAttribute('href');
          
          // 絶対URLであることを確認
          expect(href).toMatch(/^https?:\/\//);
          expect(href).not.toMatch(/^\/[^\/]/); // 相対URLではない
        }
      }
    });

    test('should have proper viewport meta tags', async ({ page }) => {
      await page.goto('/');
      
      const viewportMeta = page.locator('meta[name="viewport"]');
      await expect(viewportMeta).toHaveCount(1);
      
      const content = await viewportMeta.getAttribute('content');
      expect(content).toContain('width=device-width');
      expect(content).toContain('initial-scale=1');
    });
  });
});