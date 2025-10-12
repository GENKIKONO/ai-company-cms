/**
 * ヒアリング代行サービス監査ログAPI
 * 不変監査ログの記録・検索・出力
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

// 監査ログ検索スキーマ
const auditSearchSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  actor_id: z.string().optional(),
  action: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
  client_user_id: z.string().optional(),
  organization_id: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50)
});

// 監査ログ取得 (GET)
export async function GET(request: NextRequest) {
  try {
    // 認証・権限チェック
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 管理者のみアクセス可能（レビューワー機能は別途実装）
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    // パラメータ検証
    let validatedParams;
    try {
      validatedParams = auditSearchSchema.parse({
        ...searchParams,
        page: searchParams.page ? parseInt(searchParams.page) : 1,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50
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

    const admin = createAdminClient();

    // クエリ構築
    let query = admin
      .from('hearing_audit_logs')
      .select(`
        id,
        actor_id,
        action,
        target_type,
        target_id,
        delegation_id,
        client_user_id,
        organization_id,
        metadata,
        risk_level,
        timestamp,
        created_at
      `, { count: 'exact' });

    // フィルタ適用
    if (validatedParams.start_date) {
      query = query.gte('timestamp', validatedParams.start_date);
    }
    
    if (validatedParams.end_date) {
      query = query.lte('timestamp', validatedParams.end_date);
    }
    
    if (validatedParams.actor_id) {
      query = query.eq('actor_id', validatedParams.actor_id);
    }
    
    if (validatedParams.action) {
      query = query.eq('action', validatedParams.action);
    }
    
    if (validatedParams.target_type) {
      query = query.eq('target_type', validatedParams.target_type);
    }
    
    if (validatedParams.target_id) {
      query = query.eq('target_id', validatedParams.target_id);
    }
    
    if (validatedParams.client_user_id) {
      query = query.eq('client_user_id', validatedParams.client_user_id);
    }
    
    if (validatedParams.organization_id) {
      query = query.eq('organization_id', validatedParams.organization_id);
    }
    
    if (validatedParams.risk_level) {
      query = query.eq('risk_level', validatedParams.risk_level);
    }

    // ページネーション
    const offset = (validatedParams.page - 1) * validatedParams.limit;
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + validatedParams.limit - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Audit logs fetch error:', error);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: error.message },
        { status: 500 }
      );
    }

    // ユーザー情報を併せて取得
    const userIds = [...new Set(logs?.map(log => log.actor_id).filter(Boolean))];
    const userInfoPromises = userIds.map(async (userId) => {
      try {
        const { data: user } = await admin.auth.admin.getUserById(userId);
        return { id: userId, email: user?.user?.email || 'Unknown' };
      } catch {
        return { id: userId, email: 'Unknown' };
      }
    });

    const userInfo = await Promise.all(userInfoPromises);
    const userMap = Object.fromEntries(userInfo.map(u => [u.id, u.email]));

    // レスポンス整形
    const enrichedLogs = logs?.map(log => ({
      ...log,
      actor_email: userMap[log.actor_id] || 'Unknown'
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedParams.limit)
      }
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 監査ログ詳細取得
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'export') {
      return await handleExport(request);
    } else if (action === 'integrity_check') {
      return await handleIntegrityCheck(request);
    }

    return NextResponse.json(
      { error: 'INVALID_ACTION', message: '無効なアクションです' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Audit logs POST error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}

// 監査ログエクスポート
async function handleExport(request: NextRequest): Promise<NextResponse> {
  // 認証・権限チェック
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json();
  const { format = 'json', filters = {} } = body;

  const admin = createAdminClient();

  // フィルタに基づいてログを取得
  let query = admin
    .from('hearing_audit_logs')
    .select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query = query.eq(key, value);
    }
  });

  const { data: logs, error } = await query
    .order('timestamp', { ascending: false })
    .limit(10000); // 最大10,000件

  if (error) {
    return NextResponse.json(
      { error: 'EXPORT_FAILED', message: error.message },
      { status: 500 }
    );
  }

  // エクスポートログ記録
  await admin
    .from('hearing_audit_logs')
    .insert([{
      actor_id: user.id,
      action: 'audit_export',
      target_type: 'audit_logs',
      metadata: {
        export_format: format,
        export_count: logs?.length || 0,
        filters,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      },
      risk_level: 'medium',
      timestamp: new Date().toISOString()
    }]);

  // フォーマット別出力
  if (format === 'csv') {
    const csv = convertToCSV(logs || []);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } else {
    return NextResponse.json({
      logs: logs || [],
      exported_at: new Date().toISOString(),
      exported_by: user.email
    });
  }
}

// 監査ログ整合性チェック
async function handleIntegrityCheck(request: NextRequest): Promise<NextResponse> {
  // 認証・権限チェック
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    // 直近24時間のログを検証
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: logs, error } = await admin
      .from('hearing_audit_logs')
      .select('id, actor_id, action, timestamp, metadata')
      .gte('timestamp', yesterday)
      .order('timestamp', { ascending: true });

    if (error) {
      throw error;
    }

    // 整合性チェック実行
    const checks = {
      total_logs: logs?.length || 0,
      time_gaps: checkTimeGaps(logs || []),
      missing_actors: checkMissingActors(logs || []),
      suspicious_patterns: checkSuspiciousPatterns(logs || []),
      orphaned_references: await checkOrphanedReferences(admin, logs || [])
    };

    const integrityScore = calculateIntegrityScore(checks);

    // チェックログ記録
    await admin
      .from('hearing_audit_logs')
      .insert([{
        actor_id: user.id,
        action: 'integrity_check',
        target_type: 'audit_logs',
        metadata: {
          checks,
          integrity_score: integrityScore,
          check_period: `${yesterday} to ${new Date().toISOString()}`,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        },
        risk_level: integrityScore < 0.8 ? 'high' : 'low',
        timestamp: new Date().toISOString()
      }]);

    return NextResponse.json({
      integrity_score: integrityScore,
      checks,
      status: integrityScore >= 0.9 ? 'excellent' : 
             integrityScore >= 0.8 ? 'good' : 
             integrityScore >= 0.6 ? 'warning' : 'critical',
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Integrity check error:', error);
    return NextResponse.json(
      { error: 'CHECK_FAILED', message: '整合性チェックに失敗しました' },
      { status: 500 }
    );
  }
}

// CSVコンバーター
function convertToCSV(logs: any[]): string {
  if (logs.length === 0) return '';

  const headers = ['ID', 'Actor ID', 'Action', 'Target Type', 'Target ID', 'Client User ID', 'Organization ID', 'Risk Level', 'Timestamp'];
  const rows = logs.map(log => [
    log.id,
    log.actor_id,
    log.action,
    log.target_type || '',
    log.target_id || '',
    log.client_user_id || '',
    log.organization_id || '',
    log.risk_level || '',
    log.timestamp
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// 時間間隔チェック
function checkTimeGaps(logs: any[]): any {
  const gaps = [];
  
  for (let i = 1; i < logs.length; i++) {
    const prevTime = new Date(logs[i-1].timestamp).getTime();
    const currTime = new Date(logs[i].timestamp).getTime();
    const gapHours = (currTime - prevTime) / (1000 * 60 * 60);
    
    if (gapHours > 4) { // 4時間以上の間隔
      gaps.push({
        start: logs[i-1].timestamp,
        end: logs[i].timestamp,
        gap_hours: gapHours
      });
    }
  }
  
  return {
    large_gaps_count: gaps.length,
    gaps: gaps.slice(0, 10) // 最大10件
  };
}

// 存在しないアクターチェック
function checkMissingActors(logs: any[]): any {
  const actorIds = new Set(logs.map(log => log.actor_id).filter(Boolean));
  
  return {
    unique_actors: actorIds.size,
    null_actors: logs.filter(log => !log.actor_id).length
  };
}

// 不審パターンチェック
function checkSuspiciousPatterns(logs: any[]): any {
  const patterns = {
    rapid_actions: 0,
    bulk_operations: 0,
    off_hours_activity: 0
  };

  // 短時間内の大量操作チェック
  const timeWindows = new Map();
  logs.forEach(log => {
    const timeKey = new Date(log.timestamp).toISOString().slice(0, 16); // 分単位
    const actorKey = `${log.actor_id}-${timeKey}`;
    timeWindows.set(actorKey, (timeWindows.get(actorKey) || 0) + 1);
  });

  patterns.rapid_actions = Array.from(timeWindows.values()).filter(count => count > 10).length;

  // 深夜活動チェック
  patterns.off_hours_activity = logs.filter(log => {
    const hour = new Date(log.timestamp).getHours();
    return hour < 6 || hour > 22;
  }).length;

  return patterns;
}

// 孤立参照チェック
async function checkOrphanedReferences(admin: any, logs: any[]): Promise<any> {
  const delegationIds = new Set(logs.map(log => log.delegation_id).filter(Boolean));
  const organizationIds = new Set(logs.map(log => log.organization_id).filter(Boolean));

  const checks = {
    total_delegations_referenced: delegationIds.size,
    total_organizations_referenced: organizationIds.size,
    orphaned_delegations: 0,
    orphaned_organizations: 0
  };

  // 委任の存在確認（サンプルチェック）
  if (delegationIds.size > 0) {
    const sampleDelegations = Array.from(delegationIds).slice(0, 100);
    const { data: existingDelegations } = await admin
      .from('hearing_delegations')
      .select('id')
      .in('id', sampleDelegations);
    
    const existingIds = new Set(existingDelegations?.map(d => d.id) || []);
    checks.orphaned_delegations = sampleDelegations.filter(id => !existingIds.has(id)).length;
  }

  return checks;
}

// 整合性スコア計算
function calculateIntegrityScore(checks: any): number {
  let score = 1.0;

  // 大きな時間間隔がある場合減点
  if (checks.time_gaps.large_gaps_count > 0) {
    score -= Math.min(0.2, checks.time_gaps.large_gaps_count * 0.05);
  }

  // 不審なパターンがある場合減点
  if (checks.suspicious_patterns.rapid_actions > 0) {
    score -= Math.min(0.3, checks.suspicious_patterns.rapid_actions * 0.1);
  }

  // 孤立参照がある場合減点
  if (checks.orphaned_references.orphaned_delegations > 0) {
    score -= Math.min(0.2, checks.orphaned_references.orphaned_delegations * 0.02);
  }

  return Math.max(0, Math.round(score * 100) / 100);
}