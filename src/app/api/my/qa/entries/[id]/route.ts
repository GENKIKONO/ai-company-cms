import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { QAEntryFormData } from '@/types/database';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
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

    const { data: entry, error } = await supabase
      .from('qa_entries')
      .select(`
        *,
        qa_categories!left(id, name, slug)
      `)
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      console.error('Error fetching entry:', error);
      return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
    }

    return NextResponse.json({ data: entry });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
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

    // Check if entry exists and user has access
    const { data: existingEntry, error: fetchError } = await supabase
      .from('qa_entries')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
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

    const updateData: any = {
      category_id: body.category_id || null,
      question: body.question.trim(),
      answer: body.answer.trim(),
      tags: body.tags || [],
      visibility: body.visibility || existingEntry.visibility,
      status: body.status || existingEntry.status,
      last_edited_by: user.id,
      last_edited_at: new Date().toISOString()
    };

    // Update published_at if status changes to published
    if (updateData.status === 'published' && existingEntry.status !== 'published') {
      updateData.published_at = new Date().toISOString();
    } else if (updateData.status !== 'published') {
      updateData.published_at = null;
    }

    // Generate new content hash
    const contentString = `${updateData.question}|${updateData.answer}|${updateData.tags.join(',')}`;
    const contentHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(contentString)
    );
    const hashArray = Array.from(new Uint8Array(contentHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const finalUpdateData = {
      ...updateData,
      content_hash: hashHex
    };

    const { data: entry, error } = await supabase
      .from('qa_entries')
      .update(finalUpdateData)
      .eq('id', id)
      .select(`
        *,
        qa_categories!left(id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Error updating entry:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    // Log the update
    const logAction = existingEntry.status !== updateData.status ? 
      (updateData.status === 'published' ? 'publish' : 
       updateData.status === 'archived' ? 'archive' : 'unpublish') : 
      'update';

    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        qa_entry_id: id,
        category_id: entry.category_id,
        action: logAction,
        actor_user_id: user.id,
        changes: { 
          before: existingEntry, 
          after: finalUpdateData 
        },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: entry });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
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

    // Check if entry exists and user has access
    const { data: existingEntry, error: fetchError } = await supabase
      .from('qa_entries')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('qa_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    // Log the deletion
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: userData.organization_id,
        qa_entry_id: id,
        category_id: existingEntry.category_id,
        action: 'delete',
        actor_user_id: user.id,
        changes: { deleted: existingEntry },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}