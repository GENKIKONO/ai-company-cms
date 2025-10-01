// Public API: /api/public/organizations/[slug]
// 組織の公開情報とコンテンツを取得
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET: 組織の公開情報とコンテンツを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Claude改善: より詳細なログ記録でデバッグを支援
    console.log(`[API] Fetching organization data for slug: ${slug}`);
    
    const supabase = await supabaseServer();
    
    // 組織情報を取得（is_published=true の企業のみ）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (orgError || !organization) {
      console.warn(`[API] Organization not found for slug: ${slug}`, orgError);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Found organization: ${organization.name} (ID: ${organization.id})`);

    // 公開されたコンテンツを並行取得
    const [postsResult, servicesResult, caseStudiesResult, faqsResult] = await Promise.all([
      // 公開された記事
      supabase
        .from('posts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // 公開されたサービス一覧
      supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      
      // 公開された事例一覧
      supabase
        .from('case_studies')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      
      // 公開されたFAQ一覧
      supabase
        .from('faqs')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
    ]);

    // Claude改善: データ取得の結果をログ記録
    console.log(`[API] Content counts for ${organization.name}: posts=${postsResult.data?.length || 0}, services=${servicesResult.data?.length || 0}, case_studies=${caseStudiesResult.data?.length || 0}, faqs=${faqsResult.data?.length || 0}`);

    return NextResponse.json({
      data: {
        organization,
        posts: postsResult.data || [],
        services: servicesResult.data || [],
        case_studies: caseStudiesResult.data || [],
        faqs: faqsResult.data || []
      }
    });

  } catch (error) {
    // Claude改善: エラーログを詳細化
    console.error('[API] Failed to fetch organization data:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// HEAD: メタデータのみ取得（SEO・プリフライト対応）
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await supabaseServer();
    
    // 組織の存在確認のみ
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, updated_at')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return new NextResponse(null, { status: 404 });
    }

    // Claude改善: 適切なHEADレスポンスヘッダー
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (data.updated_at) {
      headers.set('Last-Modified', new Date(data.updated_at).toUTCString());
    }

    return new NextResponse(null, { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('[API] HEAD request failed:', error);
    return new NextResponse(null, { status: 500 });
  }
}