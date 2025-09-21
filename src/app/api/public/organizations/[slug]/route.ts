import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
@// import { trackOrganizationView } from '@/lib/analytics';
import { createError, errorToResponse } from '@/lib/error-handler';
import { apiLogger, PerformanceMonitor } from '@/lib/logger';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    apiLogger.info('Public organization API request started', {
      slug: params.slug,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip
    }, requestId);

    const slug = params.slug;

    if (!slug) {
      throw createError.validation('スラグが指定されていません', { slug });
    }

    const supabase = supabaseServer();

    // 公開中の企業情報を取得（パフォーマンス監視付き）
    const organization = await PerformanceMonitor.monitor(
      'database',
      'fetch organization',
      async () => {
        const { data, error } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            description,
            legal_form,
            representative_name,
            founded,
            capital,
            employees,
            address_country,
            address_region,
            address_locality,
            street_address,
            postal_code,
            telephone,
            email,
            email_public,
            url,
            logo_url,
            same_as,
            industries,
            status,
            created_at,
            updated_at,
            partner_id,
            services!org_id(
              id,
              name,
              description,
              features,
              price_range,
              url,
              created_at
            ),
            case_studies!org_id(
              id,
              title,
              problem,
              solution,
              outcome,
              metrics,
              client_name,
              client_industry,
              is_anonymous,
              created_at
            ),
            faqs!org_id(
              id,
              question,
              answer,
              category,
              order_index,
              created_at
            )
          `)
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          throw createError.notFound('企業', slug);
        }

        return data;
      },
      apiLogger,
      { slug }
    );

    if (!organization) {
      throw createError.notFound('企業', slug);
    }

    // パートナー情報も取得（表示用）
    let partner = null;
    if (organization.partner_id) {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id, name, brand_logo_url')
        .eq('id', organization.partner_id)
        .single();
      
      partner = partnerData;
    }

    // アクセス統計を記録（非同期）
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // Analytics追跡（バックグラウンド）
    setTimeout(() => {
      try {
        // サーバーサイドでの基本的な追跡
        console.log(`Organization view: ${organization.name} (${slug}) - UA: ${userAgent} - Ref: ${referer}`);
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    }, 0);

    // 最終アクセス時間を更新（非同期）
    setTimeout(async () => {
      try {
        await supabase
          .from('organizations')
          .update({ 
            last_accessed: new Date().toISOString(),
            // view_count: organization.view_count ? organization.view_count + 1 : 1
          })
          .eq('id', organization.id);
      } catch (error) {
        console.error('View count update error:', error);
      }
    }, 0);

    // レスポンスデータの整形
    const responseData = {
      organization: {
        ...organization,
        services: organization.services || [],
        case_studies: organization.case_studies || [],
        faqs: organization.faqs?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)) || []
      },
      partner
    };

    const duration = Date.now() - startTime;
    
    apiLogger.request(
      'GET',
      `/api/public/organizations/${slug}`,
      200,
      duration,
      requestId,
      undefined,
      { organizationId: organization.id }
    );

    return NextResponse.json(responseData);

  } catch (error) {
    const duration = Date.now() - startTime;
    const { status, body } = errorToResponse(error, requestId);
    
    apiLogger.request(
      'GET',
      `/api/public/organizations/${params.slug}`,
      status,
      duration,
      requestId,
      undefined,
      { error: body }
    );

    return NextResponse.json(body, { status });
  }
}

// HEAD リクエスト対応（SEO用）
export async function HEAD(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = supabaseServer();
    const slug = params.slug;

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id, name, updated_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !organization) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Last-Modified': new Date(organization.updated_at).toUTCString(),
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5分キャッシュ
      }
    });

  } catch (error) {
    console.error('HEAD request error:', error);
    return new Response(null, { status: 500 });
  }
}