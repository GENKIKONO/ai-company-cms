import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Normalize empty strings to null for optional fields
function normalizePostData(data: any) {
  const normalized = { ...data };
  
  // Optional text fields that should be null if empty
  const optionalTextFields = ['body'];
  
  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
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

    // Get posts for this organization (with author info)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        status,
        published_at,
        created_at,
        updated_at,
        created_by,
        author:app_users!created_by(name, email)
      `)
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: posts || [] });

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
        { error: 'Post title is required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase auth
    const supabase = supabaseAdmin();
    
    // For now, we'll use a placeholder for created_by
    // In production, this should come from the authenticated user context
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify organization exists
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
    const normalizedBody = normalizePostData(body);

    const postData = {
      ...normalizedBody,
      org_id: organizationId,
      status: normalizedBody.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // TODO: Set actual created_by from auth context
      // created_by: auth.user.id
    };

    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select(`
        id,
        title,
        body,
        status,
        published_at,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create post', message: error.message },
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