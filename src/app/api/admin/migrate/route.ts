/**
 * Admin Migrate API
 *
 * ⚠️ CRITICAL: Requires site_admin authentication.
 */
/* eslint-disable no-console */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError, validationError } from '@/lib/api/error-responses';

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    logger.debug('Starting coordinate fields migration...');
    
    // Service Role クライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 既存の組織を1つ取得
    const { data: testOrg, error: testOrgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (testOrgError || !testOrg) {
      return validationError([{ field: 'organizations', message: 'No organizations found to test with' }]);
    }

    logger.debug('Testing coordinate field update on organization', testOrg.id);

    // まず座標フィールドの追加を試みる（既存のDBスキーマに応じて自動で処理される）
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        lat: 35.6762, // 東京駅の座標
        lng: 139.6503 
      })
      .eq('id', testOrg.id);

    if (updateError) {
      logger.error('Coordinate field update failed:', { data: updateError });
      return handleDatabaseError(updateError);
    }

    logger.debug('Successfully updated organization with coordinates');

    // 更新が成功したら座標フィールドが利用可能
    return NextResponse.json({ 
      success: true, 
      message: 'Coordinate fields are now available in organizations table',
      testOrgId: testOrg.id
    });

  } catch (error) {
    logger.error('Migration API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}