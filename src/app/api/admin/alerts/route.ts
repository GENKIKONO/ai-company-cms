/**
 * Admin Alerts API
 * GET /api/admin/alerts - アラート一覧取得
 * GET /api/admin/alerts?type=rules - ルール一覧取得
 * POST /api/admin/alerts - アラート作成
 * POST /api/admin/alerts?type=rules - ルール作成
 *
 * DB Schema:
 * public.alert_rules: id, name, description, is_active, severity, channel[], condition jsonb
 * public.alerts: id, rule_id, status, payload jsonb, created_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().default(true),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  channel: z.array(z.string()).default(['broadcast']),
  condition: z.record(z.any()).default({}),
});

const createAlertSchema = z.object({
  rule_id: z.string().uuid().optional().nullable(),
  status: z.enum(['open', 'acknowledged', 'resolved']).default('open'),
  payload: z.record(z.any()).default({}),
});

// GET - アラートまたはルール一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (type === 'rules') {
      // Alert Rules
      return await getAlertRules(supabase, url, limit, offset, user.id);
    } else {
      // Alerts
      return await getAlerts(supabase, url, limit, offset, user.id);
    }

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in GET', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alert Rules一覧取得
async function getAlertRules(
  supabase: SupabaseClient,
  url: URL,
  limit: number,
  offset: number,
  userId: string
) {
  const isActive = url.searchParams.get('is_active');
  const severity = url.searchParams.get('severity');

  let query = supabase
    .from('alert_rules')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false });

  if (isActive !== null && isActive !== '') {
    query = query.eq('is_active', isActive === 'true');
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rules, error, count } = await query;

  if (error) {
    logger.error('[Alerts API] Rules query error', { error: error.message });

    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, limit, offset, has_more: false },
        message: 'alert_rules table not found'
      });
    }

    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }

  logger.info('[Alerts API] Rules fetched', { user_id: userId, count: rules?.length });

  return NextResponse.json({
    success: true,
    data: rules || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0)
    }
  });
}

// Alerts一覧取得
async function getAlerts(
  supabase: SupabaseClient,
  url: URL,
  limit: number,
  offset: number,
  userId: string
) {
  const ruleId = url.searchParams.get('rule_id');
  const status = url.searchParams.get('status');
  const createdFrom = url.searchParams.get('created_from');
  const createdTo = url.searchParams.get('created_to');

  let query = supabase
    .from('alerts')
    .select('*, alert_rules(name, severity)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (createdFrom) {
    query = query.gte('created_at', createdFrom);
  }

  if (createdTo) {
    query = query.lte('created_at', createdTo);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: alerts, error, count } = await query;

  if (error) {
    logger.error('[Alerts API] Alerts query error', { error: error.message });

    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, limit, offset, has_more: false },
        message: 'alerts table not found'
      });
    }

    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  logger.info('[Alerts API] Alerts fetched', { user_id: userId, count: alerts?.length });

  return NextResponse.json({
    success: true,
    data: alerts || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0)
    }
  });
}

// POST - アラートまたはルール作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin権限チェック（v_app_users_compat2 互換ビュー使用）
    const { data: userProfile } = await supabase
      .from('v_app_users_compat2')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const body = await request.json();

    if (type === 'rules') {
      // Create Alert Rule
      return await createAlertRule(supabase, body, user.id);
    } else {
      // Create Alert
      return await createAlert(supabase, body, user.id);
    }

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in POST', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alert Rule作成
async function createAlertRule(supabase: SupabaseClient, body: unknown, userId: string) {
  const validation = createRuleSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const ruleData = {
    ...validation.data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newRule, error } = await supabase
    .from('alert_rules')
    .insert(ruleData)
    .select()
    .single();

  if (error) {
    logger.error('[Alerts API] Rule insert error', { error: error.message });
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }

  logger.info('[Alerts API] Rule created', {
    rule_id: newRule.id,
    name: newRule.name,
    created_by: userId
  });

  return NextResponse.json({
    success: true,
    message: 'Alert rule created successfully',
    data: newRule
  }, { status: 201 });
}

// Alert作成
async function createAlert(supabase: SupabaseClient, body: unknown, userId: string) {
  const validation = createAlertSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const alertData = {
    ...validation.data,
    created_at: new Date().toISOString(),
  };

  const { data: newAlert, error } = await supabase
    .from('alerts')
    .insert(alertData)
    .select('*, alert_rules(name, severity)')
    .single();

  if (error) {
    logger.error('[Alerts API] Alert insert error', { error: error.message });
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }

  logger.info('[Alerts API] Alert created', {
    alert_id: newAlert.id,
    rule_id: newAlert.rule_id,
    created_by: userId
  });

  return NextResponse.json({
    success: true,
    message: 'Alert created successfully',
    data: newAlert
  }, { status: 201 });
}
