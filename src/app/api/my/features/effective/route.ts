/**
 * GET /api/my/features/effective
 *
 * クライアントから組織の有効機能セットを取得するためのAPI
 * featureGate.ts はサーバー専用（cookies()使用）のため、
 * Client Component からはこのAPIを経由して取得する
 *
 * Query params:
 * - org_id: 組織ID（必須）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { getEffectiveFeatures, type Subject } from '@/lib/featureGate';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUserWithClient(supabase);

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 }
      );
    }

    // Query params から org_id を取得
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'org_id is required' } },
        { status: 400 }
      );
    }

    // 組織メンバーかチェック（RLS でも制御されるが、明示的にチェック）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (membershipError) {
      // eslint-disable-next-line no-console
      console.error('[api/my/features/effective] Membership check error:', {
        code: membershipError.code,
        message: membershipError.message,
      });
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'メンバーシップの確認に失敗しました' } },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'この組織へのアクセス権がありません' } },
        { status: 403 }
      );
    }

    // featureGate 経由で機能セットを取得
    const subject: Subject = { type: 'org', id: orgId };
    const features = await getEffectiveFeatures(supabase, subject);

    // EffectiveFeature[] をクライアントに返す
    return NextResponse.json({
      data: features,
      meta: {
        org_id: orgId,
        fetched_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/my/features/effective] Unexpected error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 }
    );
  }
}
