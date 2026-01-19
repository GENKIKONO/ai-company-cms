// Public API: /api/public/organizations/[slug]
// 組織の公開情報とコンテンツを取得
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { logger } from '@/lib/log';
import { detectAIBot, extractBotInfoFromHeaders, shouldLogBot, extractClientIP } from '@/lib/utils/ai-bot-detector';
import { logAIBotAccess } from '@/lib/utils/ai-bot-logger';

export const dynamic = 'force-dynamic';

// ============================================
// 🔒 Public API Security: Allowlist/Blocklist
// ============================================

/**
 * 公開APIで返却を許可するorganizationカラム
 * ※ select() で使用する
 */
const ORGANIZATION_PUBLIC_COLUMNS = `
  id, name, slug, description,
  legal_form, representative_name, corporate_number,
  established_at, capital, employees,
  address_country, address_region, address_locality, address_postal_code, address_street,
  lat, lng,
  telephone, email, email_public, url, logo_url, website_url,
  industries, same_as,
  status, is_published,
  created_at, updated_at,
  meta_title, meta_description, meta_keywords,
  verified,
  show_services, show_posts, show_case_studies, show_faqs, show_qa, show_news, show_partnership, show_contact
`;

/**
 * 絶対に公開APIで返さないカラム（sanitize用blocklist）
 * 万一 select('*') が使われた場合の保険
 */
const ORGANIZATION_BLOCKED_KEYS = [
  'created_by',
  'user_id',
  'feature_flags',
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'partner_id',
  'trial_end',
  'data_status',
  'verified_by',
  'verified_at',
  'verification_source',
  'content_hash',
  'source_urls',
  'archived',
  'deleted_at',
  // DBに存在しない可能性があるカラム
  'keywords',
] as const;

/**
 * オブジェクトから秘匿キーを削除する（保険用sanitize）
 */
function sanitizeOrganization<T extends Record<string, unknown>>(org: T): Omit<T, typeof ORGANIZATION_BLOCKED_KEYS[number]> {
  const sanitized = { ...org };
  for (const key of ORGANIZATION_BLOCKED_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

// GET: 組織の公開情報とコンテンツを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let orgId: string | null = null;
  let headers: any | null = null;
  let url: string | null = null;

  try {
    const { slug } = await params;
    headers = request.headers;
    url = request.url;
    
    // Claude改善: より詳細なログ記録でデバッグを支援
    logger.debug(`[API] Fetching organization data for slug: ${slug}`);
    
    // 🔥 FIX: Public API should use admin client to bypass RLS for published content
    const supabase = supabaseAdmin;
    
    // 公開判定: is_published + published_at + deleted_at
    const nowISO = new Date().toISOString();

    // 組織情報を取得（VIEW経由 - SST強制）
    // 🔒 公開APIのため allowlist カラムのみ取得（課金・内部情報は除外）
    const { data: organization, error: orgError } = await supabase
      .from('v_organizations_public')
      .select(ORGANIZATION_PUBLIC_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('status', 'published')
      .maybeSingle();

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

    // Store orgId for bot logging
    orgId = organization.id;
    logger.info(`[API] Found organization: ${organization.name} (ID: ${organization.id})`);

    // 公開されたコンテンツを並行取得（VIEW経由 - SST強制）
    const [postsResult, servicesResult, caseStudiesResult, faqsResult] = await Promise.all([
      // 公開された記事（VIEW経由）
      supabase
        .from('v_posts_public')
        .select('id, title, slug, content_markdown, content_html, status, published_at, created_at, updated_at')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10),

      // 公開されたサービス一覧（VIEW経由）
      supabase
        .from('v_services_public')
        .select('id, name, price, duration_months, category, description, features, image_url, video_url, cta_text, cta_url, created_at, updated_at')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),

      // 公開された事例一覧（VIEW経由）
      supabase
        .from('v_case_studies_public')
        .select('id, title, problem, solution, result, tags, created_at, updated_at')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),

      // 公開されたFAQ一覧（VIEW経由）
      supabase
        .from('v_faqs_public')
        .select('id, question, answer, category, sort_order, created_at, updated_at')
        .eq('organization_id', organization.id)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ]);

    // Claude改善: データ取得の結果をログ記録
    logger.debug(`[API] Content counts for ${organization.name}: posts=${postsResult.data?.length || 0}, services=${servicesResult.data?.length || 0}, case_studies=${caseStudiesResult.data?.length || 0}, faqs=${faqsResult.data?.length || 0}`);

    // 🔒 保険: sanitize で秘匿キーを確実に削除
    const safeOrganization = sanitizeOrganization(organization);

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
    
    // 組織の存在確認のみ
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, updated_at')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      return new NextResponse(null, { status: 500 });
    }

    if (!data) {
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
    logger.error('[API] HEAD request failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return new NextResponse(null, { status: 500 });
  }
}