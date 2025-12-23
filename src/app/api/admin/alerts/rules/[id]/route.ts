/**
 * Admin Alert Rules Individual API
 * PATCH /api/admin/alerts/rules/[id] - ルール更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

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
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin権限チェック
    const { data: userProfile } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateRuleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
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
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }
      logger.error('[Alerts API] Rule PATCH error', { error: error.message });
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    logger.info('[Alerts API] Rule updated', {
      rule_id: id,
      updated_by: user.id,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
