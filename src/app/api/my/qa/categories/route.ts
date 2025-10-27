import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { QACategoryFormData } from '@/types/database';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const { data: categories, error } = await supabase
      .from('qa_categories')
      .select('*')
      .or(`organization_id.eq.${organization.id},visibility.eq.global`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('Error fetching categories', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ data: categories });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const body: QACategoryFormData = await req.json();
    
    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const categoryData = {
      organization_id: organization.id,
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
      logger.error('Error creating category', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    // Log the creation
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: organization.id,
        category_id: category.id,
        action: 'category_create',
        actor_user_id: user.id,
        changes: { created: categoryData },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: category }, { status: 201 });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}