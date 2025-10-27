import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  
  try {
    const { searchParams } = new URL(req.url);
    const org_slug = searchParams.get('org_slug');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');

    if (!org_slug) {
      return NextResponse.json({ error: 'Organization slug is required' }, { status: 400 });
    }

    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', org_slug)
      .eq('is_published', true)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let query = supabase
      .from('qa_entries')
      .select(`
        id,
        question,
        answer,
        tags,
        published_at,
        qa_categories!left(id, name, slug)
      `)
      .eq('organization_id', organization.id)
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search && search.trim()) {
      query = query.textSearch('search_vector', search.trim());
    }

    const { data: entries, error } = await query
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching public entries', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    // Get available categories for this organization
    const { data: categories, error: catError } = await supabase
      .from('qa_categories')
      .select('id, name, slug, description')
      .or(`organization_id.eq.${organization.id},visibility.eq.global`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catError) {
      logger.error('Error fetching categories:', catError);
    }

    return NextResponse.json({
      data: entries || [],
      categories: categories || [],
      organization_slug: org_slug
    });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}