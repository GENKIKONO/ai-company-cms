/**
 * Dashboard Routes Smoke Tests
 * 
 * 全dashboard/page.txsファイルを自動検出し、500/404エラーを防止
 * UI変更でルートが壊れた場合に即座にCI失敗させる
 */

import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// ダッシュボードのルートを自動検出（順序固定）
function discoverDashboardRoutes(): string[] {
  const routes: string[] = [];
  const dashboardDir = 'src/app/dashboard';
  
  function walkDir(dir: string, basePath: string = '/dashboard') {
    try {
      const items = readdirSync(dir).sort(); // ディレクトリ走査順序を固定
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // ディレクトリの場合は再帰的に探索
          walkDir(fullPath, `${basePath}/${item}`);
        } else if (item === 'page.tsx') {
          // page.tsxが見つかった場合はルートに追加
          routes.push(basePath);
        }
      }
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  }
  
  walkDir(dashboardDir);
  return routes.sort(); // アルファベット順で固定
}

// Dynamic segmentを実際の値に置換
function resolveDynamicRoute(route: string): string {
  return route
    .replace(/\/\[id\]/g, '/00000000-0000-4000-8000-000000000000')
    .replace(/\/\[sessionId\]/g, '/00000000-0000-4000-8000-000000000000')
    .replace(/\/\[period\]/g, '/2025-01');
}

// 致命的なNext.jsエラーをチェック
function hasFatalError(content: string): boolean {
  const fatalPatterns = [
    'missing required error components',
    'Application error: a server-side exception has occurred',
    'Unhandled Runtime Error',
    'ChunkLoadError'
  ];
  
  return fatalPatterns.some(pattern => 
    content.toLowerCase().includes(pattern.toLowerCase())
  );
}

test.describe('Dashboard Routes Smoke Test', () => {
  const dashboardRoutes = discoverDashboardRoutes();
  
  console.log(`Found ${dashboardRoutes.length} dashboard routes:`, dashboardRoutes);
  
  // CI時のみ詳細デバッグログを出力
  if (process.env.CI) {
    console.log(`🔍 [CI-DEBUG] CI=${process.env.CI}, PLAYWRIGHT_BASE_URL=${process.env.PLAYWRIGHT_BASE_URL}`);
  }
  
  // 各ルートに対して個別のテストケースを作成
  for (const route of dashboardRoutes) {
    const resolvedRoute = resolveDynamicRoute(route);
    
    test(`${route} should not return 500/404`, async ({ page }, testInfo) => {
      let finalUrl = resolvedRoute;
      let bodyPreview = '';
      
      // CI時のみ圧縮した1行ログを出力
      if (process.env.CI) {
        console.log(`🔍 [${route}] CI=${process.env.CI}|BASE_URL=${process.env.PLAYWRIGHT_BASE_URL}|projectBase=${testInfo.project.use?.baseURL||'unset'}`);
      }
      
      try {
        // ルートにアクセス（リダイレクト追跡・タイムアウト設定）
        const response = await page.goto(resolvedRoute, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        // 最終到達先URLを取得
        finalUrl = page.url();
        
        // CI時のみ圧縮した実アクセス証跡ログを出力
        if (process.env.CI) {
          console.log(`🔍 [${route}] responseURL=${response?.url()}|pageURL=${finalUrl}|status=${response?.status()}`);
        }
        
        // ステータスコードをチェック
        const status = response?.status();
        
        // リダイレクトの場合は最終到達先もチェック
        if (status === 302 || status === 307) {
          // 無限リダイレクト検知（簡易）
          if (finalUrl === resolvedRoute) {
            // リダイレクト先が同じ場合は何もしない
          } else {
            // 最終到達先でもう一度ステータス確認
            const finalResponse = await page.waitForResponse(response => response.url() === finalUrl, { timeout: 5000 }).catch(() => null);
            if (finalResponse) {
              const finalStatus = finalResponse.status();
              if (finalStatus === 500 || finalStatus === 404) {
                throw new Error(`Route ${resolvedRoute} redirected to ${finalUrl} which returned ${finalStatus}`);
              }
            }
          }
        }
        
        // 500と404は不合格
        if (status === 500) {
          throw new Error(`Route ${resolvedRoute} returned 500 Internal Server Error`);
        }
        if (status === 404) {
          throw new Error(`Route ${resolvedRoute} returned 404 Not Found`);
        }
        
        // 許容ステータス: 200, 302, 307, 401, 403
        expect([200, 302, 307, 401, 403]).toContain(status);
        
        // HTMLの内容もチェック（致命的エラーの検出）
        if (status === 200) {
          const content = await page.content();
          bodyPreview = content.substring(0, 300).replace(/\n/g, ' ').replace(/\s+/g, ' ');
          
          if (hasFatalError(content)) {
            throw new Error(`Route ${resolvedRoute} contains fatal Next.js error in HTML`);
          }
          
          // 基本的なHTMLが存在することを確認
          const hasBasicContent = await page.locator('body *').count() > 0;
          expect(hasBasicContent).toBe(true);
        }
        
      } catch (error) {
        // 失敗時の詳細情報をログ出力
        console.error(`Route test failed for ${route}:`);
        console.error(`  Resolved: ${resolvedRoute}`);
        console.error(`  Final URL: ${finalUrl}`);
        console.error(`  Body preview: ${bodyPreview}`);
        console.error(`  Error: ${error.message}`);
        throw error;
      }
    });
  }
  
  // 最低限のルート数をチェック（想定より少ない場合は検出ロジックの問題）
  test('should discover expected number of routes', async () => {
    expect(dashboardRoutes.length).toBeGreaterThan(20); // 最低20ルートは期待
  });
  
  // 重要なルートが含まれていることをチェック
  test('should include essential dashboard routes', async () => {
    const essentialRoutes = [
      '/dashboard',
      '/dashboard/services',
      '/dashboard/materials',
      '/dashboard/company'
    ];
    
    for (const essential of essentialRoutes) {
      expect(dashboardRoutes).toContain(essential);
    }
  });
});