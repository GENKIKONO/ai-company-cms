/**
 * ヒアリング代行下書き作成API
 * 委任に基づく下書き作成・取得・更新（公開権限なし）
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getServerUser, isAdmin } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Admin Client
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 下書き作成スキーマ
const draftCreateSchema = z.object({
  delegation_id: z.string().min(1, '委任IDは必須です'),
  content_type: z.enum(['service', 'post', 'faq', 'case_study']),
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.object({
    // サービス用
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    duration: z.number().optional(),
    // 投稿用
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    // FAQ用
    question: z.string().optional(),
    answer: z.string().optional(),
    category: z.string().optional(),
    // ケーススタディ用
    client_name: z.string().optional(),
    challenge: z.string().optional(),
    solution: z.string().optional(),
    results: z.string().optional(),
    // 共通
    body: z.string().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional()
  }),
  metadata: z.object({
    hearing_notes: z.string().optional(),
    source_materials: z.array(z.string()).optional(),
    review_points: z.array(z.string()).optional()
  }).optional()
});

// 下書き取得 (GET)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const delegation_id = url.searchParams.get('delegation_id');
    const client_user_id = url.searchParams.get('client_user_id');
    const status = url.searchParams.get('status') || 'all';

    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 委任チェック（権限確認）
    if (delegation_id) {
      const { data: delegation, error: delegationError } = await admin
        .from('hearing_delegations')
        .select('*')
        .eq('id', delegation_id)
        .eq('status', 'active')
        .single();

      if (delegationError || !delegation) {
        return NextResponse.json(
          { error: 'DELEGATION_NOT_FOUND', message: '有効な委任が見つかりません' },
          { status: 404 }
        );
      }

      // 権限チェック：依頼者本人、代行者、または管理者のみ
      if (user.id !== delegation.client_user_id && 
          user.id !== delegation.hearing_agent_id && 
          !isAdmin(user)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

    // 下書き取得
    let query = admin
      .from('hearing_drafts')
      .select(`
        id,
        delegation_id,
        content_type,
        title,
        content,
        metadata,
        status,
        created_by,
        created_at,
        updated_at,
        submitted_at,
        approved_at,
        approved_by,
        rejected_at,
        rejected_reason
      `);

    if (delegation_id) {
      query = query.eq('delegation_id', delegation_id);
    }

    if (client_user_id && !delegation_id) {
      // クライアントの全ての下書きを取得（委任経由）
      const { data: delegations } = await admin
        .from('hearing_delegations')
        .select('id')
        .eq('client_user_id', client_user_id)
        .eq('status', 'active');

      if (delegations && delegations.length > 0) {
        const delegationIds = delegations.map(d => d.id);
        query = query.in('delegation_id', delegationIds);
      } else {
        return NextResponse.json({ drafts: [] });
      }
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: drafts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Drafts fetch error:', error);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ drafts });

  } catch (error) {
    console.error('Hearing drafts API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 下書き作成 (POST)
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // リクエスト解析
    const rawBody = await request.json();
    
    let validatedData;
    try {
      validatedData = draftCreateSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const admin = createAdminClient();

    // 委任チェック
    const { data: delegation, error: delegationError } = await admin
      .from('hearing_delegations')
      .select('*')
      .eq('id', validatedData.delegation_id)
      .eq('status', 'active')
      .single();

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'DELEGATION_NOT_FOUND', message: '有効な委任が見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック：代行者または管理者のみ下書き作成可能
    if (user.id !== delegation.hearing_agent_id && !isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // スコープチェック：委任範囲内かどうか
    const contentTypeMap: { [key: string]: string } = {
      'service': 'services',
      'post': 'posts',
      'faq': 'faqs',
      'case_study': 'case_studies'
    };

    const requiredScope = contentTypeMap[validatedData.content_type];
    if (!delegation.scope.includes(requiredScope)) {
      return NextResponse.json(
        { error: 'SCOPE_VIOLATION', message: `${validatedData.content_type}の作成は委任範囲外です` },
        { status: 403 }
      );
    }

    // 期限チェック
    if (delegation.expires_at && new Date(delegation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'DELEGATION_EXPIRED', message: '委任の有効期限が切れています' },
        { status: 403 }
      );
    }

    // 下書き作成
    const draftData = {
      delegation_id: validatedData.delegation_id,
      content_type: validatedData.content_type,
      title: validatedData.title,
      content: validatedData.content,
      metadata: {
        ...validatedData.metadata,
        hearing_agent_id: user.id,
        prepared_via: 'Hearing Service',
        created_ip: request.headers.get('x-forwarded-for') || 'unknown',
        created_user_agent: request.headers.get('user-agent') || 'unknown'
      },
      status: 'draft',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: draft, error: createError } = await admin
      .from('hearing_drafts')
      .insert([draftData])
      .select()
      .single();

    if (createError) {
      console.error('Draft creation error:', createError);
      return NextResponse.json(
        { error: 'CREATE_FAILED', message: createError.message },
        { status: 500 }
      );
    }

    // 監査ログ記録
    await logHearingAction(admin, {
      actor_id: user.id,
      action: 'draft_created',
      target_type: 'hearing_draft',
      target_id: draft.id,
      delegation_id: validatedData.delegation_id,
      client_user_id: delegation.client_user_id,
      organization_id: delegation.organization_id,
      content_type: validatedData.content_type,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: '下書きが正常に作成されました',
      draft
    });

  } catch (error) {
    console.error('Draft creation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 下書き更新 (PUT)
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const draft_id = url.searchParams.get('draft_id');

    if (!draft_id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: '下書きIDは必須です' },
        { status: 400 }
      );
    }

    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 下書き取得
    const { data: draft, error: fetchError } = await admin
      .from('hearing_drafts')
      .select('*, hearing_delegations(*)')
      .eq('id', draft_id)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: 'DRAFT_NOT_FOUND', message: '下書きが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック：作成者、依頼者、または管理者のみ更新可能
    const delegation = draft.hearing_delegations;
    if (user.id !== draft.created_by && 
        user.id !== delegation.client_user_id && 
        !isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // 承認済みの下書きは更新不可
    if (draft.status === 'approved') {
      return NextResponse.json(
        { error: 'ALREADY_APPROVED', message: '承認済みの下書きは更新できません' },
        { status: 409 }
      );
    }

    // 更新データ解析
    const rawBody = await request.json();
    const updateData = {
      title: rawBody.title || draft.title,
      content: { ...draft.content, ...rawBody.content },
      metadata: { ...draft.metadata, ...rawBody.metadata },
      updated_at: new Date().toISOString()
    };

    // 下書き更新
    const { data: updatedDraft, error: updateError } = await admin
      .from('hearing_drafts')
      .update(updateData)
      .eq('id', draft_id)
      .select()
      .single();

    if (updateError) {
      console.error('Draft update error:', updateError);
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: updateError.message },
        { status: 500 }
      );
    }

    // 監査ログ記録
    await logHearingAction(admin, {
      actor_id: user.id,
      action: 'draft_updated',
      target_type: 'hearing_draft',
      target_id: draft_id,
      delegation_id: delegation.id,
      client_user_id: delegation.client_user_id,
      organization_id: delegation.organization_id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: '下書きが正常に更新されました',
      draft: updatedDraft
    });

  } catch (error) {
    console.error('Draft update error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 監査ログ記録関数
async function logHearingAction(admin: any, logData: any): Promise<void> {
  try {
    await admin
      .from('hearing_audit_logs')
      .insert([{
        actor_id: logData.actor_id,
        action: logData.action,
        target_type: logData.target_type,
        target_id: logData.target_id,
        delegation_id: logData.delegation_id,
        client_user_id: logData.client_user_id,
        organization_id: logData.organization_id,
        metadata: {
          content_type: logData.content_type,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent
        },
        timestamp: logData.timestamp
      }]);
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}