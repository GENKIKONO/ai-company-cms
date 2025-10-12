/**
 * 管理者ユーザー詳細API - Node.js Runtime + Service Role
 * GET /api/admin/users/[id]/details - ユーザーの詳細情報と所有コンテンツ
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerUser, isAdmin } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Admin Client (Service Role)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // Authentication & Authorization
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Service Role Client
    const admin = createAdminClient();

    // 1. ユーザー基本情報を取得
    const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(userId);

    if (userError) {
      console.error('Admin API error:', userError);
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', detail: userError.message },
        { status: 404 }
      );
    }

    // 2. ユーザーの組織を取得
    const { data: organizations, error: orgError } = await admin
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        status,
        is_published,
        created_at,
        updated_at,
        description,
        url,
        email,
        telephone,
        address_country,
        address_region,
        address_locality,
        plan,
        admin_plan_override,
        admin_plan_notes,
        admin_plan_changed_by,
        admin_plan_changed_at,
        trial_expires_at
      `)
      .eq('created_by', userId);

    if (orgError) {
      console.error('Organizations query error:', orgError);
    }

    // 3. 組織IDを取得してコンテンツを取得
    const organizationIds = organizations?.map(org => org.id) || [];
    
    let services = [];
    let posts = [];
    let caseStudies = [];
    let faqs = [];

    if (organizationIds.length > 0) {
      // サービス取得
      const { data: servicesData, error: servicesError } = await admin
        .from('services')
        .select(`
          id,
          name,
          description,
          status,
          is_published,
          created_at,
          updated_at,
          organization_id
        `)
        .in('organization_id', organizationIds);

      if (!servicesError) services = servicesData || [];

      // 投稿取得
      const { data: postsData, error: postsError } = await admin
        .from('posts')
        .select(`
          id,
          title,
          status,
          is_published,
          created_at,
          updated_at,
          organization_id
        `)
        .in('organization_id', organizationIds);

      if (!postsError) posts = postsData || [];

      // ケーススタディ取得
      const { data: caseStudiesData, error: caseStudiesError } = await admin
        .from('case_studies')
        .select(`
          id,
          title,
          status,
          is_published,
          created_at,
          updated_at,
          organization_id
        `)
        .in('organization_id', organizationIds);

      if (!caseStudiesError) caseStudies = caseStudiesData || [];

      // FAQ取得
      const { data: faqsData, error: faqsError } = await admin
        .from('faqs')
        .select(`
          id,
          question,
          status,
          is_published,
          created_at,
          updated_at,
          organization_id
        `)
        .in('organization_id', organizationIds);

      if (!faqsError) faqs = faqsData || [];
    }

    // 4. 統計情報を計算
    const stats = {
      organizations: organizations?.length || 0,
      services: services.length,
      posts: posts.length,
      caseStudies: caseStudies.length,
      faqs: faqs.length,
      totalContent: services.length + posts.length + caseStudies.length + faqs.length,
      publishedContent: [
        ...services.filter(s => s.is_published),
        ...posts.filter(p => p.is_published),
        ...caseStudies.filter(c => c.is_published),
        ...faqs.filter(f => f.is_published)
      ].length
    };

    // 5. 最近の活動を計算
    const allContent = [
      ...services.map(s => ({ ...s, type: 'service' })),
      ...posts.map(p => ({ ...p, type: 'post' })),
      ...caseStudies.map(c => ({ ...c, type: 'case_study' })),
      ...faqs.map(f => ({ ...f, type: 'faq' }))
    ];

    const recentActivity = allContent
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);

    // レスポンス構築
    const userDetails = {
      user: {
        id: targetUser.user.id,
        email: targetUser.user.email,
        role: targetUser.user.app_metadata?.role || 'user',
        created_at: targetUser.user.created_at,
        updated_at: targetUser.user.updated_at,
        last_sign_in_at: targetUser.user.last_sign_in_at,
        email_confirmed_at: targetUser.user.email_confirmed_at
      },
      organizations: organizations || [],
      content: {
        services,
        posts,
        caseStudies,
        faqs
      },
      stats,
      recentActivity
    };

    return NextResponse.json(userDetails);

  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}