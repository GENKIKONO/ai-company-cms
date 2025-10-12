/**
 * 委任管理API - ヒアリング代行サービス用
 * 委任の作成・取得・取り消しを管理
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

// 委任作成スキーマ
const delegationCreateSchema = z.object({
  client_user_id: z.string().min(1, '依頼者IDは必須です'),
  organization_id: z.string().min(1, '組織IDは必須です'),
  scope: z.array(z.enum(['services', 'posts', 'faqs', 'case_studies', 'materials'])),
  expires_at: z.string().optional(),
  consent_text_version: z.string().min(1, '同意文バージョンは必須です'),
  client_ip: z.string().optional(),
  user_agent: z.string().optional()
});

// 委任取得 (GET)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const client_user_id = url.searchParams.get('client_user_id');
    const organization_id = url.searchParams.get('organization_id');
    const active_only = url.searchParams.get('active_only') === 'true';

    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!isAdmin(user) && user.id !== client_user_id) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const admin = createAdminClient();
    
    let query = admin
      .from('hearing_delegations')
      .select(`
        id,
        client_user_id,
        hearing_agent_id,
        organization_id,
        scope,
        status,
        expires_at,
        consent_text_version,
        consent_granted_at,
        consent_ip,
        revoked_at,
        revoked_reason,
        created_at,
        updated_at
      `);

    if (client_user_id) {
      query = query.eq('client_user_id', client_user_id);
    }
    
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    if (active_only) {
      query = query.eq('status', 'active');
    }

    const { data: delegations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Delegation fetch error:', error);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ delegations });

  } catch (error) {
    console.error('Delegation API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 委任作成 (POST)
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // リクエスト解析
    const rawBody = await request.json();
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let validatedData;
    try {
      validatedData = delegationCreateSchema.parse({
        ...rawBody,
        client_ip: clientIP,
        user_agent: userAgent
      });
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

    // 本人または管理者のみ委任作成可能
    if (user.id !== validatedData.client_user_id && !isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const admin = createAdminClient();

    // 既存の有効な委任をチェック
    const { data: existingDelegations } = await admin
      .from('hearing_delegations')
      .select('id')
      .eq('client_user_id', validatedData.client_user_id)
      .eq('organization_id', validatedData.organization_id)
      .eq('status', 'active');

    if (existingDelegations && existingDelegations.length > 0) {
      return NextResponse.json(
        { error: 'DELEGATION_EXISTS', message: 'この組織に対する有効な委任が既に存在します' },
        { status: 409 }
      );
    }

    // 委任作成
    const delegationData = {
      client_user_id: validatedData.client_user_id,
      hearing_agent_id: isAdmin(user) ? user.id : null, // 管理者が作成した場合のみ代行者を設定
      organization_id: validatedData.organization_id,
      scope: validatedData.scope,
      status: 'active',
      expires_at: validatedData.expires_at || null,
      consent_text_version: validatedData.consent_text_version,
      consent_granted_at: new Date().toISOString(),
      consent_ip: validatedData.client_ip,
      consent_user_agent: validatedData.user_agent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: delegation, error: createError } = await admin
      .from('hearing_delegations')
      .insert([delegationData])
      .select()
      .single();

    if (createError) {
      console.error('Delegation creation error:', createError);
      return NextResponse.json(
        { error: 'CREATE_FAILED', message: createError.message },
        { status: 500 }
      );
    }

    // 監査ログ記録
    await logDelegationAction(admin, {
      actor_id: user.id,
      action: 'delegation_created',
      target_delegation_id: delegation.id,
      client_user_id: validatedData.client_user_id,
      organization_id: validatedData.organization_id,
      scope: validatedData.scope,
      ip_address: clientIP,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: '委任が正常に作成されました',
      delegation
    });

  } catch (error) {
    console.error('Delegation creation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 委任取り消し (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const delegation_id = url.searchParams.get('delegation_id');
    const reason = url.searchParams.get('reason') || '取り消し要求';

    if (!delegation_id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: '委任IDは必須です' },
        { status: 400 }
      );
    }

    // 認証チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 委任取得
    const { data: delegation, error: fetchError } = await admin
      .from('hearing_delegations')
      .select('*')
      .eq('id', delegation_id)
      .single();

    if (fetchError || !delegation) {
      return NextResponse.json(
        { error: 'DELEGATION_NOT_FOUND', message: '委任が見つかりません' },
        { status: 404 }
      );
    }

    // 本人または管理者のみ取り消し可能
    if (user.id !== delegation.client_user_id && !isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // 委任取り消し
    const { error: updateError } = await admin
      .from('hearing_delegations')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
        revoked_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', delegation_id);

    if (updateError) {
      console.error('Delegation revocation error:', updateError);
      return NextResponse.json(
        { error: 'REVOKE_FAILED', message: updateError.message },
        { status: 500 }
      );
    }

    // 監査ログ記録
    await logDelegationAction(admin, {
      actor_id: user.id,
      action: 'delegation_revoked',
      target_delegation_id: delegation_id,
      client_user_id: delegation.client_user_id,
      organization_id: delegation.organization_id,
      revoke_reason: reason,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: '委任が正常に取り消されました'
    });

  } catch (error) {
    console.error('Delegation revocation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 監査ログ記録関数
async function logDelegationAction(admin: any, logData: any): Promise<void> {
  try {
    await admin
      .from('hearing_audit_logs')
      .insert([{
        actor_id: logData.actor_id,
        action: logData.action,
        target_type: 'delegation',
        target_id: logData.target_delegation_id,
        client_user_id: logData.client_user_id,
        organization_id: logData.organization_id,
        metadata: {
          scope: logData.scope,
          revoke_reason: logData.revoke_reason,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent
        },
        timestamp: logData.timestamp
      }]);
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}