/**
 * Public Organizations Summary API
 * 公開組織の統計サマリーを返す
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/server/timeout';

export const runtime = 'edge';
export const revalidate = 120; // ISR 2分

/**
 * GET /api/public/organizations/summary
 * 公開組織の件数・統計を取得
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { 'X-Client': 'public-summary-api' } },
      }
    );

    // public_organizations_tbl テーブルから件数取得
    const result = await withTimeout(
      supabase
        .from('public_organizations_tbl')
        .select('*', { count: 'exact', head: true })
        .then((res: { count: number | null; error: any }) => res),
      5000
    );

    if (result.error) {
      console.error('GET /api/public/organizations/summary', result.error.message);
      throw result.error;
    }

    const count = result.count;

    return NextResponse.json(
      { total: count ?? 0 },
      {
        headers: {
          'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=600',
        },
      }
    );
  } catch (e) {
    console.error('GET /api/public/organizations/summary error:', e);
    return NextResponse.json(
      { error: 'internal_error', total: 0 },
      { status: 500 }
    );
  }
}
