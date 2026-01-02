/**
 * Partners Individual API
 * GET /api/partners/[id] - 個別取得
 * PATCH /api/partners/[id] - 更新
 * DELETE /api/partners/[id] - 削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePartnerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  brand_logo_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  partnership_type: z.string().optional().nullable(),
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// GET - パートナー個別取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, name, description, website_url, logo_url, brand_logo_url, contact_email, partnership_type, contract_start_date, contract_end_date, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
      }
      logger.error('[Partners API] GET single error', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: partner
    });

  } catch (error) {
    logger.error('[Partners API] Unexpected error in GET single', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - パートナー更新
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
    const validation = updatePartnerSchema.safeParse(body);

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

    const { data: updatedPartner, error } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
      }
      logger.error('[Partners API] PATCH error', { error: error.message });
      return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
    }

    logger.info('[Partners API] Partner updated', {
      partner_id: id,
      updated_by: user.id,
      fields: Object.keys(validation.data)
    });

    return NextResponse.json({
      success: true,
      message: 'Partner updated successfully',
      data: updatedPartner
    });

  } catch (error) {
    logger.error('[Partners API] Unexpected error in PATCH', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - パートナー削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[Partners API] DELETE error', { error: error.message });
      return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
    }

    logger.info('[Partners API] Partner deleted', {
      partner_id: id,
      deleted_by: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully'
    });

  } catch (error) {
    logger.error('[Partners API] Unexpected error in DELETE', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
