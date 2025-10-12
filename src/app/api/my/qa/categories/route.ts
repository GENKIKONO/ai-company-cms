import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QACategoryFormData } from '@/types/database';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const { data: categories, error } = await supabase
      .from('qa_categories')
      .select('*')
      .or(`organization_id.eq.${userData.organization_id},visibility.eq.global`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ data: categories });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const body: QACategoryFormData = await req.json();
    
    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const categoryData = {
      organization_id: userData.organization_id,
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      visibility: 'org' as const,
      sort_order: body.sort_order || 0,
      is_active: body.is_active ?? true,
      created_by: user.id,
      updated_by: user.id
    };

    const { data: category, error } = await supabase
      .from('qa_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
      }
      console.error('Error creating category:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    // Log the creation
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        category_id: category.id,
        action: 'category_create',
        actor_user_id: user.id,
        changes: { created: categoryData },
        metadata: { ip: req.ip, user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: category }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}