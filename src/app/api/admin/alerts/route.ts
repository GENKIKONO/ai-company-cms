/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import type { Alert, AlertRule, MonitoringFilters, CreateAlertRuleRequest } from '@/lib/monitoring/types';

const alertRuleSchema = z.object({
  name: z.string().min(1, 'Alert rule name is required').max(100),
  description: z.string().max(500).optional(),
  metric_name: z.string().min(1, 'Metric name is required'),
  condition: z.object({
    operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
    aggregation: z.enum(['avg', 'sum', 'min', 'max', 'count']),
    time_window: z.number().min(60).max(86400), // 1 minute to 24 hours
    group_by: z.array(z.string()).optional()
  }),
  threshold: z.number(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  evaluation_interval: z.number().min(60).max(3600).default(300), // 1 minute to 1 hour
  evaluation_duration: z.number().min(60).max(7200).default(300), // 1 minute to 2 hours
  notification_channels: z.array(z.string()).min(1, 'At least one notification channel is required'),
  organization_id: z.string().uuid().optional(),
  labels: z.record(z.string(), z.string()).default({}),
  annotations: z.record(z.string(), z.string()).default({})
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'active'; // 'active', 'rules', 'history'
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const organization_id = url.searchParams.get('organization_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (type === 'rules') {
      // Return alert rules
      const mockRules: AlertRule[] = [
        {
          id: 'rule-1',
          name: 'High Error Rate',
          description: 'Alert when error rate exceeds 5% over 5 minutes',
          metric_name: 'http_errors_total',
          condition: {
            operator: 'gt',
            aggregation: 'avg',
            time_window: 300,
            group_by: ['endpoint']
          },
          threshold: 0.05,
          severity: 'error',
          evaluation_interval: 60,
          evaluation_duration: 300,
          labels: { team: 'platform' },
          annotations: { runbook: 'https://docs.example.com/runbooks/error-rate' },
          notification_channels: ['slack-alerts', 'email-oncall'],
          suppress_notifications: false,
          notification_cooldown: 3600,
          applies_to: 'all',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z',
          created_by: user.id,
          last_evaluated_at: new Date().toISOString()
        },
        {
          id: 'rule-2',
          name: 'Slow Response Time',
          description: 'Alert when P95 response time exceeds 2 seconds',
          metric_name: 'http_request_duration',
          condition: {
            operator: 'gt',
            aggregation: 'avg',
            time_window: 600,
            group_by: ['endpoint']
          },
          threshold: 2.0,
          severity: 'warning',
          evaluation_interval: 120,
          evaluation_duration: 600,
          labels: { team: 'platform' },
          annotations: {},
          notification_channels: ['slack-performance'],
          suppress_notifications: false,
          notification_cooldown: 1800,
          applies_to: 'all',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z',
          created_by: user.id,
          last_evaluated_at: new Date().toISOString()
        }
      ];

      // Apply filters
      const filteredRules = mockRules.filter(rule => {
        if (severity && rule.severity !== severity) return false;
        if (organization_id && rule.organization_id !== organization_id) return false;
        return true;
      });

      return NextResponse.json({
        success: true,
        data: filteredRules.slice(offset, offset + limit),
        pagination: {
          total: filteredRules.length,
          limit,
          offset,
          has_more: filteredRules.length > offset + limit
        }
      });
    }

    // Return active/historical alerts
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        rule_id: 'rule-1',
        name: 'High Error Rate',
        description: 'Error rate is 7.2% over the last 5 minutes',
        severity: 'error',
        status: 'active',
        source: 'application',
        triggered_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        current_value: 0.072,
        threshold_value: 0.05,
        metric_name: 'http_errors_total',
        labels: { endpoint: '/api/analytics', team: 'platform' },
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'alert-2',
        rule_id: 'rule-2',
        name: 'Slow Response Time',
        description: 'P95 response time is 2.8 seconds',
        severity: 'warning',
        status: 'resolved',
        source: 'application',
        triggered_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        resolved_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        current_value: 1.2,
        threshold_value: 2.0,
        metric_name: 'http_request_duration',
        labels: { endpoint: '/api/reports', team: 'platform' },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Apply filters
    const filteredAlerts = mockAlerts.filter(alert => {
      if (severity && alert.severity !== severity) return false;
      if (status && alert.status !== status) return false;
      if (type === 'active' && alert.status !== 'active') return false;
      return true;
    });

    logger.info('[Alerts API] Alerts list requested', {
      user_id: user.id,
      type,
      filters: { severity, status, organization_id },
      result_count: filteredAlerts.length
    });

    return NextResponse.json({
      success: true,
      data: filteredAlerts.slice(offset, offset + limit),
      pagination: {
        total: filteredAlerts.length,
        limit,
        offset,
        has_more: filteredAlerts.length > offset + limit
      }
    });

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in GET', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('app_users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = alertRuleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const ruleData = validation.data;

    // TODO: Implement actual database insertion
    // This would create a new record in the 'alert_rules' table
    const mockRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: ruleData.name,
      description: ruleData.description || '',
      metric_name: ruleData.metric_name,
      condition: ruleData.condition,
      threshold: ruleData.threshold,
      severity: ruleData.severity,
      evaluation_interval: ruleData.evaluation_interval,
      evaluation_duration: ruleData.evaluation_duration,
      labels: ruleData.labels,
      annotations: ruleData.annotations,
      notification_channels: ruleData.notification_channels,
      suppress_notifications: false,
      notification_cooldown: 3600, // 1 hour default
      organization_id: ruleData.organization_id,
      applies_to: ruleData.organization_id ? 'organization' : 'all',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id
    };

    logger.info('[Alerts API] Alert rule created', {
      rule_id: mockRule.id,
      rule_name: ruleData.name,
      metric_name: ruleData.metric_name,
      severity: ruleData.severity,
      created_by: userProfile.full_name
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule created successfully',
      data: mockRule
    });

  } catch (error) {
    logger.error('[Alerts API] Unexpected error in POST', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}