import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QAEntryFormData } from '@/types/domain/qa-system';;
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    
    // organizationId 必須チェック
    if (!organizationId) {
      logger.debug('[my/qa/entries] organizationId parameter required');
      return NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 });
    }


    // validateOrgAccessでメンバーシップ確認
    try {
      await validateOrgAccess(organizationId, user.id, 'read');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // 対象テーブル単体＋organization_idフィルタで取得
    const { data: entries, error } = await supabase
      .from('qa_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_edited_at', { ascending: false });

    if (error) {
      console.error('[QA_ENTRIES_DEBUG] supabase error', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: 'Failed to fetch entries', 
        message: error.message,
        details: error.details 
      }, { status: 500 });
    }

    return NextResponse.json({ data: entries || [] });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
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

    const body: QAEntryFormData & { organizationId?: string } = await req.json();
    
    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/qa/entries] POST organizationId required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // validateOrgAccessでメンバーシップ確認
    try {
      await validateOrgAccess(body.organizationId, user.id, 'write');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }
    
    if (!body.question?.trim() || !body.answer?.trim()) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // QA entry data preparation (simplified to match FAQs pattern)
    const entryData = {
      organization_id: body.organizationId,
      created_by: user.id,
      category_id: body.category_id || null,
      question: body.question.trim(),
      answer: body.answer.trim(),
      tags: body.tags || [],
      visibility: body.visibility || 'public',
      status: body.status || 'draft',
      last_edited_by: user.id,
      published_at: body.status === 'published' ? new Date().toISOString() : null
    };

    const { data: entry, error } = await supabase
      .from('qa_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating entry', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    // Log the creation
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: body.organizationId,
        qa_entry_id: entry.id,
        category_id: entry.category_id,
        action: 'create',
        actor_user_id: user.id,
        changes: { created: entryData },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return NextResponse.json({ data: entry }, { status: 201 });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}