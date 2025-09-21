import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }

    // Check if organization is public or user has access
    if (data.visibility !== 'public') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'This organization is private' },
          { status: 401 }
        );
      }
    }

    // Track API usage
    trackEvent({
      name: 'API Organization Retrieved',
      properties: {
        organization_id: data.id,
        organization_name: data.name,
        visibility: data.visibility,
      },
    });

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
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Remove system fields that shouldn't be updated directly
    const { id, created_at, created_by, ...updateData } = body;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update organization', message: error.message },
        { status: 500 }
      );
    }

    // Track update
    trackEvent({
      name: 'API Organization Updated',
      properties: {
        organization_id: data.id,
        organization_name: data.name,
        fields_updated: Object.keys(updateData).length,
      },
    });

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
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // First, get the organization to track the deletion
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete organization', message: error.message },
        { status: 500 }
      );
    }

    // Track deletion
    if (org) {
      trackEvent({
        name: 'API Organization Deleted',
        properties: {
          organization_id: org.id,
          organization_name: org.name,
        },
      });
    }

    return NextResponse.json({ 
      message: 'Organization deleted successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}