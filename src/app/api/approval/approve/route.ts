import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyApprovalToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import { approvalRateLimit } from '@/lib/rate-limit';
import { trackBusinessEvent, notifyError } from '@/lib/monitoring';
import { APP_URL } from '@/lib/utils/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // レート制限チェック
    const rateLimitResponse = await approvalRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'トークンが必要です' },
        { status: 400 }
      );
    }

    // トークンを検証
    const payload = await verifyApprovalToken(token);
    
    if (payload.action !== 'approve') {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      );
    }

    const supabaseBrowser = await supabaseServer();

    // 組織情報を取得
    const { data: organization, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select('id, name, status, slug')
      .eq('id', payload.organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    // ステータス確認
    if (organization.status !== 'waiting_approval') {
      return NextResponse.json(
        { error: 'この組織は既に処理済みです' },
        { status: 400 }
      );
    }

    // トークンが使用済みかチェック
    const { data: existingHistory } = await supabaseBrowser
      .from('approval_history')
      .select('id')
      .eq('organization_id', payload.organizationId)
      .eq('action', 'approved')
      .eq('actor_email', payload.email)
      .gte('created_at', new Date(payload.iat * 1000).toISOString())
      .single();

    if (existingHistory) {
      return NextResponse.json(
        { error: 'このトークンは既に使用済みです' },
        { status: 400 }
      );
    }

    // 組織を公開状態に更新
    const { error: updateError } = await supabaseBrowser
      .from('organizations')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.organizationId);

    if (updateError) {
      console.error('Organization update error:', updateError);
      return NextResponse.json(
        { error: '承認処理に失敗しました' },
        { status: 500 }
      );
    }

    // 承認履歴を記録
    const { error: historyError } = await supabaseBrowser
      .from('approval_history')
      .insert({
        organization_id: payload.organizationId,
        action: 'approved',
        actor_email: payload.email,
        metadata: {
          partner_name: payload.partnerName,
          token_used: true,
          approved_at: new Date().toISOString(),
        }
      });

    if (historyError) {
      console.error('History insert error:', historyError);
    }

    // ビジネスイベントを記録
    await trackBusinessEvent(
      'approval_granted',
      'system',
      payload.organizationId,
      {
        partner_name: payload.partnerName,
        actor_email: payload.email,
        organization_name: organization.name
      }
    );

    // 成功ページにリダイレクト
    const redirectUrl = `${APP_URL}/approval/success?action=approved&organization=${encodeURIComponent(organization.name)}&slug=${organization.slug}`;
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Approval error:', error);
    const errorUrl = `${APP_URL}/approval/error?message=${encodeURIComponent('承認処理に失敗しました')}`;
    return NextResponse.redirect(errorUrl);
  }
}