import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Normalize empty strings to null for optional fields
function normalizeServiceData(data: any) {
  const normalized = { ...data };
  
  // Optional text fields that should be null if empty
  const optionalTextFields = [
    'summary', 'price', 'category', 'cta_url'
  ];
  
  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // Handle array fields
  if (normalized.features && Array.isArray(normalized.features)) {
    normalized.features = normalized.features.filter((f: any) => f && f.trim() !== '');
  }
  
  if (normalized.media && Array.isArray(normalized.media)) {
    normalized.media = normalized.media.filter((m: any) => m && m.trim() !== '');
  }
  
  return normalized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    // Verify organization exists and user has access
    const supabase = supabaseAdmin();
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get services for this organization
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: services || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      );
    }

    // Verify organization exists and user has access
    const supabase = supabaseAdmin();
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Normalize data before saving
    const normalizedBody = normalizeServiceData(body);

    const serviceData = {
      ...normalizedBody,
      org_id: organizationId,
      status: normalizedBody.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create service', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}