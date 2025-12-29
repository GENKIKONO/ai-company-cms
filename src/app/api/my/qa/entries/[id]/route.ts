import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { QAEntryFormData } from '@/types/domain/qa-system';;
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
  try {
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      logger.error('[my/qa/entries/[id]] GET Unexpected org access validation error', { 
        userId: user.id, 
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    const { data: entry, error } = await supabase
      .from('qa_entries')
      .select(`
        *,
        qa_categories!left(id, name, slug)
      `)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      logger.error('Error fetching entry', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
    }

    return NextResponse.json({ data: entry });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
  try {
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      logger.error('[my/qa/entries/[id]] PUT Unexpected org access validation error', { 
        userId: user.id, 
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // Check if entry exists and user has access
    const { data: existingEntry, error: fetchError } = await supabase
      .from('qa_entries')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .maybeSingle();

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
        .or(`organization_id.eq.${organization.id},visibility.eq.global`)
        .maybeSingle();

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
      .maybeSingle();

    if (error) {
      logger.error('Error updating entry', { data: error instanceof Error ? error : new Error(String(error)) });
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
        organization_id: organization.id,
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
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
  try {
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      logger.error('[my/qa/entries/[id]] DELETE Unexpected org access validation error', { 
        userId: user.id, 
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // Check if entry exists and user has access
    const { data: existingEntry, error: fetchError } = await supabase
      .from('qa_entries')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('qa_entries')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting entry', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    // Log the deletion
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: organization.id,
        qa_entry_id: id,
        category_id: existingEntry.category_id,
        action: 'delete',
        actor_user_id: user.id,
        changes: { deleted: existingEntry },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}