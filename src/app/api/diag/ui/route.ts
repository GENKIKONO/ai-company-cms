import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Node.js runtime for filesystem access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ビルド情報の取得
    const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
    const deployId = process.env.VERCEL_DEPLOYMENT_ID ?? null;

    // ルートファイルの解決
    const rootPageFiles = await glob('src/app/page.{tsx,ts,jsx,js}', { cwd: process.cwd() });
    const dashboardPageFiles = await glob('src/app/dashboard/page.{tsx,ts,jsx,js}', { cwd: process.cwd() });

    const routes = {
      root: rootPageFiles[0] || null,
      dashboard: dashboardPageFiles[0] || null
    };

    // AuthHeaderの存在確認（ルートレイアウトの静的解析）
    let hasAuthHeader = false;
    try {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      if (fs.existsSync(layoutPath)) {
        const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
        // importとJSX要素の両方をチェック
        hasAuthHeader = layoutContent.includes('AuthHeader') && 
                       layoutContent.includes('<AuthHeader');
      }
    } catch (error) {
      console.error('Layout analysis error:', error);
    }

    // 企業検索カードの存在確認（ダッシュボードの静的解析）
    let hasSearchCard = false;
    try {
      if (routes.dashboard) {
        const dashboardPath = path.join(process.cwd(), routes.dashboard);
        if (fs.existsSync(dashboardPath)) {
          const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
          // 「企業検索」テキストとSearchCardコンポーネントの両方をチェック
          hasSearchCard = dashboardContent.includes('企業検索') ||
                         dashboardContent.includes('SearchCard') ||
                         dashboardContent.includes('CompanySearch');
        }
      }
    } catch (error) {
      console.error('Dashboard analysis error:', error);
    }

    const diagnosis = {
      commit,
      deployId,
      routes,
      flags: {
        hasAuthHeader,
        hasSearchCard
      }
    };

    return NextResponse.json(diagnosis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    // 例外も200でJSONとして返す（診断APIとして常にレスポンスを返す）
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      routes: {
        root: null,
        dashboard: null
      },
      flags: {
        hasAuthHeader: false,
        hasSearchCard: false
      }
    }, { status: 200 });
  }
}