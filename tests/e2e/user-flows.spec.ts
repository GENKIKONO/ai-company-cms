import { test, expect } from '@playwright/test';

// テストユーザーとデータの設定
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  organizationName: 'テスト株式会社',
  description: 'E2Eテスト用の企業です。AIを活用したサービスを提供しています。これは自動化テストで作成された企業情報です。',
  url: 'https://test-company.example.com',
  telephone: '03-1234-5678',
  addressRegion: '東京都',
  addressLocality: '港区'
};

const TEST_SERVICE = {
  name: 'AIマーケティングサービス',
  summary: 'AIを活用したマーケティングオートメーションサービスです。データ分析から施策実行まで一気通貫でサポートします。',
  features: ['データ分析', 'A/Bテスト', 'パーソナライゼーション', 'ROI測定'],
  category: 'マーケティング',
  price: '月額50,000円〜'
};

const TEST_FAQ = {
  question: 'サービスの導入にはどれくらいの期間が必要ですか？',
  answer: '通常、お申し込みから運用開始まで2-4週間程度です。お客様の要件や規模により期間は変動する場合があります。'
};

test.describe('LuxuCare主要フロー', () => {
  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
  });

  test('フロー1: 新規企業作成→承認→公開', async ({ page }) => {
    // ログイン
    await page.click('text=ログイン');
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 新規企業作成
    await page.click('text=新規企業追加');
    await page.fill('[name="name"]', TEST_USER.organizationName);
    await page.fill('[name="description"]', TEST_USER.description);
    await page.fill('[name="url"]', TEST_USER.url);
    await page.fill('[name="telephone"]', TEST_USER.telephone);
    await page.selectOption('[name="addressRegion"]', TEST_USER.addressRegion);
    await page.fill('[name="addressLocality"]', TEST_USER.addressLocality);
    
    // 保存
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=保存しました')).toBeVisible();

    // 企業詳細ページに移動
    const organizationId = await page.url().split('/').pop();
    
    // プレビューページでバリデーション確認
    await page.click('text=プレビュー');
    await expect(page).toHaveURL(/.*preview/);
    
    // 検証タブで事前チェック
    await page.click('[role="tab"]:has-text("検証結果")');
    await page.click('button:has-text("検証実行")');
    await expect(page.locator('text=検証が完了しました')).toBeVisible();

    // 公開管理タブで法的同意
    await page.click('[role="tab"]:has-text("公開管理")');
    await page.check('#consent-terms');
    await page.check('#consent-privacy');
    await page.check('#consent-disclaimer');

    // Publish Gateチェック
    await page.click('button:has-text("公開前チェック")');
    await expect(page.locator('text=公開可能')).toBeVisible();

    // 公開実行
    await page.click('button:has-text("公開する")');
    await expect(page.locator('text=組織を公開しました')).toBeVisible();

    // 公開ページ確認
    const slug = await page.locator('[data-testid="organization-slug"]').textContent();
    await page.goto(`/o/${slug}`);
    await expect(page.locator(`text=${TEST_USER.organizationName}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_USER.description}`)).toBeVisible();
  });

  test('フロー2: サービス・FAQ・導入事例管理', async ({ page }) => {
    // 事前準備：既存の公開済み企業にログイン
    await page.goto('/login');
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 企業一覧から企業を選択
    await page.click('text=企業管理');
    await page.click(`text=${TEST_USER.organizationName}`);
    const organizationId = await page.url().split('/').pop();

    // サービス追加
    await page.click('text=サービス管理');
    await page.click('text=新規サービス追加');
    await page.fill('[name="name"]', TEST_SERVICE.name);
    await page.fill('[name="summary"]', TEST_SERVICE.summary);
    
    // 特徴を追加
    for (const feature of TEST_SERVICE.features) {
      await page.click('button:has-text("特徴を追加")');
      await page.fill('[name="features"]:last-of-type', feature);
    }
    
    await page.fill('[name="category"]', TEST_SERVICE.category);
    await page.fill('[name="price"]', TEST_SERVICE.price);
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=サービスを保存しました')).toBeVisible();

    // FAQ追加
    await page.click('text=FAQ管理');
    await page.click('text=新規FAQ追加');
    await page.fill('[name="question"]', TEST_FAQ.question);
    await page.fill('[name="answer"]', TEST_FAQ.answer);
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=FAQを保存しました')).toBeVisible();

    // 導入事例追加
    await page.click('text=導入事例管理');
    await page.click('text=新規導入事例追加');
    await page.fill('[name="title"]', 'AI導入でROI300%向上を実現');
    await page.fill('[name="clientType"]', '製造業');
    await page.fill('[name="problem"]', 'マーケティング効率が悪く、リード獲得コストが高騰していた');
    await page.fill('[name="solution"]', 'AIマーケティングツールを導入し、ターゲティング精度を向上');
    await page.fill('[name="outcome"]', 'コンバージョン率が3倍向上、ROI300%を達成');
    
    // メトリクス追加
    await page.click('button:has-text("メトリクスを追加")');
    await page.fill('[name="metricKey"]', 'コンバージョン率向上');
    await page.fill('[name="metricValue"]', '300%');
    await page.click('button:has-text("追加")');
    
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=導入事例を保存しました')).toBeVisible();

    // 公開ページでコンテンツ確認
    await page.click('text=公開ページを見る');
    await expect(page.locator(`text=${TEST_SERVICE.name}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_FAQ.question}`)).toBeVisible();
    await expect(page.locator('text=AI導入でROI300%向上を実現')).toBeVisible();
  });

  test('フロー3: Stripe課金→Active→解約→停止', async ({ page }) => {
    // 事前準備
    await page.goto('/login');
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    await page.click(`text=${TEST_USER.organizationName}`);

    // サブスクリプション開始
    await page.click('text=サブスクリプション管理');
    await page.click('button:has-text("プランを開始")');
    
    // Stripe Checkoutページに遷移することを確認
    await expect(page).toHaveURL(/.*stripe.com.*checkout.*/);
    
    // テスト用カード情報で決済（テスト環境のみ）
    if (process.env.STRIPE_TEST_MODE === 'true') {
      await page.fill('[name="cardNumber"]', '4242424242424242');
      await page.fill('[name="cardExpiry"]', '12/34');
      await page.fill('[name="cardCvc"]', '123');
      await page.fill('[name="billingName"]', 'Test User');
      await page.click('button:has-text("購読する")');
      
      // 成功ページに戻る
      await expect(page).toHaveURL(/.*dashboard.*success/);
      await expect(page.locator('text=サブスクリプションが開始されました')).toBeVisible();
    }

    // ダッシュボードでアクティブ状態確認
    await page.goto('/dashboard');
    await page.click(`text=${TEST_USER.organizationName}`);
    await expect(page.locator('text=アクティブ')).toBeVisible();

    // 解約手続き
    await page.click('text=サブスクリプション管理');
    await page.click('button:has-text("解約する")');
    await page.fill('[name="cancellationReason"]', 'テスト完了のため');
    await page.click('button:has-text("解約を確定")');
    await expect(page.locator('text=解約処理が完了しました')).toBeVisible();

    // 解約後の状態確認
    await expect(page.locator('text=解約済み')).toBeVisible();
    
    // 公開ページがnoindexになることを確認
    const slug = await page.locator('[data-testid="organization-slug"]').textContent();
    await page.goto(`/o/${slug}`);
    const metaRobots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(metaRobots).toContain('noindex');
  });

  test('フロー4: JSON-LD検証とSEO機能', async ({ page }) => {
    // 公開済み企業の公開ページに移動
    const slug = 'test-company'; // テスト用のスラグ
    await page.goto(`/o/${slug}`);

    // JSON-LD構造化データの存在確認
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]');
    const jsonLdCount = await jsonLdScripts.count();
    expect(jsonLdCount).toBeGreaterThan(0);

    // 組織のJSON-LDチェック
    const orgJsonLd = await jsonLdScripts.first().textContent();
    const orgData = JSON.parse(orgJsonLd || '[]');
    const organizationSchema = Array.isArray(orgData) 
      ? orgData.find(item => item['@type'] === 'Organization')
      : orgData['@type'] === 'Organization' ? orgData : null;
    
    expect(organizationSchema).toBeTruthy();
    expect(organizationSchema['@context']).toBe('https://schema.org');
    expect(organizationSchema.name).toBe(TEST_USER.organizationName);
    expect(organizationSchema.url).toBe(TEST_USER.url);

    // メタデータ確認
    await expect(page.locator('title')).toContainText(TEST_USER.organizationName);
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toContain(TEST_USER.organizationName);

    // OGPタグ確認
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogTitle).toContain(TEST_USER.organizationName);
    expect(ogDescription).toBeTruthy();

    // 構造化データの検証（Google Rich Results Test API使用）
    const response = await page.request.post('https://searchconsole.googleapis.com/v1/urlTestingTools/richResults:run', {
      data: {
        url: page.url(),
        userAgent: 'DESKTOP'
      }
    });
    
    if (response.ok()) {
      const result = await response.json();
      expect(result.richResultsResult?.status).toBe('COMPLETE');
    }
  });

  test('フロー5: 権限・RLS・セキュリティチェック', async ({ page }) => {
    // 権限のないユーザーでアクセス試行
    const unauthorizedUser = {
      email: 'unauthorized@example.com',
      password: 'Password123!'
    };

    await page.goto('/login');
    await page.fill('[name="email"]', unauthorizedUser.email);
    await page.fill('[name="password"]', unauthorizedUser.password);
    await page.click('button[type="submit"]');

    // 他社の組織ページに直接アクセス
    const organizationId = 'other-company-id';
    await page.goto(`/dashboard/organizations/${organizationId}`);
    
    // 403エラーまたはリダイレクトされることを確認
    await expect(page).toHaveURL(/.*dashboard$|.*403|.*login/);

    // APIエンドポイントの認証チェック
    const response = await page.request.get(`/api/organizations/${organizationId}`);
    expect(response.status()).toBe(401);

    // SQLインジェクション試行（安全性確認）
    await page.goto('/dashboard');
    await page.fill('[name="search"]', "'; DROP TABLE organizations; --");
    await page.click('button:has-text("検索")');
    
    // エラーが発生せず、適切に処理されることを確認
    await expect(page.locator('text=検索結果')).toBeVisible();

    // XSS試行（安全性確認）
    await page.goto('/dashboard/organizations/new');
    await page.fill('[name="name"]', '<script>alert("XSS")</script>');
    await page.fill('[name="description"]', '<img src="x" onerror="alert(\'XSS\')"');
    await page.click('button:has-text("保存")');
    
    // スクリプトが実行されず、エスケープされることを確認
    await expect(page.locator('script')).toHaveCount(0);
  });

  test('フロー6: パフォーマンス・LCP監視', async ({ page }) => {
    // パフォーマンス測定開始
    await page.goto('/');
    
    // Largest Contentful Paint (LCP) 測定
    const lcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // タイムアウト設定
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP 2.5秒以下であることを確認
    expect(lcpMetric).toBeLessThan(2500);

    // First Input Delay (FID) シミュレーション
    await page.click('button:first-of-type');
    const fidMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[0] as PerformanceEventTiming;
            resolve(entry.processingStart - entry.startTime);
          }
        }).observe({ entryTypes: ['first-input'] });
        
        setTimeout(() => resolve(0), 1000);
      });
    });

    // FID 100ms以下であることを確認
    expect(fidMetric).toBeLessThan(100);

    // バンドルサイズチェック
    const navigationEntry = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        transferSize: navigation.transferSize,
        loadEventEnd: navigation.loadEventEnd,
        domContentLoadedEventEnd: navigation.domContentLoadedEventEnd
      };
    });

    // 適切なバンドルサイズであることを確認
    expect(navigationEntry.transferSize).toBeLessThan(1024 * 1024); // 1MB以下
    expect(navigationEntry.domContentLoadedEventEnd).toBeLessThan(3000); // 3秒以下
  });
});

// テストヘルパー関数
async function cleanupTestData(page: any) {
  // テスト用データのクリーンアップ
  await page.evaluate(async () => {
    // テスト用企業を削除
    const response = await fetch('/api/test/cleanup', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testUser: 'test@example.com' })
    });
    return response.ok;
  });
}

// スクリーンショット撮影
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/failure-${testInfo.title}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});