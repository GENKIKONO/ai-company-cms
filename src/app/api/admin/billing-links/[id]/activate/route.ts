import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { requireAdminPermission } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await requireAdminPermission();

    const supabase = await createClient();
    const resolvedParams = await params;
    const linkId = resolvedParams.id;

    // 対象リンクの情報を取得
    const { data: targetLink, error: fetchError } = await supabase
      .from('billing_checkout_links')
      .select('plan_type, campaign_type')
      .eq('id', linkId)
      .maybeSingle();

    if (fetchError || !targetLink) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // トランザクション的に処理：同じplan_type + campaign_typeの他のリンクを非アクティブ化
    const { error: deactivateError } = await (supabase
      .from('billing_checkout_links') as any)
      .update({ is_active: false })
      .eq('plan_type', (targetLink as { plan_type: string }).plan_type)
      .eq('campaign_type', (targetLink as { campaign_type: string }).campaign_type);

    if (deactivateError) {
      logger.error('Failed to deactivate existing links', { data: deactivateError instanceof Error ? deactivateError : new Error(String(deactivateError)) });
      return NextResponse.json(
        { error: 'Failed to update links' },
        { status: 500 }
      );
    }

    // 対象リンクをアクティブ化
    const { data, error: activateError } = await (supabase
      .from('billing_checkout_links') as any)
      .update({ is_active: true })
      .eq('id', linkId)
      .select()
      .maybeSingle();

    if (activateError) {
      logger.error('Failed to activate target link', { data: activateError instanceof Error ? activateError : new Error(String(activateError)) });
      return NextResponse.json(
        { error: 'Failed to activate link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data,
      message: `Link activated for ${(targetLink as { plan_type: string }).plan_type} ${(targetLink as { campaign_type: string }).campaign_type}`
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message === 'Admin permission required') {
        return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
      }
    }

    logger.error('PUT /api/admin/billing-links/[id]/activate error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}