/**
 * Admin Alert Individual API
 * PATCH /api/admin/alerts/[id] - ステータス更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { handleApiError, handleDatabaseError, handleZodError, notFoundError } from '@/lib/api/error-responses';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateAlertSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved']),
});

// PATCH - アラートステータス更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validation = updateAlertSchema.safeParse(body);

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const { data: updatedAlert, error } = await supabase
      .from('alerts')
      .update({ status: validation.data.status })
      .eq('id', id)
      .select('*, alert_rules(name, severity)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Alert');
      }
      logger.error('[Alerts API] PATCH error', { error: error.message });
      return handleDatabaseError(error);
    }

    logger.info('[Alerts API] Alert status updated', {
      alert_id: id,
      new_status: validation.data.status,
      updated_by: authResult.userId
    });

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
      data: updatedAlert
    });

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in PATCH', {
      error: error instanceof Error ? error.message : String(error)
    });
    return handleApiError(error);
  }
}
