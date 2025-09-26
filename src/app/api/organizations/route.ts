import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserAdmin } from '@/lib/supabase-server';

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

    const supabase = supabaseBrowserAdmin();
    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

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

// Normalize empty strings to null for DATE and optional text fields
function normalizeOrganizationData(data: any) {
  const normalized = { ...data };
  
  // DATE type fields - convert empty string to null
  const dateFields = ['founded', 'established_at'];
  
  // Optional text fields that should be null if empty
  const optionalTextFields = [
    'postal_code', 'street_address', 'description', 'keywords',
    'address_locality', 'address_region', 'address_country',
    'address_postal_code', 'telephone', 'email', 'url'
  ];
  
  // Normalize date fields
  dateFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  return normalized;
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

    // Normalize data before saving to prevent DATE type errors
    const normalizedBody = normalizeOrganizationData(body);

    const organizationData = {
      ...normalizedBody,
      created_by: userId,
      status: normalizedBody.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = supabaseBrowserAdmin();
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

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}