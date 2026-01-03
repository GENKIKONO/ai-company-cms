import { test, expect } from '@playwright/test';

test.describe('Admin Console', () => {
  
  test.beforeEach(async ({ page }) => {
    // 管理者権限でログイン
    // 実際の実装では管理者認証をセットアップ
    await page.goto('/admin');
  });

  test('should access admin dashboard', async ({ page }) => {
    // 1. 管理ダッシュボードの基本表示確認
    await expect(page).toHaveTitle(/管理|Admin/);
    await expect(page.locator('h1, h2')).toContainText(/管理|Admin/);

    // 2. 主要な管理メニューの確認
    const menuItems = [
      '組織管理',
      'ユーザー管理', 
      'コンテンツ管理',
      '統計',
      '設定'
    ];

    for (const item of menuItems) {
      await expect(page.locator(`a:has-text("${item}"), button:has-text("${item}")`)).toBeVisible();
    }
  });

  test('should access enforcement dashboard', async ({ page }) => {
    await page.goto('/admin/enforcement');
    
    // エンフォースメントダッシュボードの確認
    await expect(page.locator('h1, h2')).toContainText(/エンフォースメント|Enforcement/);
    
    // 主要機能の確認
    await expect(page.locator('[data-testid="violation-list"], .violation-item')).toBeVisible();
    await expect(page.locator('button:has-text("検索"), button:has-text("フィルター")')).toBeVisible();
  });

  test('should access AI visibility management', async ({ page }) => {
    await page.goto('/admin/ai-visibility');
    
    await expect(page.locator('h1, h2')).toContainText(/AI.*可視|AI.*Visibility/);
    
    // AI可視性スコア関連の要素確認
    await expect(page.locator('.score, .visibility-score, [data-testid="ai-score"]')).toBeVisible();
  });

  test('should access organization groups management', async ({ page }) => {
    await page.goto('/admin/org-groups');
    
    await expect(page.locator('h1, h2')).toContainText(/組織.*グループ|Organization.*Group/);
    
    // グループ一覧の確認
    await expect(page.locator('[data-testid="groups-list"], .group-item, table')).toBeVisible();
    
    // 新規作成ボタンの確認
    await expect(page.locator('button:has-text("作成"), a:has-text("新規")')).toBeVisible();
  });

  test('should access feature management', async ({ page }) => {
    await page.goto('/admin/feature-management');
    
    await expect(page.locator('h1, h2')).toContainText(/機能.*管理|Feature.*Management/);
    
    // 機能フラグの確認
    const featureToggles = page.locator('input[type="checkbox"], .toggle, .switch');
    await expect(featureToggles.first()).toBeVisible();
  });

  test('should access material stats', async ({ page }) => {
    await page.goto('/admin/material-stats');
    
    await expect(page.locator('h1, h2')).toContainText(/素材.*統計|Material.*Stats/);
    
    // 統計データの確認
    await expect(page.locator('.chart, .graph, [data-testid="stats-chart"]')).toBeVisible();
    await expect(page.locator('.stat-number, .metric')).toBeVisible();
  });

  test('should access QnA stats', async ({ page }) => {
    await page.goto('/admin/qna-stats');
    
    await expect(page.locator('h1, h2')).toContainText(/QnA.*統計|QnA.*Stats/);
    
    // Q&A統計の確認
    await expect(page.locator('.stats-container, [data-testid="qna-stats"]')).toBeVisible();
  });

  test('should access reviews management', async ({ page }) => {
    await page.goto('/admin/reviews');
    
    await expect(page.locator('h1, h2')).toContainText(/レビュー|Review/);
    
    // レビュー一覧の確認
    await expect(page.locator('[data-testid="reviews-list"], .review-item, table')).toBeVisible();
  });

  test('should access questions management', async ({ page }) => {
    await page.goto('/admin/questions');
    
    await expect(page.locator('h1, h2')).toContainText(/質問.*管理|Question.*Management/);
    
    // 質問一覧の確認
    await expect(page.locator('[data-testid="questions-list"], .question-item')).toBeVisible();
  });

  test('should access news management', async ({ page }) => {
    await page.goto('/admin/news');
    
    await expect(page.locator('h1, h2')).toContainText(/ニュース|News/);
    
    // ニュース管理機能の確認
    await expect(page.locator('button:has-text("作成"), button:has-text("新規")')).toBeVisible();
  });
});

test.describe('Management Console', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/management-console');
  });

  test('should access management console dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/管理.*コンソール|Management.*Console/);
    
    // メインナビゲーションの確認
    const navItems = [
      'レポート',
      'ユーザー',
      '設定',
      '連絡先',
      'ヒアリング'
    ];

    for (const item of navItems) {
      await expect(page.locator(`nav a:has-text("${item}"), .nav-item:has-text("${item}")`)).toBeVisible();
    }
  });

  test('should access reports section', async ({ page }) => {
    await page.goto('/management-console/reports');
    
    await expect(page.locator('h1, h2')).toContainText(/レポート|Report/);
    
    // レポート機能の確認
    await expect(page.locator('.report-item, [data-testid="report"]')).toBeVisible();
    await expect(page.locator('button:has-text("生成"), button:has-text("ダウンロード")')).toBeVisible();
  });

  test('should access users management', async ({ page }) => {
    await page.goto('/management-console/users');
    
    await expect(page.locator('h1, h2')).toContainText(/ユーザー.*管理|User.*Management/);
    
    // ユーザー一覧の確認
    await expect(page.locator('[data-testid="users-table"], .user-list, table')).toBeVisible();
  });

  test('should access settings', async ({ page }) => {
    await page.goto('/management-console/settings');
    
    await expect(page.locator('h1, h2')).toContainText(/設定|Setting/);
    
    // 設定フォームの確認
    await expect(page.locator('form, .settings-form')).toBeVisible();
    await expect(page.locator('button:has-text("保存"), button[type="submit"]')).toBeVisible();
  });

  test('should access contacts management', async ({ page }) => {
    await page.goto('/management-console/contacts');
    
    await expect(page.locator('h1, h2')).toContainText(/連絡先|Contact/);
    
    // 連絡先一覧の確認
    await expect(page.locator('[data-testid="contacts-list"], .contact-item')).toBeVisible();
  });

  test('should access hearings management', async ({ page }) => {
    await page.goto('/management-console/hearings');
    
    await expect(page.locator('h1, h2')).toContainText(/ヒアリング|Hearing/);
    
    // ヒアリング管理の確認
    await expect(page.locator('[data-testid="hearings-list"], .hearing-item')).toBeVisible();
  });

  test('should access embed dashboard', async ({ page }) => {
    await page.goto('/management-console/embed-dashboard');
    
    await expect(page.locator('h1, h2')).toContainText(/埋め込み|Embed/);
    
    // 埋め込みダッシュボードの確認
    await expect(page.locator('[data-testid="embed-stats"], .embed-chart')).toBeVisible();
  });

  test('should access security settings', async ({ page }) => {
    await page.goto('/management-console/security');
    
    await expect(page.locator('h1, h2')).toContainText(/セキュリティ|Security/);
    
    // セキュリティ設定の確認
    await expect(page.locator('.security-setting, [data-testid="security-config"]')).toBeVisible();
  });
});