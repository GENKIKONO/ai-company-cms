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
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: organizationId, serviceId } = resolvedParams;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('org_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
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
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: organizationId, serviceId } = resolvedParams;
    const body = await request.json();

    // Remove system fields that shouldn't be updated directly
    const { id, org_id, created_at, ...rawUpdateData } = body;
    
    // Normalize data before saving
    const normalizedUpdateData = normalizeServiceData(rawUpdateData);
    normalizedUpdateData.updated_at = new Date().toISOString();
    
    const updateData = normalizedUpdateData;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('org_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update service', message: error.message },
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
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: organizationId, serviceId } = resolvedParams;

    const supabase = supabaseAdmin();
    
    // First verify the service exists and belongs to the organization
    const { data: service, error: checkError } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', serviceId)
      .eq('org_id', organizationId)
      .single();

    if (checkError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('org_id', organizationId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete service', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Service deleted successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}