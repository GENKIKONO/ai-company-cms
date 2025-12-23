/**
 * Partners API
 * GET /api/partners - 一覧取得（検索、フィルタ、ページング、ソート）
 * POST /api/partners - 新規作成
 *
 * DB Schema (public.partners):
 * id uuid PK, name text NOT NULL, description text, website_url text,
 * logo_url text, brand_logo_url text, contact_email text,
 * partnership_type USER-DEFINED, contract_start_date date, contract_end_date date,
 * is_active boolean DEFAULT true, created_at timestamptz, updated_at timestamptz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Validation schemas
const createPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  website_url: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  brand_logo_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  partnership_type: z.string().optional().nullable(),
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

const updatePartnerSchema = createPartnerSchema.partial();

// GET - パートナー一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim();
    const isActive = url.searchParams.get('is_active');
    const partnershipTypes = url.searchParams.get('partnership_type')?.split(',').filter(Boolean);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const sortBy = url.searchParams.get('sort_by') || 'updated_at';
    const sortOrder = url.searchParams.get('sort_order') === 'asc' ? true : false;

    // Build query
    let query = supabase
      .from('partners')
      .select('*', { count: 'exact' });

    // Search filter (name ILIKE)
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // is_active filter
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    // partnership_type IN filter
    if (partnershipTypes && partnershipTypes.length > 0) {
      query = query.in('partnership_type', partnershipTypes);
    }

    // Sorting
    const validSortColumns = ['name', 'updated_at', 'created_at', 'contract_start_date'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'updated_at';
    query = query.order(sortColumn, { ascending: sortOrder });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: partners, error, count } = await query;

    if (error) {
      logger.error('[Partners API] Query error', { error: error.message });

      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { total: 0, limit, offset, has_more: false },
          message: 'Partners table not found'
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    logger.info('[Partners API] Partners list fetched', {
      user_id: user.id,
      count: partners?.length || 0,
      total
    });

    return NextResponse.json({
      success: true,
      data: partners || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: hasMore
      }
    });

  } catch (error) {
    logger.error('[Partners API] Unexpected error in GET', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - パートナー新規作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
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
    const validation = createPartnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const partnerData = {
      ...validation.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newPartner, error } = await supabase
      .from('partners')
      .insert(partnerData)
      .select()
      .single();

    if (error) {
      logger.error('[Partners API] Insert error', { error: error.message });

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Partner with this name already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create partner' },
        { status: 500 }
      );
    }

    logger.info('[Partners API] Partner created', {
      partner_id: newPartner.id,
      name: newPartner.name,
      created_by: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Partner created successfully',
      data: newPartner
    }, { status: 201 });

  } catch (error) {
    logger.error('[Partners API] Unexpected error in POST', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
