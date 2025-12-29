/**
 * Admin Alert Individual API
 * PATCH /api/admin/alerts/[id] - ステータス更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateAlertSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved']),
});

// PATCH - アラートステータス更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const user = await getUserWithClient(supabase);
    if (!user) {
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
    const validation = updateAlertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data: updatedAlert, error } = await supabase
      .from('alerts')
      .update({ status: validation.data.status })
      .eq('id', id)
      .select('*, alert_rules(name, severity)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }
      logger.error('[Alerts API] PATCH error', { error: error.message });
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    logger.info('[Alerts API] Alert status updated', {
      alert_id: id,
      new_status: validation.data.status,
      updated_by: user.id
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
