import { NextRequest, NextResponse } from 'next/server';
import { runAiVisibilityJob } from '@/lib/jobs/ai-visibility-job';

// Unified Daily Maintenance Cron
// Schedule: Daily at 3:00 AM JST (18:00 UTC)
// Integrates: AI Visibility, Cleanup, Health Checks
export async function GET(request: NextRequest) {
  try {
    // Verify this is actually a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Daily Cron] Starting daily maintenance tasks...');
    const startTime = Date.now();
    const results = {
      aiVisibility: null as any,
      cleanup: null as any,
      healthCheck: null as any,
      errors: [] as string[]
    };
    
    // 1. AI visibility integrated job
    try {
      console.log('[Daily Cron] Running AI visibility check...');
      results.aiVisibility = await runAiVisibilityJob();
      console.log('[Daily Cron] AI visibility check completed:', results.aiVisibility.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      const errorMsg = `AI Visibility job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Daily Cron]', errorMsg);
      results.errors.push(errorMsg);
      results.aiVisibility = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
    }
    
    // 2. Database cleanup job
    try {
      console.log('[Daily Cron] Running database cleanup...');
      results.cleanup = await runDatabaseCleanup();
      console.log('[Daily Cron] Database cleanup completed:', results.cleanup.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      const errorMsg = `Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Daily Cron]', errorMsg);
      results.errors.push(errorMsg);
      results.cleanup = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
    }
    
    // 3. Health check job
    try {
      console.log('[Daily Cron] Running health checks...');
      results.healthCheck = await runHealthCheck();
      console.log('[Daily Cron] Health checks completed:', results.healthCheck.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      const errorMsg = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Daily Cron]', errorMsg);
      results.errors.push(errorMsg);
      results.healthCheck = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
    }
    
    const duration = Date.now() - startTime;
    const successCount = [results.aiVisibility, results.cleanup, results.healthCheck].filter(r => r?.success).length;
    const totalJobs = 3;
    
    console.log('[Daily Cron] Daily maintenance completed:', {
      duration: `${duration}ms`,
      success: `${successCount}/${totalJobs}`,
      errors: results.errors.length,
      timestamp: new Date().toISOString()
    });
    
    // Send summary notification if there are failures
    if (results.errors.length > 0) {
      await sendMaintenanceSummary(results, duration);
    }
    
    return NextResponse.json({
      success: results.errors.length === 0,
      message: `Daily maintenance completed (${successCount}/${totalJobs} jobs successful)`,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Daily Cron] Fatal error:', error);
    
    return NextResponse.json(
      { 
        error: 'Daily maintenance failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function runDatabaseCleanup() {
  try {
    // Basic database cleanup - remove old logs older than 30 days
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
    
    // Simulate cleanup - in real implementation, call actual cleanup API
    console.log('[Daily Cron] Database cleanup simulated (would clean logs > 30 days)');
    
    return {
      success: true,
      recordsDeleted: 0, // Would be actual count
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runHealthCheck() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
    
    // Basic health check - verify key endpoints
    const healthEndpoint = `${baseUrl}/api/health`;
    const response = await fetch(healthEndpoint, { 
      method: 'GET',
      headers: { 'User-Agent': 'DailyCron/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const healthData = await response.json();
    
    return {
      success: true,
      status: healthData.status || 'healthy',
      checks: healthData.checks || {},
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function sendMaintenanceSummary(results: any, duration: number) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[Daily Cron] No Slack webhook configured, skipping summary notification');
    return;
  }
  
  try {
    const failedJobs = [];
    if (!results.aiVisibility?.success) failedJobs.push('AI Visibility');
    if (!results.cleanup?.success) failedJobs.push('Database Cleanup');
    if (!results.healthCheck?.success) failedJobs.push('Health Check');
    
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: failedJobs.length > 0 ? "⚠️ Daily Maintenance Issues" : "✅ Daily Maintenance Complete"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Duration:* ${duration}ms`
            },
            {
              type: "mrkdwn",
              text: `*Failed Jobs:* ${failedJobs.length > 0 ? failedJobs.join(', ') : 'None'}`
            }
          ]
        }
      ]
    };
    
    if (results.errors.length > 0) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Errors:*\n${results.errors.slice(0, 3).map((error: string) => `• ${error}`).join('\n')}`
        }
      });
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status}`);
    }
    
    console.log('[Daily Cron] Maintenance summary sent to Slack');
    
  } catch (error) {
    console.error('[Daily Cron] Failed to send maintenance summary:', error);
  }
}