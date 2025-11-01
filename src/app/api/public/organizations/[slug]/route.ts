// Public API: /api/public/organizations/[slug]
// 組織の公開情報とコンテンツを取得
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';
import { detectAIBot, extractBotInfoFromHeaders, shouldLogBot, extractClientIP } from '@/lib/utils/ai-bot-detector';
import { logAIBotAccess } from '@/lib/utils/ai-bot-logger';

export const dynamic = 'force-dynamic';

// GET: 組織の公開情報とコンテンツを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let orgId: string | null = null;
  let headers: Headers | null = null;
  let url: string | null = null;

  try {
    const { slug } = await params;
    headers = request.headers;
    url = request.url;
    
    // Claude改善: より詳細なログ記録でデバッグを支援
    logger.debug('Debug', `[API] Fetching organization data for slug: ${slug}`);
    
    // 🔥 FIX: Public API should use admin client to bypass RLS for published content
    const supabase = supabaseAdmin();
    
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

    // Store orgId for bot logging
    orgId = organization.id;
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
    logger.debug('Debug', `[API] Content counts for ${organization.name}: posts=${postsResult.data?.length || 0}, services=${servicesResult.data?.length || 0}, case_studies=${caseStudiesResult.data?.length || 0}, faqs=${faqsResult.data?.length || 0}`);

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
    logger.error('[API] Failed to fetch organization data:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // 🤖 AI Bot Logging (non-blocking)
    if (headers && url && orgId) {
      try {
        // 正しい引数でAI Bot Loggingを実行
        await logAIBotAccess(headers, url, orgId, 200, 'GET');
      } catch (logError) {
        // Non-blocking: log error but don't affect response
        logger.warn('AI bot logging failed:', logError);
      }
    }
  }
}

// HEAD: メタデータのみ取得（SEO・プリフライト対応）
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = supabaseAdmin();
    
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
    logger.error('[API] HEAD request failed', error instanceof Error ? error : new Error(String(error)));
    return new NextResponse(null, { status: 500 });
  }
}