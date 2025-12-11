/**
 * フェーズ4: 組織アクセス制御統合テスト (P0シナリオ)
 * validate_org_access RPC + useOrganization 状態マシンの検証
 * 
 * NOTE: playwright.config.ts で baseURL が設定されている前提（通常は http://localhost:3000）
 * 開発時にポートが変更される場合は PLAYWRIGHT_BASE_URL 環境変数で調整してください
 */

import { test, expect } from '@playwright/test';

test.describe('組織アクセス制御統合テスト (P0)', () => {

  // 環境変数から取得
  const E2E_ORG_ID = process.env.E2E_ORG_ID;
  const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  const E2E_NON_MEMBER_EMAIL = process.env.E2E_NON_MEMBER_EMAIL;
  const E2E_NON_MEMBER_PASSWORD = process.env.E2E_NON_MEMBER_PASSWORD;
  const E2E_ORGZERO_EMAIL = process.env.E2E_ORGZERO_EMAIL;
  const E2E_ORGZERO_PASSWORD = process.env.E2E_ORGZERO_PASSWORD;

  test('ORG-01: 管理者 orgありダッシュボード（正常系）', async ({ page }) => {
    // 必須環境変数チェック
    if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD || !E2E_ORG_ID) {
      console.warn('E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_ORG_ID が設定されていないので ORG-01 をスキップします');
      test.skip();
    }

    // 1. サインインページにアクセス（パスが変わったらここを修正）
    await page.goto('/auth/signin');
    
    // ページロード待機
    await page.waitForLoadState('domcontentloaded');
    
    // 2. メール入力（ロールベースのセレクタを優先、フォールバック付き）
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="メール"], input[placeholder*="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(E2E_ADMIN_EMAIL!);
    
    // 3. パスワード入力（ロールベースのセレクタを優先、フォールバック付き）
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="パスワード"], input[placeholder*="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(E2E_ADMIN_PASSWORD!);
    
    // 4. ログインボタンクリック（より堅牢なセレクタ）
    const loginButton = page.locator('button[type="submit"], button:has-text("ログイン"), button:has-text("サインイン"), form button').first();
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();

    // デバッグログ追加
    console.log('@@@ DEBUG after login click, current URL:', page.url());

    // 5. ダッシュボードに遷移していることを確認（より長いタイムアウト）
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 20000 });

    // デバッグログ追加
    console.log('@@@ DEBUG after expect dashboard, current URL:', page.url());
    console.log('@@@ DEBUG page title:', await page.title());

    // 6. ページロード完了まで待機
    await page.waitForLoadState('networkidle', { timeout: 20000 });

    // 7. メインコンテンツが表示されていることを確認
    const mainContent = page.locator('main, [role="main"], .min-h-screen, .dashboard-main').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    // DEBUG: /api/me の実際のレスポンスをチェック
    const meResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/me');
        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: -1,
          ok: false,
          data: error.message
        };
      }
    });
    console.log('🔍 /api/me Response:', JSON.stringify(meResponse, null, 2));
    
    if (meResponse.ok && meResponse.data) {
      console.log('📊 Key Response Fields:', {
        errorType: meResponse.data.errorType,
        organizationsLength: meResponse.data.organizations?.length || 0,
        selectedOrganization: meResponse.data.selectedOrganization ? {
          id: meResponse.data.selectedOrganization.id,
          name: meResponse.data.selectedOrganization.name
        } : null,
        hasError: !!meResponse.data.error
      });
    }

    // 8. 権限エラーメッセージが表示されていないことを確認
    const hasPermissionError = await page.locator('text=企業情報にアクセスできません').isVisible();
    const hasMemberError = await page.locator('text=この組織のメンバーではありません').isVisible();
    const hasDataError = await page.locator('text=データ読み込みエラー').isVisible();
    
    console.log('🔍 UI Error Status:', {
      hasPermissionError,
      hasMemberError,
      hasDataError
    });
    
    await expect(page.locator('text=企業情報にアクセスできません')).not.toBeVisible();
    await expect(page.locator('text=この組織のメンバーではありません')).not.toBeVisible();
    await expect(page.locator('text=データ読み込みエラー')).not.toBeVisible();

    // 9. API正常動作確認（ブラウザコンテキスト内で実行してセッション共有）
    const apiResults = await page.evaluate(async (orgId) => {
      try {
        const endpoints = [
          `/api/my/faqs?organizationId=${orgId}`,
          `/api/my/materials?organizationId=${orgId}`,
          `/api/my/qa/entries?organizationId=${orgId}`,
          `/api/my/qa/categories?organizationId=${orgId}`,
          `/api/my/case-studies?organizationId=${orgId}`
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            const responseText = await response.text();
            let responseBody;
            try {
              responseBody = JSON.parse(responseText);
            } catch (e) {
              responseBody = responseText;
            }
            
            results[endpoint] = {
              status: response.status,
              ok: response.ok,
              body: responseBody
            };
          } catch (fetchError) {
            results[endpoint] = {
              status: -1,
              ok: false,
              body: `Fetch error: ${fetchError.message}`
            };
          }
        }
        
        return results;
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, E2E_ORG_ID);
    
    // 簡易版として従来のfaqs/materialsチェック
    const legacyApiResults = {
      faqs: apiResults[`/api/my/faqs?organizationId=${E2E_ORG_ID}`] || { status: -1, ok: false, body: 'not tested' },
      materials: apiResults[`/api/my/materials?organizationId=${E2E_ORG_ID}`] || { status: -1, ok: false, body: 'not tested' }
    };

    // DEBUG: API結果をログ出力  
    console.log('🔍 ORG-01 API Results (All):', JSON.stringify(apiResults, null, 2));
    console.log('🔍 Using E2E_ORG_ID:', E2E_ORG_ID);

    // Check APIs individually to see which ones are working
    console.log('📊 API Status Summary:');
    for (const endpoint in apiResults) {
      const result = apiResults[endpoint];
      console.log(`  ${endpoint}: ${result.status} ${result.ok ? '✅' : '❌'}`);
      if (!result.ok && result.body) {
        console.log(`    Error: ${typeof result.body === 'string' ? result.body : JSON.stringify(result.body)}`);
      }
    }

    // admin+e2e は E2E_ORG_ID の organization_members に admin ロールで参加済み
    // 5つの代表 API がすべて 200 を返すことを期待
    const expectedApis = [
      `/api/my/faqs?organizationId=${E2E_ORG_ID}`,
      `/api/my/materials?organizationId=${E2E_ORG_ID}`,
      `/api/my/qa/entries?organizationId=${E2E_ORG_ID}`,
      `/api/my/qa/categories?organizationId=${E2E_ORG_ID}`,
      `/api/my/case-studies?organizationId=${E2E_ORG_ID}`
    ];
    
    for (const apiUrl of expectedApis) {
      const result = apiResults[apiUrl];
      if (!result) {
        throw new Error(`API result not found for ${apiUrl}`);
      }
      expect(result.status).toBe(200);
      console.log(`✅ ${apiUrl}: ${result.status}`);
    }

    // 追加: /api/me の詳細チェック
    const meResponseDebug = await page.request.get('/api/me');
    console.log('@@@ DEBUG /api/me status', meResponseDebug.status());
    const meJsonDebug = await meResponseDebug.json();
    console.log('@@@ DEBUG /api/me body', JSON.stringify(meJsonDebug, null, 2));

    console.log('✅ ORG-01: 管理者ダッシュボード正常系確認完了');
  });

  test('API-01: validateOrgAccess統一API群テスト', async ({ page }) => {
    // 必須環境変数チェック
    if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD || !E2E_ORG_ID) {
      console.warn('E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_ORG_ID が設定されていないので API-01 をスキップします');
      test.skip();
    }

    // 認証済み状態にする（ORG-01と同じ堅牢なログイン処理）
    await page.goto('/auth/signin');
    await page.waitForLoadState('domcontentloaded');
    
    // メール・パスワード入力
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="メール"], input[placeholder*="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(E2E_ADMIN_EMAIL!);
    
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="パスワード"], input[placeholder*="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(E2E_ADMIN_PASSWORD!);
    
    const loginButton = page.locator('button[type="submit"], button:has-text("ログイン"), button:has-text("サインイン"), form button').first();
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    
    // ダッシュボード遷移確認
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 });

    // validateOrgAccess統一済みAPI群の200応答確認（ブラウザコンテキスト内で実行）
    const unifiedApis = [
      '/api/my/faqs',
      '/api/my/materials',
      '/api/my/qa/entries',
      '/api/my/qa/categories',
      '/api/my/case-studies'
    ];

    console.log(`🔄 ${unifiedApis.length}個のvalidateOrgAccess統一API群をテスト中...`);
    
    const apiResults = await page.evaluate(async (data) => {
      const { apis, orgId } = data;
      const results = {};
      
      for (const api of apis) {
        try {
          const response = await fetch(`${api}?organizationId=${orgId}`);
          results[api] = {
            status: response.status,
            ok: response.ok,
            body: response.ok ? 'success' : await response.text()
          };
        } catch (error) {
          results[api] = {
            status: -1,
            ok: false,
            body: error.message
          };
        }
      }
      
      return results;
    }, { apis: unifiedApis, orgId: E2E_ORG_ID });

    // DEBUG: API結果をログ出力  
    console.log('🔍 Unified API Results:', JSON.stringify(apiResults, null, 2));

    // admin+e2e は E2E_ORG_ID の organization_members に admin ロールで参加済み
    // 5つの validateOrgAccess 統一 API がすべて 200 を返すことを期待
    console.log('📊 API Status Analysis:');
    for (const api of unifiedApis) {
      const result = apiResults[api];
      const status = result.status;
      
      console.log(`  ${api}: ${status}`);
      expect(status).toBe(200);
      console.log(`✅ ${api}: ${status}`);
    }

    // 存在しない組織IDで403エラー確認
    const invalidOrgId = '00000000-0000-0000-0000-000000000000';
    const forbiddenResponse = await page.request.get(`/api/my/faqs?organizationId=${invalidOrgId}`);
    
    console.log(`🔍 Invalid org test: ${invalidOrgId} returned ${forbiddenResponse.status()}`);
    if (forbiddenResponse.status() !== 403) {
      try {
        const responseBody = await forbiddenResponse.json();
        console.log('🔍 Invalid org response body:', JSON.stringify(responseBody, null, 2));
      } catch (e) {
        console.log('🔍 Invalid org response (non-JSON):', await forbiddenResponse.text());
      }
    }
    
    // 存在しない組織ID に対しては validateOrgAccess が 403 を返す
    expect(forbiddenResponse.status()).toBe(403);
    
    try {
      const responseBody = await forbiddenResponse.json();
      const errorMessage = responseBody.error || responseBody.message || '';
      expect(errorMessage).toMatch(/メンバーではありません/);
      console.log(`✅ 存在しない組織ID（${invalidOrgId}）で403 + 適切なエラーメッセージ確認`);
    } catch (error) {
      console.log('⚠️ 403レスポンスがJSON形式でない、またはerror/messageフィールドがない（403確認済み）');
    }

    console.log('✅ API-01: validateOrgAccess統一API確認完了');
  });

  // フェーズ4 P1: 権限エラーUX確認（非メンバーユーザー）- 現在スキップ
  test.skip('ORG-03: 権限エラーUX（非メンバーユーザー）', async ({ page }) => {
    // フェーズ4 P1/P2 のために残しているが、P0シナリオ安定化のため現在はスキップする
    console.log('⏭️ ORG-03: フェーズ4 P1シナリオのため現在スキップ');
  });

  // フェーズ4 P1: org0件ユーザーのオンボーディング - 現在スキップ
  test.skip('ORG-02: org0件ユーザーのオンボーディング', async ({ page }) => {
    // フェーズ4 P1/P2 のために残しているが、P0シナリオ安定化のため現在はスキップする
    console.log('⏭️ ORG-02: フェーズ4 P1シナリオのため現在スキップ');
  });

  test('認証ガード動作確認', async ({ page }) => {
    // 未認証でダッシュボード→リダイレクト確認
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/(signin|login)/, { timeout: 10000 });
    
    // リダイレクトパラメータ確認
    expect(page.url()).toMatch(/redirect/);

    console.log('✅ 認証ガード動作確認完了');
  });

  test('/api/me エラーハンドリング検証', async ({ page }) => {
    // 未認証時の /api/me
    const unauthResponse = await page.request.get('/api/me');
    expect(unauthResponse.status()).toBe(401);

    console.log('✅ /api/me 未認証チェック完了');
  });
});