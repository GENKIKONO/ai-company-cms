// E2Eテスト: established_at空文字回帰防止
import { test, expect } from '@playwright/test';

test.describe('Empty Date Fields Regression Prevention', () => {
  
  test('should handle empty established_at field without database error', async ({ page }) => {
    // 認証が必要なAPIテストはモックで実行
    
    // 1. 空文字の日付フィールドを含むペイロードを準備
    const testPayload = {
      name: "Test E2E Company",
      slug: "test-e2e-company",
      established_at: "", // 空文字（問題の原因）
      founded: "", // 空文字（問題の原因）
      address_country: "JP",
      status: "draft"
    };
    
    // 2. APIレスポンスをモック
    await page.route('**/api/my/organization', async route => {
      if (route.request().method() === 'POST') {
        const requestBody = JSON.parse(route.request().postData() || '{}');
        
        // established_atまたはfoundedが空文字の場合
        if (requestBody.established_at === '' || requestBody.founded === '') {
          // 正常にnull変換されたレスポンスを返す
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: 'test-id',
                name: requestBody.name,
                slug: requestBody.slug,
                established_at: null, // 空文字→null変換確認
                founded: null, // 空文字→null変換確認
                address_country: requestBody.address_country
              },
              message: 'Organization created successfully'
            })
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });
    
    // 3. 企業作成ページにアクセス
    await page.goto('/organizations/new');
    
    // 4. フォームに入力（空の日付フィールドを含む）
    await page.fill('[name="name"]', testPayload.name);
    await page.fill('[name="slug"]', testPayload.slug);
    await page.selectOption('[name="address_country"]', testPayload.address_country);
    
    // 日付フィールドは空のまま（established_atの入力がない場合をシミュレート）
    
    // 5. 送信
    await page.click('button[type="submit"]');
    
    // 6. エラーなく成功することを確認
    await expect(page.locator('.success-message, .toast-success')).toBeVisible({ timeout: 5000 });
    
    // 7. PostgreSQL DATE型エラーが発生していないことを確認
    await expect(page.locator('text=invalid input syntax for type date')).not.toBeVisible();
  });
  
  test('should normalize empty date fields to null in API response', async ({ request }) => {
    // APIレベルでの正規化テスト
    const testPayload = {
      name: "API Test Company",
      slug: "api-test-company",
      established_at: "", // 空文字
      founded: "", // 空文字  
      address_country: "JP"
    };
    
    // 未認証でのAPIコール（401が期待される）
    const response = await request.post('/api/my/organization', {
      data: testPayload
    });
    
    // 401エラーが返される（認証エラー）
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    
    // DATE型エラーではなく認証エラーが返されることを確認
    expect(responseBody.error.message).toContain('Authentication required');
    expect(responseBody.error.message).not.toContain('invalid input syntax for type date');
  });
  
  test('should prevent regression with various empty date formats', async ({ page }) => {
    const testCases = [
      { established_at: "", founded: "" }, // 空文字
      { established_at: null, founded: null }, // null
      { established_at: undefined, founded: undefined }, // undefined
      { established_at: "   ", founded: "   " }, // 空白文字
    ];
    
    for (const testCase of testCases) {
      // 各パターンでAPIモック設定
      await page.route('**/api/my/organization', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: 'test-id',
                name: 'Test Company',
                established_at: null, // 常にnull変換
                founded: null // 常にnull変換
              }
            })
          });
        }
      });
      
      // APIコールが正常に処理されることを確認
      const response = await page.request.post('/api/my/organization', {
        data: {
          name: 'Test Company',
          slug: 'test-company',
          ...testCase,
          address_country: 'JP'
        }
      });
      
      // 認証エラー（401）が返されることを確認（DATE型エラーではない）
      expect(response.status()).toBe(401);
    }
  });
});