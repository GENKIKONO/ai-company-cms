import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAiVisibilityConfig } from '@/lib/ai-visibility-config';

// Get latest AI visibility check results
export async function GET(request: NextRequest) {
  try {
    // Test configuration accessibility first - includes fallback handling
    const config = await getAiVisibilityConfig();
    console.log('[AI Visibility Latest] Configuration loaded successfully');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get latest results (last 24 hours) with fallback handling
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let logs = [];
    try {
      const { data, error } = await supabase
        .from('ai_visibility_logs')
        .select('*')
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
      results: logs,
      summary,
      lastCheck: logs?.[0]?.timestamp || null,
      configStatus: logs.length > 0 ? 'active' : 'fallback',
      message: logs.length === 0 ? 'Using fallback mode due to database issues' : 'Data loaded successfully'
    });
    
  } catch (error) {
    console.error('[AI Visibility Latest] Fatal error:', error);
    
    // Even in complete failure, return safe defaults
    return NextResponse.json({
      success: false,
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