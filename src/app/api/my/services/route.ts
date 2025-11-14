export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/log';

// GET - ユーザーのサービスを取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/services] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      logger.debug('[my/services] No organization found for user');
      return NextResponse.json({ data: null, message: 'No organization found' }, { status: 200 });
    }

    // 組織のサービスを取得
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (servicesError) {
      logger.error('[my/services] Failed to fetch services', { data: servicesError });
      return NextResponse.json({ message: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ data: services || [] }, { status: 200 });

  } catch (error) {
    logger.error('[GET /api/my/services] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
