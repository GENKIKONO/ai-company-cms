/**
 * 管理者用通報管理API
 * GET /api/admin/reports
 * 
 * 機能:
 * - 管理者が全通報を閲覧
 * - フィルタリング・ソート機能
 * - 企業情報含む詳細表示
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import {
  requireAuth,
  requireAdminAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // 管理者権限チェック
    const adminCheck = requireAdminAccess(authResult as AuthContext);
    if (adminCheck) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 通報データ取得（企業情報も含む）
    let query = supabase
      .from('reports')
      .select(`
        *,
        organizations!inner(
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    // ステータスフィルター
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // ページネーション
    const { data: reports, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: '通報データの取得に失敗しました'
        },
        { status: 500 }
      );
    }

    // データ整形
    const formattedReports = reports?.map(report => ({
      id: report.id,
      organization_id: report.organization_id,
      organization_name: report.organizations?.name,
      organization_slug: report.organizations?.slug,
      report_type: report.report_type,
      description: report.description,
      reported_url: report.reported_url,
      reporter_ip: report.reporter_ip,
      status: report.status,
      admin_notes: report.admin_notes,
      reviewed_by: report.reviewed_by,
      reviewed_at: report.reviewed_at,
      created_at: report.created_at,
      updated_at: report.updated_at,
    })) || [];

    return NextResponse.json(
      {
        reports: formattedReports,
        meta: {
          total: count || 0,
          limit,
          offset,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Admin reports API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました'
      },
      { status: 500 }
    );
  }
}