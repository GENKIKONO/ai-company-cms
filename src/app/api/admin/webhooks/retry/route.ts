import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { webhookProcessor } from '@/lib/webhook-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || appUser?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // 失敗したWebhookイベントを再処理
    const result = await webhookProcessor.processFailedEvents();

    return NextResponse.json({
      success: true,
      message: `${result.processed}個のイベントを再処理しました`,
      processed: result.processed,
      failed: result.failed,
    });

  } catch (error) {
    console.error('Webhook retry error:', error);
    return NextResponse.json(
      { error: 'Webhook再処理に失敗しました' },
      { status: 500 }
    );
  }
}