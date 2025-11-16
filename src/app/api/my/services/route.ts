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

    // 組織のサービスを取得 - RLS compliance: organization ownership + created_by check
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('created_by', user.id)
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

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/services] POST Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get user organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      logger.debug('[my/services] POST No organization found for user');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prepare service data with RLS compliance
    const serviceData = {
      organization_id: organization.id,
      created_by: user.id, // Required for RLS policy
      name: body.name.trim(),
      summary: body.summary || null,
      description: body.description || null,
      price: body.price ? parseInt(body.price, 10) : null,
      duration_months: body.duration_months ? parseInt(body.duration_months, 10) : null,
      category: body.category || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/services] POST Failed to create service', { data: error });
      return NextResponse.json({ error: 'Failed to create service', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    logger.error('[POST /api/my/services] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
