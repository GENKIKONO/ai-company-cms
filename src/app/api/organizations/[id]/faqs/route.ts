import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Normalize empty strings to null for optional fields
function normalizeFaqData(data: any) {
  const normalized = { ...data };
  
  // Optional text fields that should be null if empty
  const optionalTextFields = ['question', 'answer'];
  
  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // Ensure order is a number
  if (normalized.order_index !== undefined) {
    normalized.order_index = parseInt(normalized.order_index) || 0;
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

    // Get FAQs for this organization
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('org_id', organizationId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch FAQs', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: faqs || [] });

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
    if (!body.question || !body.answer) {
      return NextResponse.json(
        { error: 'Both question and answer are required' },
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

    // Get the next order index if not provided
    let orderIndex = body.order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const { data: lastFaq } = await supabase
        .from('faqs')
        .select('order_index')
        .eq('org_id', organizationId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();
      
      orderIndex = (lastFaq?.order_index || 0) + 1;
    }

    // Normalize data before saving
    const normalizedBody = normalizeFaqData(body);

    const faqData = {
      ...normalizedBody,
      org_id: organizationId,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('faqs')
      .insert([faqData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create FAQ', message: error.message },
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