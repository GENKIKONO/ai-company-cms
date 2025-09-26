import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Normalize empty strings to null for optional fields
function normalizeCaseStudyData(data: any) {
  const normalized = { ...data };
  
  // Optional text fields that should be null if empty
  const optionalTextFields = [
    'client_type', 'client_name', 'problem', 'solution', 'outcome'
  ];
  
  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // Handle array fields
  if (normalized.metrics && Array.isArray(normalized.metrics)) {
    normalized.metrics = normalized.metrics.filter((m: any) => m && m.trim() !== '');
  }
  
  // Handle published_at date field
  if (normalized.published_at === '') {
    normalized.published_at = null;
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

    // Get case studies for this organization
    const { data: caseStudies, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch case studies', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: caseStudies || [] });

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
    if (!body.title) {
      return NextResponse.json(
        { error: 'Case study title is required' },
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
    const normalizedBody = normalizeCaseStudyData(body);

    const caseStudyData = {
      ...normalizedBody,
      org_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('case_studies')
      .insert([caseStudyData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create case study', message: error.message },
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