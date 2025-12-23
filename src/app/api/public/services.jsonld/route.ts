/**
 * Public Services JSON-LD API
 * SEO用のサービス構造化データを返す
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/server/timeout';

export const runtime = 'edge';
export const revalidate = 300; // ISR 5分

/**
 * GET /api/public/services.jsonld
 * 公開サービスのJSON-LDを取得
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { 'X-Client': 'public-jsonld-api' } },
      }
    );

    // public_services_jsonld ビューから取得
    const result = await withTimeout(
      supabase
        .from('public_services_jsonld')
        .select('*')
        .order('name', { ascending: true })
        .then((res: { data: any[] | null; error: any }) => res),
      5000
    );

    if (result.error) {
      console.error('GET /api/public/services.jsonld', result.error.message);
      throw result.error;
    }

    const data = result.data;

    // JSON-LD形式でレスポンス
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': data ?? [],
    };

    return NextResponse.json(jsonLd, {
      headers: {
        'Content-Type': 'application/ld+json',
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    console.error('GET /api/public/services.jsonld error:', e);
    return NextResponse.json(
      { '@context': 'https://schema.org', '@graph': [], error: 'internal_error' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/ld+json' },
      }
    );
  }
}
