/**
 * Public Statistics API
 * ランディングページ用の統計情報API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { memoryCache } from '@/lib/cache/memory-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // キャッシュから取得を試行（5分間キャッシュ）
    const stats = await memoryCache.wrap(
      'public-stats',
      async () => {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                } catch {
                  // Server Component での cookie 設定エラーをハンドル
                }
              },
            },
          }
        );

        // 並列で統計情報を取得
        const [
          organizationsResult,
          servicesResult,
          casesResult,
          categoriesResult
        ] = await Promise.allSettled([
          // 公開企業数
          supabase
            .from('organizations')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true)
            .eq('status', 'published'),
          
          // 公開サービス数
          supabase
            .from('services')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true),
          
          // 公開導入事例数
          supabase
            .from('case_studies')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true),
          
          // 業界カテゴリー数（organizationsテーブルのindustriesフィールドから）
          supabase
            .from('organizations')
            .select('industries')
            .eq('is_published', true)
            .not('industries', 'is', null)
        ]);

        // 結果を処理
        const organizations = organizationsResult.status === 'fulfilled' 
          ? organizationsResult.value.count || 0 : 0;
        
        const services = servicesResult.status === 'fulfilled' 
          ? servicesResult.value.count || 0 : 0;
        
        const cases = casesResult.status === 'fulfilled' 
          ? casesResult.value.count || 0 : 0;

        // 業界カテゴリーの一意数を計算
        let categories = 50; // デフォルト値
        if (categoriesResult.status === 'fulfilled' && categoriesResult.value.data) {
          const allIndustries = new Set<string>();
          categoriesResult.value.data.forEach((org: any) => {
            if (Array.isArray(org.industries)) {
              org.industries.forEach((industry: string) => allIndustries.add(industry));
            }
          });
          categories = allIndustries.size;
        }

        return {
          organizations,
          services,
          cases,
          categories,
          lastUpdated: new Date().toISOString()
        };
      },
      5 * 60 * 1000 // 5分間キャッシュ
    );

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5分間ブラウザキャッシュ
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('❌ Public Stats API Error:', error);
    
    // エラー時はデフォルト値を返す
    return NextResponse.json({
      organizations: 1000,
      services: 5000,
      cases: 2500,
      categories: 50,
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch real-time stats'
    }, {
      status: 200, // エラーでもレスポンスは成功として返す
      headers: {
        'Cache-Control': 'public, max-age=60', // エラー時は1分間のみキャッシュ
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// CORS対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24時間
    },
  });
}