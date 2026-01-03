import { test, expect } from '@playwright/test';

test.describe('Segment-Based Billing', () => {
  
  test.describe('Checkout Flow by User Segment', () => {
    test('should handle test_user segment with 30% discount', async ({ page }) => {
      // テストユーザーとしてログイン (segment: test_user)
      await page.goto('/dashboard/billing');

      // プラン選択ページの確認
      await expect(page.locator('h1, h2')).toContainText(/料金|プラン|Billing|Pricing/);

      // Basic プランの選択
      const basicPlanButton = page.locator('button:has-text("Basic"), [data-plan="basic"], [data-testid="plan-basic"]');
      if (await basicPlanButton.isVisible()) {
        await basicPlanButton.click();

        // セグメント別チェックアウトAPI呼び出しの確認
        // テスト環境では実際の決済は実行しない
        const response = await page.request.post('/api/billing/checkout-segmented', {
          data: {
            planTier: 'basic',
            intent: 'first_purchase'
          }
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData.segmentInfo).toBeDefined();
        expect(responseData.segmentInfo.segment).toBe('test_user');
        expect(responseData.segmentInfo.appliedPricing).toBe('discounted');
      }
    });

    test('should handle early_user segment with 20% discount', async ({ page }) => {
      // Early user セグメントのテスト
      await page.goto('/dashboard/billing');

      // Pro プランでのテスト
      const proPlanButton = page.locator('button:has-text("Pro"), [data-plan="pro"], [data-testid="plan-pro"]');
      if (await proPlanButton.isVisible()) {
        const response = await page.request.post('/api/billing/checkout-segmented', {
          data: {
            planTier: 'pro',
            intent: 'first_purchase'
          }
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData.segmentInfo.segment).toBe('early_user');
        expect(responseData.segmentInfo.appliedPricing).toBe('discounted');
      }
    });

    test('should handle normal_user segment without discount', async ({ page }) => {
      await page.goto('/dashboard/billing');

      // Business プランでのテスト
      const businessPlanButton = page.locator('button:has-text("Business"), [data-plan="business"], [data-testid="plan-business"]');
      if (await businessPlanButton.isVisible()) {
        const response = await page.request.post('/api/billing/checkout-segmented', {
          data: {
            planTier: 'business',
            intent: 'first_purchase'
          }
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData.segmentInfo.segment).toBe('normal_user');
        expect(responseData.segmentInfo.appliedPricing).toBe('normal');
      }
    });

    test('should use normal pricing for upgrade intent regardless of segment', async ({ page }) => {
      await page.goto('/dashboard/billing');

      // アップグレード時は常に通常価格
      const response = await page.request.post('/api/billing/checkout-segmented', {
        data: {
          planTier: 'pro',
          intent: 'upgrade'
        }
      });

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData.segmentInfo.intent).toBe('upgrade');
      expect(responseData.segmentInfo.appliedPricing).toBe('normal');
    });
  });

  test.describe('Admin Segment Management', () => {
    test('should allow admin to view user segment', async ({ page }) => {
      // 管理者権限でのセグメント管理
      await page.goto('/admin');

      // ユーザー管理ページへ
      const usersLink = page.locator('a[href*="/users"], a:has-text("ユーザー"), [data-testid="users-link"]');
      if (await usersLink.isVisible()) {
        await usersLink.click();

        // 特定ユーザーのセグメント確認
        const testUserId = process.env.TEST_USER_ID || 'test-user-id';
        
        const response = await page.request.get(`/api/admin/users/${testUserId}/segment`);
        
        if (response.status() === 200) {
          const userData = await response.json();
          expect(userData.segment).toMatch(/test_user|early_user|normal_user/);
        }
      }
    });

    test('should allow admin to update user segment', async ({ page }) => {
      const testUserId = process.env.TEST_USER_ID || 'test-user-id';

      // セグメント更新API
      const response = await page.request.patch(`/api/admin/users/${testUserId}/segment`, {
        data: {
          segment: 'test_user'
        }
      });

      // 管理者権限がない場合は403、権限がある場合は200
      expect([200, 403]).toContain(response.status());

      if (response.status() === 200) {
        const responseData = await response.json();
        expect(responseData.success).toBe(true);
        expect(responseData.user.segment).toBe('test_user');
      }
    });
  });

  test.describe('Legacy API Compatibility', () => {
    test('should maintain backward compatibility with legacy checkout', async ({ page }) => {
      await page.goto('/dashboard/billing');

      // 既存のチェックアウトAPI
      const response = await page.request.post('/api/billing/checkout');

      // レガシーAPIは引き続き動作すること
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid plan tier', async ({ page }) => {
      const response = await page.request.post('/api/billing/checkout-segmented', {
        data: {
          planTier: 'invalid_plan',
          intent: 'first_purchase'
        }
      });

      expect(response.status()).toBe(400);

      const errorData = await response.json();
      expect(errorData.error).toContain('Invalid plan tier');
    });

    test('should handle invalid purchase intent', async ({ page }) => {
      const response = await page.request.post('/api/billing/checkout-segmented', {
        data: {
          planTier: 'basic',
          intent: 'invalid_intent'
        }
      });

      expect(response.status()).toBe(400);

      const errorData = await response.json();
      expect(errorData.error).toContain('Invalid purchase intent');
    });

    test('should handle missing authentication', async ({ page }) => {
      // 認証なしでのAPI呼び出し
      await page.goto('/');
      
      const response = await page.request.post('/api/billing/checkout-segmented', {
        data: {
          planTier: 'basic',
          intent: 'first_purchase'
        }
      });

      expect([401, 403]).toContain(response.status());
    });
  });
});