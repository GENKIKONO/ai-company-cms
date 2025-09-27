// Public API: /api/public/organizations/[slug]
// 組織の公開情報とコンテンツを取得
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await supabaseServer();
    
    // 組織情報を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // 公開されたコンテンツを並行取得
    const [postsResult, servicesResult, caseStudiesResult, faqsResult] = await Promise.all([
      // 公開された記事
      supabase
        .from('posts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10),
      
      // サービス一覧
      supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      
      // 事例一覧
      supabase
        .from('case_studies')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      
      // FAQ一覧
      supabase
        .from('faqs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
    ]);

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
    console.error('Failed to fetch organization data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
