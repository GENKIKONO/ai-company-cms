/**
 * Admin Alert Rules Individual API
 * PATCH /api/admin/alerts/rules/[id] - ルール更新
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

const updateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  channel: z.array(z.string()).optional(),
  condition: z.record(z.any()).optional(),
});

// PATCH - アラートルール更新
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
    const validation = updateRuleSchema.safeParse(body);

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRule, error } = await supabase
      .from('alert_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Alert rule');
      }
      logger.error('[Alerts API] Rule PATCH error', { error: error.message });
      return handleDatabaseError(error);
    }

    logger.info('[Alerts API] Rule updated', {
      rule_id: id,
      updated_by: authResult.userId,
      fields: Object.keys(validation.data)
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule updated successfully',
      data: updatedRule
    });

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in rule PATCH', {
      error: error instanceof Error ? error.message : String(error)
    });
    return handleApiError(error);
  }
}
