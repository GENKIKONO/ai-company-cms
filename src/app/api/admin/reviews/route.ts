// Admin-Only API: /api/admin/reviews
// 管理者向け審査キュー管理API
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  requireAdminAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';
import {
  handleApiError,
  validationError,
  notFoundError,
  handleZodError
} from '@/lib/api/error-responses';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// 審査アクションスキーマ
const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  admin_notes: z.string().optional()
});

// GET - 審査待ち組織一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const adminCheck = requireAdminAccess(authResult as AuthContext);
    if (adminCheck) {
      return adminCheck;
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 審査待ち組織を取得
    const { data: pendingOrgs, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        corporate_number,
        status,
        verified,
        telephone,
        email,
        address_region,
        address_locality,
        created_at,
        updated_at
      `)
      .in('status', ['public_unverified', 'waiting_approval'])
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Database query error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to fetch pending reviews' },
        { status: 500 }
      );
    }

    // 審査履歴も取得
    const orgIds = pendingOrgs?.map(org => org.id) || [];
    const { data: reviewHistory } = await supabase
      .from('review_audit')
      .select(`
        id,
        organization_id,
        action,
        admin_user_id,
        old_status,
        new_status,
        reason,
        created_at
      `)
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false });

    // 組織ごとに履歴をマッピング
    const orgsWithHistory = pendingOrgs?.map(org => ({
      ...org,
      review_history: reviewHistory?.filter(h => h.organization_id === org.id) || []
    }));

    return NextResponse.json({
      data: orgsWithHistory || [],
      count: orgsWithHistory?.length || 0
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST - 審査アクション実行（承認/却下）
export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const adminCheck = requireAdminAccess(authResult as AuthContext);
    if (adminCheck) {
      return adminCheck;
    }

    const body = await request.json();
    
    // バリデーション
    const validation = reviewActionSchema.safeParse(body);
    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const { action, reason, admin_notes } = validation.data;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('org_id');

    if (!organizationId) {
      return validationError('Organization ID is required');
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 現在の組織状態を取得
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, status, verified')
      .eq('id', organizationId)
      .single();

    if (fetchError || !org) {
      return notFoundError('Organization');
    }

    // 審査アクションに応じてステータス更新
    const newStatus = action === 'approve' ? 'published' : 'draft';
    const newVerified = action === 'approve' ? true : false;

    // 組織ステータス更新
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        status: newStatus,
        verified: newVerified,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) {
      logger.error('Organization update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization status' },
        { status: 500 }
      );
    }

    // 審査履歴記録
    const { error: auditError } = await supabase
      .from('review_audit')
      .insert({
        organization_id: organizationId,
        action: `${action}_organization`,
        admin_user_id: (authResult as AuthContext).user.id,
        old_status: org.status,
        new_status: newStatus,
        reason: reason || admin_notes || `Organization ${action}d by admin`
      });

    if (auditError) {
      logger.error('Audit log error:', auditError);
      // 監査ログエラーは警告のみ、メイン処理は継続
    }

    return NextResponse.json({
      success: true,
      message: `Organization ${action}d successfully`,
      data: {
        organization_id: organizationId,
        old_status: org.status,
        new_status: newStatus,
        action,
        reason
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}