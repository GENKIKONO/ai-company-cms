import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QACategoryFormData } from '@/types/database';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
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

    const { data: category, error } = await supabase
      .from('qa_categories')
      .select('*')
      .eq('id', id)
      .or(`organization_id.eq.${userData.organization_id},visibility.eq.global`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      console.error('Error fetching category:', error);
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
    }

    return NextResponse.json({ data: category });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
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

    // Check if category exists and user has access
    const { data: existingCategory, error: fetchError } = await supabase
      .from('qa_categories')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .eq('visibility', 'org')
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
    }

    const body: QACategoryFormData = await req.json();
    
    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const updateData = {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      sort_order: body.sort_order ?? existingCategory.sort_order,
      is_active: body.is_active ?? existingCategory.is_active,
      updated_by: user.id
    };

    const { data: category, error } = await supabase
      .from('qa_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
      }
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    // Log the update
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        category_id: id,
        action: 'category_update',
        actor_user_id: user.id,
        changes: { 
          before: existingCategory, 
          after: updateData 
        },
        metadata: { ip: req.ip, user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: category });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
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

    // Check if category exists and user has access
    const { data: existingCategory, error: fetchError } = await supabase
      .from('qa_categories')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .eq('visibility', 'org')
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
    }

    // Check if category has associated Q&A entries
    const { data: entries, error: entriesError } = await supabase
      .from('qa_entries')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (entriesError) {
      console.error('Error checking entries:', entriesError);
      return NextResponse.json({ error: 'Failed to check category usage' }, { status: 500 });
    }

    if (entries && entries.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with associated Q&A entries' 
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('qa_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    // Log the deletion
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        category_id: id,
        action: 'category_delete',
        actor_user_id: user.id,
        changes: { deleted: existingCategory },
        metadata: { ip: req.ip, user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}