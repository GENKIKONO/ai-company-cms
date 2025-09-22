import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyApprovalToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
    
    if (payload.action !== 'reject') {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      );
    }

    const supabaseBrowser = supabaseServer();

    // 組織情報を取得
    const { data: organization, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select('id, name, status')
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
      .eq('action', 'rejected')
      .eq('actor_email', payload.email)
      .gte('created_at', new Date(payload.iat * 1000).toISOString())
      .single();

    if (existingHistory) {
      return NextResponse.json(
        { error: 'このトークンは既に使用済みです' },
        { status: 400 }
      );
    }

    // 組織を下書き状態に戻す
    const { error: updateError } = await supabaseBrowser
      .from('organizations')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.organizationId);

    if (updateError) {
      console.error('Organization update error:', updateError);
      return NextResponse.json(
        { error: '拒否処理に失敗しました' },
        { status: 500 }
      );
    }

    // 拒否履歴を記録
    const { error: historyError } = await supabaseBrowser
      .from('approval_history')
      .insert({
        organization_id: payload.organizationId,
        action: 'rejected',
        actor_email: payload.email,
        metadata: {
          partner_name: payload.partnerName,
          token_used: true,
          rejected_at: new Date().toISOString(),
        }
      });

    if (historyError) {
      console.error('History insert error:', historyError);
    }

    // 成功ページにリダイレクト
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/approval/success?action=rejected&organization=${encodeURIComponent(organization.name)}`;
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Rejection error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorUrl = `${baseUrl}/approval/error?message=${encodeURIComponent('拒否処理に失敗しました')}`;
    return NextResponse.redirect(errorUrl);
  }
}