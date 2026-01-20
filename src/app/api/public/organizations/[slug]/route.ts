// Public API: /api/public/organizations/[slug]
// 組織の公開情報とコンテンツを取得
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { logger } from '@/lib/log';
import { logAIBotAccess } from '@/lib/utils/ai-bot-logger';
import {
  V_ORGANIZATIONS_PUBLIC_SELECT_DETAIL,
  V_SERVICES_PUBLIC_SELECT,
  V_CASE_STUDIES_PUBLIC_SELECT,
  V_POSTS_PUBLIC_SELECT,
  V_FAQS_PUBLIC_SELECT,
  sanitizeForPublic,
} from '@/lib/db/public-view-contracts';

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

    logger.debug(`[API] Fetching organization data for slug: ${slug}`);

    const supabase = supabaseAdmin;

    // ============================================
    // 組織情報を取得
    // ⚠️ 契約: V_ORGANIZATIONS_PUBLIC_SELECT_DETAIL
    // ⚠️ VIEWは既に公開済みデータのみ含む（追加フィルター不要）
    // ============================================
    const { data: organizationRaw, error: orgError } = await supabase
      .from('v_organizations_public')
      .select(V_ORGANIZATIONS_PUBLIC_SELECT_DETAIL)
      .eq('slug', slug)
      .maybeSingle();

    // 型アサーション（VIEWの型はSupabaseが推論できないため）
    const organization = organizationRaw as unknown as Record<string, unknown> | null;

    if (orgError) {
      logger.error(`[API] Database error for slug: ${slug}`, { data: orgError });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (!organization) {
      logger.warn(`[API] Organization not found for slug: ${slug}`);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    orgId = organization.id as string;
    logger.info(`[API] Found organization: ${organization.name} (ID: ${organization.id})`);

    // ============================================
    // 公開コンテンツを並行取得
    // ⚠️ 各契約を使用: V_*_PUBLIC_SELECT
    // ⚠️ VIEWは既に公開済みデータのみ含む（追加フィルター不要）
    // ============================================
    const [postsResult, servicesResult, caseStudiesResult, faqsResult] = await Promise.all([
      // 公開された記事
      supabase
        .from('v_posts_public')
        .select(V_POSTS_PUBLIC_SELECT)
        .eq('organization_id', orgId)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(10),

      // 公開されたサービス一覧
      supabase
        .from('v_services_public')
        .select(V_SERVICES_PUBLIC_SELECT)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),

      // 公開された事例一覧
      supabase
        .from('v_case_studies_public')
        .select(V_CASE_STUDIES_PUBLIC_SELECT)
        .eq('organization_id', orgId)
        .order('published_at', { ascending: false, nullsFirst: false }),

      // 公開されたFAQ一覧
      supabase
        .from('v_faqs_public')
        .select(V_FAQS_PUBLIC_SELECT)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
    ]);

    // エラーログ（データ取得失敗時も空配列で継続）
    if (postsResult.error) {
      logger.warn(`[API] Posts query failed for org ${orgId}:`, { data: postsResult.error });
    }
    if (servicesResult.error) {
      logger.warn(`[API] Services query failed for org ${orgId}:`, { data: servicesResult.error });
    }
    if (caseStudiesResult.error) {
      logger.warn(`[API] Case studies query failed for org ${orgId}:`, { data: caseStudiesResult.error });
    }
    if (faqsResult.error) {
      logger.warn(`[API] FAQs query failed for org ${orgId}:`, { data: faqsResult.error });
    }

    logger.debug(`[API] Content counts for ${organization.name}: posts=${postsResult.data?.length || 0}, services=${servicesResult.data?.length || 0}, case_studies=${caseStudiesResult.data?.length || 0}, faqs=${faqsResult.data?.length || 0}`);

    // 保険: sanitize で秘匿キーを確実に削除
    const safeOrganization = sanitizeForPublic(organization);

    return NextResponse.json({
      data: {
        organization: safeOrganization,
        posts: postsResult.data || [],
        services: servicesResult.data || [],
        case_studies: caseStudiesResult.data || [],
        faqs: faqsResult.data || []
      }
    });

  } catch (error) {
    logger.error('[API] Failed to fetch organization data:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // AI Bot Logging (non-blocking)
    if (headers && url && orgId) {
      try {
        await logAIBotAccess(headers, url, orgId, 200, 'GET');
      } catch (logError) {
        logger.warn('AI bot logging failed:', { data: logError });
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
    const supabase = supabaseAdmin;

    // 組織の存在確認のみ（VIEWから最小限のカラム）
    const { data, error } = await supabase
      .from('v_organizations_public')
      .select('id, name, updated_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return new NextResponse(null, { status: 500 });
    }

    if (!data) {
      return new NextResponse(null, { status: 404 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    if (data.updated_at) {
      responseHeaders.set('Last-Modified', new Date(data.updated_at).toUTCString());
    }

    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders
    });

  } catch (error) {
    logger.error('[API] HEAD request failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return new NextResponse(null, { status: 500 });
  }
}
