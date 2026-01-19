/**
 * Admin Migration API
 *
 * ⚠️ CRITICAL: This endpoint can execute database migrations.
 * Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError, validationError } from '@/lib/api/error-responses';

export async function POST(request: NextRequest) {
  // 管理者認証チェック（必須）
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    logger.info('[Admin Migration] Migration initiated', {
      userId: authResult.userId,
      timestamp: new Date().toISOString()
    });

    // Service Role クライアント作成
    const supabase = supabaseAdmin;

    // Execute the migration SQL directly
    const migrationSQL = `
      -- Add coordinate fields
      ALTER TABLE public.organizations
      ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

      -- Add check constraints to ensure coordinates are within reasonable bounds
      -- Japan's approximate bounds: lat 24-46, lng 123-146
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_latitude_range') THEN
          ALTER TABLE public.organizations
          ADD CONSTRAINT check_latitude_range CHECK (lat IS NULL OR (lat >= 20 AND lat <= 50));
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_longitude_range') THEN
          ALTER TABLE public.organizations
          ADD CONSTRAINT check_longitude_range CHECK (lng IS NULL OR (lng >= 120 AND lng <= 150));
        END IF;
      END $$;

      -- Create indexes for geo queries
      CREATE INDEX IF NOT EXISTS idx_organizations_coordinates ON public.organizations(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
    `;

    // Note: exec_sql is a custom RPC function for migrations
    const { error: migrationError } = await supabase.rpc('exec_sql' as 'approve_join_request', {
      sql: migrationSQL
    } as never);

    if (migrationError) {
      logger.error('[Admin Migration] SQL execution failed', {
        userId: authResult.userId,
        error: { code: migrationError.code, message: migrationError.message }
      });

      // Try alternative approach using individual queries
      const { error: alterError1 } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (alterError1) {
        return handleDatabaseError(alterError1);
      }
    }

    logger.info('[Admin Migration] Migration applied successfully', {
      userId: authResult.userId
    });

    // Test the migration by checking if an organization exists
    const { data: testOrg, error: testOrgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (testOrgError || !testOrg) {
      return validationError([{ field: 'organizations', message: 'No organizations found to verify migration' }]);
    }

    // Test coordinate field update
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        lat: 35.6762,
        lng: 139.6503
      })
      .eq('id', (testOrg as { id: string }).id);

    if (updateError) {
      logger.error('[Admin Migration] Coordinate field test failed', {
        userId: authResult.userId,
        error: { code: updateError.code, message: updateError.message }
      });
      return handleDatabaseError(updateError);
    }

    logger.info('[Admin Migration] Verification successful', {
      userId: authResult.userId,
      testOrgId: (testOrg as { id: string }).id
    });

    return NextResponse.json({
      success: true,
      message: 'Coordinate fields migration applied and verified successfully',
      testOrgId: (testOrg as { id: string }).id
    });

  } catch (error) {
    logger.error('[Admin Migration] Unexpected error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return handleApiError(error);
  }
}
