import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendApprovalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: '組織IDが必要です' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 組織情報を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        status,
        owner_user_id,
        partner_id,
        partners!inner(
          id,
          name,
          primary_contact_email
        )
      `)
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('Organization fetch error:', orgError);
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    // ステータス確認
    if (organization.status !== 'draft') {
      return NextResponse.json(
        { error: '下書き状態の組織のみ承認申請できます' },
        { status: 400 }
      );
    }

    // パートナー情報確認
    if (!organization.partners?.[0]?.primary_contact_email) {
      return NextResponse.json(
        { error: 'パートナーの連絡先が設定されていません' },
        { status: 400 }
      );
    }

    // 申請者情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 申請者が組織の所有者かチェック
    if (organization.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: '組織の所有者のみが承認申請できます' },
        { status: 403 }
      );
    }

    // ステータスを承認待ちに更新
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        status: 'waiting_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Status update error:', updateError);
      return NextResponse.json(
        { error: 'ステータスの更新に失敗しました' },
        { status: 500 }
      );
    }

    // 承認履歴を記録
    const { error: historyError } = await supabase
      .from('approval_history')
      .insert({
        organization_id: organizationId,
        action: 'request_sent',
        actor_user_id: user.id,
        actor_email: user.email,
        recipient_email: organization.partners[0].primary_contact_email,
        metadata: {
          partner_name: organization.partners[0].name,
          organization_name: organization.name,
        }
      });

    if (historyError) {
      console.error('History insert error:', historyError);
      // 履歴の記録に失敗してもメール送信は続行
    }

    // 承認メールを送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const previewUrl = `${baseUrl}/dashboard/organizations/${organizationId}/preview`;

    await sendApprovalEmail({
      organizationId: organization.id,
      organizationName: organization.name,
      partnerEmail: organization.partners[0].primary_contact_email,
      partnerName: organization.partners[0].name,
      requesterEmail: user.email || '',
      previewUrl,
    });

    return NextResponse.json({
      success: true,
      message: '承認申請を送信しました',
      status: 'waiting_approval'
    });

  } catch (error) {
    console.error('Approval request error:', error);
    return NextResponse.json(
      { error: '承認申請の処理に失敗しました' },
      { status: 500 }
    );
  }
}