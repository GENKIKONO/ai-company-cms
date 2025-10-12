/**
 * ヒアリング代行承認フローAPI
 * 下書きの提出・承認・却下・公開を管理
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

// 承認アクションスキーマ
const approvalActionSchema = z.object({
  draft_id: z.string().min(1, '下書きIDは必須です'),
  action: z.enum(['submit', 'approve', 'reject', 'publish']),
  reason: z.string().optional(),
  feedback: z.string().optional(),
  changes_requested: z.array(z.string()).optional()
});

// 承認フロー処理 (POST)
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
      validatedData = approvalActionSchema.parse(rawBody);
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

    // 下書き取得（委任情報含む）
    const { data: draft, error: fetchError } = await admin
      .from('hearing_drafts')
      .select(`
        *,
        hearing_delegations (
          id,
          client_user_id,
          hearing_agent_id,
          organization_id,
          scope,
          status
        )
      `)
      .eq('id', validatedData.draft_id)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: 'DRAFT_NOT_FOUND', message: '下書きが見つかりません' },
        { status: 404 }
      );
    }

    const delegation = draft.hearing_delegations;

    // アクション別の権限チェックと処理
    switch (validatedData.action) {
      case 'submit':
        return await handleSubmit(admin, user, draft, delegation, validatedData, request);
      case 'approve':
        return await handleApprove(admin, user, draft, delegation, validatedData, request);
      case 'reject':
        return await handleReject(admin, user, draft, delegation, validatedData, request);
      case 'publish':
        return await handlePublish(admin, user, draft, delegation, validatedData, request);
      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: '無効なアクションです' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Approval flow error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 提出処理（代行者 → 依頼者）
async function handleSubmit(admin: any, user: any, draft: any, delegation: any, data: any, request: NextRequest) {
  // 代行者または管理者のみ提出可能
  if (user.id !== delegation.hearing_agent_id && !isAdmin(user)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // ステータスチェック
  if (draft.status !== 'draft') {
    return NextResponse.json(
      { error: 'INVALID_STATUS', message: '下書きステータスでのみ提出可能です' },
      { status: 409 }
    );
  }

  // 下書きを提出済みに更新
  const { data: updatedDraft, error: updateError } = await admin
    .from('hearing_drafts')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.draft_id)
    .select()
    .single();

  if (updateError) {
    console.error('Submit error:', updateError);
    return NextResponse.json(
      { error: 'SUBMIT_FAILED', message: updateError.message },
      { status: 500 }
    );
  }

  // 依頼者に通知を送信
  await sendApprovalNotification(admin, {
    client_user_id: delegation.client_user_id,
    draft_id: data.draft_id,
    action: 'approval_required',
    title: draft.title,
    content_type: draft.content_type,
    hearing_agent_id: delegation.hearing_agent_id
  });

  // 監査ログ記録
  await logHearingAction(admin, {
    actor_id: user.id,
    action: 'draft_submitted',
    target_type: 'hearing_draft',
    target_id: data.draft_id,
    delegation_id: delegation.id,
    client_user_id: delegation.client_user_id,
    organization_id: delegation.organization_id,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    message: '下書きが承認待ちとして提出されました',
    draft: updatedDraft
  });
}

// 承認処理（依頼者のみ）
async function handleApprove(admin: any, user: any, draft: any, delegation: any, data: any, request: NextRequest) {
  // 依頼者のみ承認可能
  if (user.id !== delegation.client_user_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // ステータスチェック
  if (draft.status !== 'submitted') {
    return NextResponse.json(
      { error: 'INVALID_STATUS', message: '提出済みの下書きのみ承認可能です' },
      { status: 409 }
    );
  }

  // 下書きを承認済みに更新
  const { data: updatedDraft, error: updateError } = await admin
    .from('hearing_drafts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.draft_id)
    .select()
    .single();

  if (updateError) {
    console.error('Approval error:', updateError);
    return NextResponse.json(
      { error: 'APPROVAL_FAILED', message: updateError.message },
      { status: 500 }
    );
  }

  // 代行者に通知
  await sendApprovalNotification(admin, {
    client_user_id: delegation.hearing_agent_id,
    draft_id: data.draft_id,
    action: 'draft_approved',
    title: draft.title,
    content_type: draft.content_type,
    approver_id: user.id
  });

  // 監査ログ記録
  await logHearingAction(admin, {
    actor_id: user.id,
    action: 'draft_approved',
    target_type: 'hearing_draft',
    target_id: data.draft_id,
    delegation_id: delegation.id,
    client_user_id: delegation.client_user_id,
    organization_id: delegation.organization_id,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    message: '下書きが承認されました。公開の準備が整いました。',
    draft: updatedDraft
  });
}

// 却下処理（依頼者のみ）
async function handleReject(admin: any, user: any, draft: any, delegation: any, data: any, request: NextRequest) {
  // 依頼者のみ却下可能
  if (user.id !== delegation.client_user_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // ステータスチェック
  if (draft.status !== 'submitted') {
    return NextResponse.json(
      { error: 'INVALID_STATUS', message: '提出済みの下書きのみ却下可能です' },
      { status: 409 }
    );
  }

  // 下書きを却下済みに更新
  const { data: updatedDraft, error: updateError } = await admin
    .from('hearing_drafts')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejected_reason: data.reason || '修正が必要です',
      rejected_feedback: data.feedback,
      changes_requested: data.changes_requested || [],
      updated_at: new Date().toISOString()
    })
    .eq('id', data.draft_id)
    .select()
    .single();

  if (updateError) {
    console.error('Rejection error:', updateError);
    return NextResponse.json(
      { error: 'REJECTION_FAILED', message: updateError.message },
      { status: 500 }
    );
  }

  // 代行者に通知
  await sendApprovalNotification(admin, {
    client_user_id: delegation.hearing_agent_id,
    draft_id: data.draft_id,
    action: 'draft_rejected',
    title: draft.title,
    content_type: draft.content_type,
    reason: data.reason,
    feedback: data.feedback,
    changes_requested: data.changes_requested
  });

  // 監査ログ記録
  await logHearingAction(admin, {
    actor_id: user.id,
    action: 'draft_rejected',
    target_type: 'hearing_draft',
    target_id: data.draft_id,
    delegation_id: delegation.id,
    client_user_id: delegation.client_user_id,
    organization_id: delegation.organization_id,
    metadata: {
      reason: data.reason,
      feedback: data.feedback,
      changes_requested: data.changes_requested
    },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    message: '下書きが却下されました。修正依頼が送信されました。',
    draft: updatedDraft
  });
}

// 公開処理（依頼者のみ）
async function handlePublish(admin: any, user: any, draft: any, delegation: any, data: any, request: NextRequest) {
  // 依頼者のみ公開可能
  if (user.id !== delegation.client_user_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // ステータスチェック
  if (draft.status !== 'approved') {
    return NextResponse.json(
      { error: 'INVALID_STATUS', message: '承認済みの下書きのみ公開可能です' },
      { status: 409 }
    );
  }

  // 実際のコンテンツテーブルにデータを挿入
  const publishResult = await publishDraftToProduction(admin, draft, delegation);
  
  if (!publishResult.success) {
    return NextResponse.json(
      { error: 'PUBLISH_FAILED', message: publishResult.error },
      { status: 500 }
    );
  }

  // 下書きを公開済みに更新
  const { data: updatedDraft, error: updateError } = await admin
    .from('hearing_drafts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: user.id,
      published_content_id: publishResult.contentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.draft_id)
    .select()
    .single();

  if (updateError) {
    console.error('Publish update error:', updateError);
  }

  // 監査ログ記録
  await logHearingAction(admin, {
    actor_id: user.id,
    action: 'draft_published',
    target_type: 'hearing_draft',
    target_id: data.draft_id,
    delegation_id: delegation.id,
    client_user_id: delegation.client_user_id,
    organization_id: delegation.organization_id,
    metadata: {
      published_content_id: publishResult.contentId,
      content_type: draft.content_type
    },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    message: '下書きが正常に公開されました',
    draft: updatedDraft,
    published_content_id: publishResult.contentId
  });
}

// 下書きを本番環境に公開
async function publishDraftToProduction(admin: any, draft: any, delegation: any) {
  try {
    const content = draft.content;
    const timestamp = new Date().toISOString();
    
    // コンテンツタイプ別の公開処理
    switch (draft.content_type) {
      case 'service': {
        const { data, error } = await admin
          .from('services')
          .insert([{
            organization_id: delegation.organization_id,
            name: content.name || draft.title,
            description: content.description || content.body,
            price: content.price,
            duration: content.duration,
            status: 'published',
            is_published: true,
            hearing_draft_source: draft.id,
            created_at: timestamp,
            updated_at: timestamp
          }])
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, contentId: data.id };
      }
      
      case 'post': {
        const { data, error } = await admin
          .from('posts')
          .insert([{
            organization_id: delegation.organization_id,
            title: draft.title,
            slug: content.slug,
            content: content.body,
            excerpt: content.excerpt,
            status: 'published',
            is_published: true,
            hearing_draft_source: draft.id,
            created_at: timestamp,
            updated_at: timestamp
          }])
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, contentId: data.id };
      }
      
      case 'faq': {
        const { data, error } = await admin
          .from('faqs')
          .insert([{
            organization_id: delegation.organization_id,
            question: content.question || draft.title,
            answer: content.answer || content.body,
            category: content.category,
            status: 'published',
            is_published: true,
            hearing_draft_source: draft.id,
            created_at: timestamp,
            updated_at: timestamp
          }])
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, contentId: data.id };
      }
      
      case 'case_study': {
        const { data, error } = await admin
          .from('case_studies')
          .insert([{
            organization_id: delegation.organization_id,
            title: draft.title,
            client_name: content.client_name,
            challenge: content.challenge,
            solution: content.solution,
            results: content.results,
            status: 'published',
            is_published: true,
            hearing_draft_source: draft.id,
            created_at: timestamp,
            updated_at: timestamp
          }])
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, contentId: data.id };
      }
      
      default:
        throw new Error(`Unsupported content type: ${draft.content_type}`);
    }
  } catch (error) {
    console.error('Publish to production error:', error);
    return { success: false, error: error.message };
  }
}

// 通知送信関数
async function sendApprovalNotification(admin: any, notificationData: any): Promise<void> {
  try {
    await admin
      .from('hearing_notifications')
      .insert([{
        user_id: notificationData.client_user_id,
        type: notificationData.action,
        title: `下書き${notificationData.action === 'approval_required' ? '承認依頼' : '処理完了'}`,
        message: `${notificationData.title} (${notificationData.content_type})`,
        metadata: {
          draft_id: notificationData.draft_id,
          content_type: notificationData.content_type,
          hearing_agent_id: notificationData.hearing_agent_id,
          reason: notificationData.reason,
          feedback: notificationData.feedback,
          changes_requested: notificationData.changes_requested
        },
        read: false,
        created_at: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('Notification send failed:', error);
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
          ...logData.metadata,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent
        },
        timestamp: logData.timestamp
      }]);
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}