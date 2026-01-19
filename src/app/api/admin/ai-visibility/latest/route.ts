/**
 * AI Visibility Latest Results API
 *
 * ⚠️ Requires site_admin authentication.
 */
/* eslint-disable no-console */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { getAiVisibilityStatus } from '@/lib/ai-visibility-config';
import { supabaseAdmin } from '@/lib/supabase-admin-client';

// Get latest AI visibility check results
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  const startTime = Date.now();

  try {
    // Test status accessibility first - includes fallback handling
    const status = await getAiVisibilityStatus();
    
    // Production logging (lightweight)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[AI Visibility Latest] Success - enabled:${status.enabled} elapsed:${Date.now() - startTime}ms`);
    }
    
    const supabase = supabaseAdmin;
    
    // Get latest results (last 24 hours) with fallback handling
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let logs = [];
    try {
      const { data, error } = await supabase
        .from('ai_visibility_logs')
        .select('id, url, user_agent, timestamp, severity_level, response_time_ms, issues')
        .gte('timestamp', yesterday)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) {
        console.warn('[AI Visibility Latest] Database error, using empty dataset:', error.message);
        // Don't throw - continue with empty logs for graceful degradation
        logs = [];
      } else {
        logs = data || [];
      }
    } catch (dbError) {
      console.warn('[AI Visibility Latest] Database connection failed, using empty dataset:', dbError);
      logs = [];
    }
    
    // Generate summary
    const summary = generateSummary(logs);
    
    return NextResponse.json({
      success: true,
      enabled: status.enabled,
      last_check: status.last_check,
      results: logs,
      summary,
      lastCheck: logs?.[0]?.timestamp || null,
      configStatus: logs.length > 0 ? 'active' : 'fallback',
      message: logs.length === 0 ? 'Using fallback mode due to database issues' : 'Data loaded successfully'
    });
    
  } catch (error) {
    // Production error logging (one line)
    if (process.env.NODE_ENV === 'production') {
      console.error(`[AI Visibility Latest] Error elapsed:${Date.now() - startTime}ms - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } else {
      console.error('[AI Visibility Latest] Fatal error:', error);
    }
    
    // Even in complete failure, return safe defaults
    return NextResponse.json({
      success: false,
      enabled: true, // Safe default
      last_check: null,
      results: [],
      summary: {
        total: 0,
        p0Issues: 0,
        p1Issues: 0,
        p2Issues: 0,
        okChecks: 0,
        avgResponseTime: 0,
        uniqueUrls: 0,
        uniqueUserAgents: 0,
        topIssues: []
      },
      lastCheck: null,
      configStatus: 'error',
      message: 'Service temporarily unavailable - using safe defaults',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Service error'
    });
  }
}

function generateSummary(logs: any[]) {
  const uniqueUrls = new Set<string>();
  const uniqueUserAgents = new Set<string>();
  
  const summary = {
    total: logs.length,
    p0Issues: 0,
    p1Issues: 0,
    p2Issues: 0,
    okChecks: 0,
    avgResponseTime: 0,
    uniqueUrls: 0,
    uniqueUserAgents: 0,
    topIssues: [] as string[]
  };
  
  let totalResponseTime = 0;
  const allIssues: string[] = [];
  
  logs.forEach(log => {
    uniqueUrls.add(log.url);
    uniqueUserAgents.add(log.user_agent);
    
    switch (log.severity_level) {
      case 'P0': summary.p0Issues++; break;
      case 'P1': summary.p1Issues++; break;
      case 'P2': summary.p2Issues++; break;
      default: summary.okChecks++; break;
    }
    
    if (log.response_time_ms) {
      totalResponseTime += log.response_time_ms;
    }
    
    if (log.issues && Array.isArray(log.issues)) {
      allIssues.push(...log.issues);
    }
  });
  
  summary.avgResponseTime = logs.length > 0 ? Math.round(totalResponseTime / logs.length) : 0;
  summary.uniqueUrls = uniqueUrls.size;
  summary.uniqueUserAgents = uniqueUserAgents.size;
  
  // Count issue frequency
  const issueCounts = allIssues.reduce((acc, issue) => {
    acc[issue] = (acc[issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  summary.topIssues = Object.entries(issueCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => `${issue} (${count})`);
  
  return summary;
}