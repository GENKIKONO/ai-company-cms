import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QAEntryFormData } from '@/types/database';

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('qa_entries')
      .select(`
        *,
        qa_categories!left(id, name, slug)
      `, { count: 'exact' })
      .eq('organization_id', userData.organization_id);

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search && search.trim()) {
      query = query.textSearch('search_vector', search.trim());
    }

    const { data: entries, error, count } = await query
      .order('last_edited_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching entries:', error);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: entries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

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

    const body: QAEntryFormData = await req.json();
    
    if (!body.question?.trim() || !body.answer?.trim()) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Validate category if provided
    if (body.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('qa_categories')
        .select('id')
        .eq('id', body.category_id)
        .or(`organization_id.eq.${userData.organization_id},visibility.eq.global`)
        .single();

      if (categoryError || !category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const entryData = {
      organization_id: userData.organization_id,
      category_id: body.category_id || null,
      question: body.question.trim(),
      answer: body.answer.trim(),
      tags: body.tags || [],
      visibility: body.visibility || 'public',
      status: body.status || 'draft',
      last_edited_by: user.id,
      published_at: body.status === 'published' ? new Date().toISOString() : null
    };

    // Generate content hash
    const contentString = `${entryData.question}|${entryData.answer}|${entryData.tags.join(',')}`;
    const contentHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(contentString)
    );
    const hashArray = Array.from(new Uint8Array(contentHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const finalEntryData = {
      ...entryData,
      content_hash: hashHex
    };

    const { data: entry, error } = await supabase
      .from('qa_entries')
      .insert(finalEntryData)
      .select(`
        *,
        qa_categories!left(id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Error creating entry:', error);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    // Log the creation
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        qa_entry_id: entry.id,
        category_id: entry.category_id,
        action: 'create',
        actor_user_id: user.id,
        changes: { created: finalEntryData },
        metadata: { ip: req.ip, user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: entry }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}