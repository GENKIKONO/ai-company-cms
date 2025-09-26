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
    const postId = resolvedParams.id;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        status,
        published_at,
        created_at,
        updated_at,
        org_id,
        organization:organizations!org_id(
          id,
          name,
          slug
        ),
        author:app_users!created_by(
          id,
          name,
          email
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    const body = await request.json();

    // Remove system fields that shouldn't be updated directly
    const { id, org_id, created_at, created_by, ...rawUpdateData } = body;
    
    // Normalize data before saving
    const normalizedUpdateData = normalizePostData(rawUpdateData);
    normalizedUpdateData.updated_at = new Date().toISOString();
    
    // If status is being changed to 'published', set published_at
    if (normalizedUpdateData.status === 'published' && !normalizedUpdateData.published_at) {
      normalizedUpdateData.published_at = new Date().toISOString();
    }
    
    // If status is being changed from 'published' to 'draft', clear published_at
    if (normalizedUpdateData.status === 'draft') {
      normalizedUpdateData.published_at = null;
    }

    const updateData = normalizedUpdateData;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        id,
        title,
        body,
        status,
        published_at,
        created_at,
        updated_at,
        org_id,
        organization:organizations!org_id(
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update post', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    const supabase = supabaseAdmin();
    
    // First verify the post exists
    const { data: post, error: checkError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    if (checkError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete post', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}