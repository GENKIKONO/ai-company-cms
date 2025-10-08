// ✅ データ整合性修復API: /api/admin/fix-publication-consistency
// is_published と status の不整合を自動修復
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { env } from '@/lib/env';

// 管理者チェック
function isAdmin(userEmail?: string): boolean {
  return userEmail?.toLowerCase().trim() === env.ADMIN_EMAIL;
}

export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET - パブリケーション状態の不整合を検査
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !isAdmin(user.email)) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    // 不整合データの検査
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, slug, name, status, is_published')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 不整合パターンの分析
    const inconsistencies = orgs?.filter(org => {
      return (org.status === 'published' && org.is_published !== true) ||
             (org.status === 'draft' && org.is_published === true);
    }) || [];

    const analysis = {
      total_orgs: orgs?.length || 0,
      inconsistent_count: inconsistencies.length,
      inconsistencies: inconsistencies.map(org => ({
        id: org.id,
        slug: org.slug,
        name: org.name,
        status: org.status,
        is_published: org.is_published,
        issue: org.status === 'published' && org.is_published !== true 
          ? 'published_but_not_is_published'
          : 'draft_but_is_published'
      }))
    };

    console.log('[VERIFY] Publication consistency analysis:', analysis);

    return NextResponse.json(analysis, { status: 200 });

  } catch (error) {
    console.error('Error analyzing publication consistency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - パブリケーション状態の不整合を自動修復
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !isAdmin(user.email)) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { fix_mode = 'status_wins' } = await request.json();

    // 不整合データの取得
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, slug, name, status, is_published')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inconsistencies = orgs?.filter(org => {
      return (org.status === 'published' && org.is_published !== true) ||
             (org.status === 'draft' && org.is_published === true);
    }) || [];

    if (inconsistencies.length === 0) {
      return NextResponse.json({ 
        message: 'No inconsistencies found',
        fixed_count: 0 
      }, { status: 200 });
    }

    // 修復処理
    const fixes = [];
    for (const org of inconsistencies) {
      let updateData: any;
      
      if (fix_mode === 'status_wins') {
        // status フィールドを基準にして is_published を合わせる
        updateData = {
          is_published: org.status === 'published'
        };
      } else if (fix_mode === 'is_published_wins') {
        // is_published フィールドを基準にして status を合わせる
        updateData = {
          status: org.is_published ? 'published' : 'draft'
        };
      } else {
        // デフォルト: 公開状態を優先（published状態を保持）
        if (org.status === 'published') {
          updateData = { is_published: true };
        } else {
          updateData = { status: 'draft', is_published: false };
        }
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', org.id);

      if (updateError) {
        console.error(`Failed to fix org ${org.id}:`, updateError);
      } else {
        fixes.push({
          id: org.id,
          slug: org.slug,
          name: org.name,
          before: { status: org.status, is_published: org.is_published },
          after: { 
            status: updateData.status || org.status, 
            is_published: updateData.is_published ?? org.is_published 
          }
        });
      }
    }

    // キャッシュ無効化
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      revalidateTag('org-public');
      revalidatePath('/organizations');
      console.log('[VERIFY] Cache invalidated after consistency fix');
    } catch (cacheError) {
      console.warn('Cache invalidation failed:', cacheError);
    }

    console.log(`[VERIFY] Fixed ${fixes.length} publication inconsistencies`);

    return NextResponse.json({
      message: `Fixed ${fixes.length} inconsistencies`,
      fixed_count: fixes.length,
      fixes,
      mode: fix_mode
    }, { status: 200 });

  } catch (error) {
    console.error('Error fixing publication consistency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}