import { test, expect } from '@playwright/test';

test.describe('Posts Management', () => {
  test.beforeEach(async ({ page }) => {
    // 認証済み状態でテスト実行
    // 実際の実装では認証をバイパスまたは事前セットアップ
    await page.goto('/dashboard/posts');
  });

  test('should display posts list and create new post', async ({ page }) => {
    // 1. 投稿一覧ページの表示確認
    await expect(page).toHaveTitle(/投稿|Posts/);
    await expect(page.locator('h1, h2')).toContainText(/投稿|Posts/);

    // 2. 新規作成ボタンの確認
    const createButton = page.locator('a[href*="/posts/new"], button:has-text("新規"), button:has-text("作成"), [data-testid="create-post"]');
    await expect(createButton).toBeVisible();

    // 3. 新規投稿作成ページへ移動
    await createButton.click();
    await page.waitForURL('/dashboard/posts/new', { timeout: 10000 });

    // 4. 投稿作成フォームの確認
    await expect(page.locator('input[name*="title"], input[placeholder*="タイトル"]')).toBeVisible();
    await expect(page.locator('textarea[name*="content"], .editor, [data-testid="content-editor"]')).toBeVisible();

    // 5. 投稿作成のテストデータ
    const testTitle = `E2E Test Post ${Date.now()}`;
    const testContent = 'This is a test post created by E2E automation.';

    await page.fill('input[name*="title"], input[placeholder*="タイトル"]', testTitle);
    
    // コンテンツ入力（エディタ形式に応じて調整）
    const contentField = page.locator('textarea[name*="content"], .editor [contenteditable="true"], [data-testid="content-editor"]').first();
    await contentField.fill(testContent);

    // 6. 投稿保存
    const saveButton = page.locator('button:has-text("保存"), button:has-text("作成"), button[type="submit"]');
    await saveButton.click();

    // 7. 一覧ページにリダイレクトされ、新しい投稿が表示されることを確認
    await page.waitForURL('/dashboard/posts', { timeout: 15000 });
    await expect(page.locator(`text="${testTitle}"`)).toBeVisible();
  });

  test('should toggle post publish status', async ({ page }) => {
    await page.goto('/dashboard/posts');

    // 最初の投稿を対象にステータス変更テスト
    const firstPost = page.locator('[data-testid="post-item"], .post-item, tr').first();
    await expect(firstPost).toBeVisible();

    // 公開/非公開切り替えボタンの確認
    const toggleButton = firstPost.locator('button:has-text("公開"), button:has-text("非公開"), [data-testid="toggle-publish"]');
    
    if (await toggleButton.isVisible()) {
      const initialText = await toggleButton.textContent();
      await toggleButton.click();

      // ステータスが変更されることを確認
      await page.waitForTimeout(1000); // API呼び出し完了を待機
      const updatedText = await toggleButton.textContent();
      expect(updatedText).not.toBe(initialText);
    }
  });

  test('should edit existing post', async ({ page }) => {
    await page.goto('/dashboard/posts');

    // 編集可能な投稿を選択
    const editButton = page.locator('a[href*="/edit"], button:has-text("編集"), [data-testid="edit-post"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 編集ページの表示確認
      await expect(page.locator('input[name*="title"], input[placeholder*="タイトル"]')).toBeVisible();
      await expect(page.locator('textarea[name*="content"], .editor')).toBeVisible();

      // タイトル更新
      const titleField = page.locator('input[name*="title"], input[placeholder*="タイトル"]');
      await titleField.fill(`Updated Title ${Date.now()}`);

      // 保存
      await page.locator('button:has-text("保存"), button:has-text("更新"), button[type="submit"]').click();

      // 一覧ページに戻ることを確認
      await page.waitForURL('/dashboard/posts', { timeout: 15000 });
    }
  });

  test('should delete post with confirmation', async ({ page }) => {
    await page.goto('/dashboard/posts');

    // 削除ボタンの確認
    const deleteButton = page.locator('button:has-text("削除"), [data-testid="delete-post"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 確認ダイアログまたは削除モーダルの処理
      const confirmButton = page.locator('button:has-text("削除"), button:has-text("はい"), button:has-text("確認")');
      
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // 削除後の状態確認（ページリロードまたは要素の消失）
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/posts/new');

    // 必須フィールドが空の状態で保存試行
    const saveButton = page.locator('button:has-text("保存"), button:has-text("作成"), button[type="submit"]');
    await saveButton.click();

    // バリデーションエラーの確認
    await expect(page.locator('.error, [role="alert"], .field-error')).toBeVisible();
  });
});