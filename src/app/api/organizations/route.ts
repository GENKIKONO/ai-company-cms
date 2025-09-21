import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);
    const industry = searchParams.get('industry');
    const region = searchParams.get('region');
    const size = searchParams.get('size');
    const search = searchParams.get('q');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('visibility', 'public');

    // Apply filters
    if (industry) {
      const industries = industry.split(',');
      query = query.overlaps('industries', industries);
    }

    if (region) {
      const regions = region.split(',');
      query = query.in('address_region', regions);
    }

    if (size) {
      const sizes = size.split(',');
      query = query.in('size', sizes);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,keywords.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }

    // Track API usage
    trackEvent({
      name: 'API Organizations List',
      properties: {
        page,
        limit,
        total_results: count || 0,
        has_filters: !!(industry || region || size || search),
      },
    });

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (in a real app, this would come from JWT)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // For demo purposes, we'll use a placeholder user ID
    const userId = 'demo-user-id';

    const organizationData = {
      ...body,
      created_by: userId,
      visibility: body.visibility || 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create organization', message: error.message },
        { status: 500 }
      );
    }

    // Track creation
    trackEvent({
      name: 'API Organization Created',
      properties: {
        organization_id: data.id,
        organization_name: data.name,
        visibility: data.visibility,
      },
    });

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}