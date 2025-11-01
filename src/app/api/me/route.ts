/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 現在のユーザーセッションを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'unauthorized' }, 
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      // ユーザーレコードが存在しない場合でも基本情報は返す
      console.warn('User record not found in users table:', userError);
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email || null,
          full_name: null
        },
        organization: null
      });
    }

    let organization = null;

    // 組織情報を取得（organization_id が存在する場合）
    if (userData?.organization_id) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, feature_flags')
        .eq('id', userData.organization_id)
        .single();

      if (!orgError && orgData) {
        organization = {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          plan: orgData.plan || 'free',
          feature_flags: orgData.feature_flags || {}
        };
      } else {
        console.warn('Organization not found:', orgError);
      }
    }

    // レスポンス返却
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || null
      },
      organization
    });

  } catch (error) {
    console.error('API /me error:', error);
    
    // エラーが発生してもダッシュボードを壊さないよう、できるだけ情報を返す
    return NextResponse.json({
      user: null,
      organization: null
    }, { status: 500 });
  }
}