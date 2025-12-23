import { NextRequest, NextResponse } from 'next/server';
import { runAiVisibilityJob } from '@/lib/jobs/ai-visibility-job';
import { runWeeklyAiCitationsAggregation } from '@/lib/jobs/ai-citations-aggregation-job';
import { logger } from '@/lib/log';
import { runSecurityScan } from '@/lib/jobs/security-scan-job';
import { runTranslationDrain } from '@/lib/jobs/translation-drain-job';

// Unified Daily Maintenance Cron
// Schedule: Daily at 3:00 AM JST (18:00 UTC)
// Integrates: AI Visibility, Cleanup, Health Checks

// フェイルセーフ: 合計持ち時間の閾値（ミリ秒）
const MAX_TOTAL_DURATION_MS = 55000; // 55秒（Vercelの60秒制限に余裕）

// スキップ時のジョブ結果型
interface SkippedJobResult {
  success: false;
  skipped: true;
  reason: string;
  timestamp: string;
}

// 各ジョブの結果は success を持つ任意のオブジェクト
// eslint-disable-next-line -- allow any for flexible job result types
type AnyJobResult = { success: boolean } & Record<string, any>;

interface CronResults {
  aiVisibility: AnyJobResult | SkippedJobResult | null;
  aiCitationsAggregation: AnyJobResult | SkippedJobResult | null;
  securityScan: AnyJobResult | SkippedJobResult | null;
  translationDrain: AnyJobResult | SkippedJobResult | null;
  cleanup: AnyJobResult | SkippedJobResult | null;
  healthCheck: AnyJobResult | SkippedJobResult | null;
  errors: string[];
  skippedJobs: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is actually a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug('[Daily Cron] Starting daily maintenance tasks...');
    const cronStartTime = Date.now();

    const results: CronResults = {
      aiVisibility: null,
      aiCitationsAggregation: null,
      securityScan: null,
      translationDrain: null,
      cleanup: null,
      healthCheck: null,
      errors: [],
      skippedJobs: [],
    };

    // ジョブ実行前のタイムアウトチェック関数
    const shouldSkipDueToTimeout = () => {
      const elapsed = Date.now() - cronStartTime;
      return elapsed >= MAX_TOTAL_DURATION_MS;
    };

    // ジョブをスキップした場合の記録
    const markJobSkipped = (jobName: string): SkippedJobResult => {
      results.skippedJobs.push(jobName);
      logger.warn(`[Daily Cron] Job skipped due to timeout: ${jobName}`);
      return {
        success: false,
        skipped: true,
        reason: 'Timeout: carried over to next run',
        timestamp: new Date().toISOString(),
      };
    };

    // 1. AI visibility integrated job
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running AI visibility check...');
        results.aiVisibility = await runAiVisibilityJob();
        logger.debug(`[Daily Cron] AI visibility check completed: ${results.aiVisibility.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `AI Visibility job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.aiVisibility = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.aiVisibility = markJobSkipped('AI Visibility');
    }

    // 2. AI Citations aggregation job (weekly basis)
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running AI citations aggregation...');
        results.aiCitationsAggregation = await runWeeklyAiCitationsAggregation(request);
        logger.debug(`[Daily Cron] AI citations aggregation completed: ${results.aiCitationsAggregation.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `AI citations aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.aiCitationsAggregation = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.aiCitationsAggregation = markJobSkipped('AI Citations Aggregation');
    }

    // 3. Security scan job (intrusion detection)
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running security scan...');
        results.securityScan = await runSecurityScan();
        logger.debug(`[Daily Cron] Security scan completed: ${results.securityScan.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.securityScan = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.securityScan = markJobSkipped('Security Scan');
    }

    // 4. Translation drain job
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running translation drain...');
        results.translationDrain = await runTranslationDrain(50);
        logger.debug(`[Daily Cron] Translation drain completed: ${results.translationDrain.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `Translation drain failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.translationDrain = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.translationDrain = markJobSkipped('Translation Drain');
    }

    // 5. Database cleanup job
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running database cleanup...');
        results.cleanup = await runDatabaseCleanup();
        logger.debug(`[Daily Cron] Database cleanup completed: ${results.cleanup.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.cleanup = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.cleanup = markJobSkipped('Database Cleanup');
    }

    // 6. Health check job
    if (!shouldSkipDueToTimeout()) {
      try {
        logger.debug('[Daily Cron] Running health checks...');
        results.healthCheck = await runHealthCheck();
        logger.debug(`[Daily Cron] Health checks completed: ${results.healthCheck.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        const errorMsg = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
        results.healthCheck = { success: false, error: errorMsg, timestamp: new Date().toISOString() };
      }
    } else {
      results.healthCheck = markJobSkipped('Health Check');
    }

    const duration = Date.now() - cronStartTime;
    const allJobs = [results.aiVisibility, results.aiCitationsAggregation, results.securityScan, results.translationDrain, results.cleanup, results.healthCheck];
    const successCount = allJobs.filter(r => r?.success).length;
    const skippedCount = results.skippedJobs.length;
    const totalJobs = 6;

    logger.info('[Daily Cron] Daily maintenance completed:', {
      duration: `${duration}ms`,
      success: `${successCount}/${totalJobs}`,
      skipped: skippedCount,
      errors: results.errors.length,
      timestamp: new Date().toISOString()
    });

    // job_runs_v2 にスキップ記録を保存（実際のDB書き込みはサービス層で）
    if (skippedCount > 0) {
      logger.warn('[Daily Cron] Some jobs were skipped due to timeout', {
        skippedJobs: results.skippedJobs,
        elapsed: duration,
        threshold: MAX_TOTAL_DURATION_MS,
      });
    }

    // Send summary notification if there are failures or skips
    if (results.errors.length > 0 || skippedCount > 0) {
      await sendMaintenanceSummary(results, duration);
    }

    return NextResponse.json({
      success: results.errors.length === 0 && skippedCount === 0,
      message: `Daily maintenance completed (${successCount}/${totalJobs} jobs successful, ${skippedCount} skipped)`,
      results: {
        aiVisibility: results.aiVisibility,
        aiCitationsAggregation: results.aiCitationsAggregation,
        securityScan: results.securityScan,
        translationDrain: results.translationDrain,
        cleanup: results.cleanup,
        healthCheck: results.healthCheck,
        errors: results.errors,
        skippedJobs: results.skippedJobs,
      },
      meta: {
        duration_ms: duration,
        timeout_threshold_ms: MAX_TOTAL_DURATION_MS,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('[Daily Cron] Fatal error', { data: { error: error instanceof Error ? error.message : String(error) } });

    return NextResponse.json(
      {
        success: false,
        error_code: 'CRON_FATAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function runDatabaseCleanup(): Promise<AnyJobResult> {
  try {
    // Basic database cleanup - remove old logs older than 30 days
    logger.debug('[Daily Cron] Database cleanup simulated (would clean logs > 30 days)');

    return {
      success: true,
      recordsDeleted: 0, // Would be actual count
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runHealthCheck(): Promise<AnyJobResult> {
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

async function sendMaintenanceSummary(results: CronResults, duration: number) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.debug('[Daily Cron] No Slack webhook configured, skipping summary notification');
    return;
  }

  try {
    const failedJobs = [];
    if (!results.aiVisibility?.success && !results.aiVisibility?.skipped) failedJobs.push('AI Visibility');
    if (!results.aiCitationsAggregation?.success && !results.aiCitationsAggregation?.skipped) failedJobs.push('AI Citations Aggregation');
    if (!results.securityScan?.success && !results.securityScan?.skipped) failedJobs.push('Security Scan');
    if (!results.translationDrain?.success && !results.translationDrain?.skipped) failedJobs.push('Translation Drain');
    if (!results.cleanup?.success && !results.cleanup?.skipped) failedJobs.push('Database Cleanup');
    if (!results.healthCheck?.success && !results.healthCheck?.skipped) failedJobs.push('Health Check');

    const hasSkipped = results.skippedJobs.length > 0;
    const hasFailed = failedJobs.length > 0;

    const headerText = hasSkipped
      ? '⏭️ Daily Maintenance - Jobs Skipped'
      : hasFailed
        ? '⚠️ Daily Maintenance Issues'
        : '✅ Daily Maintenance Complete';

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: headerText
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

    if (hasSkipped) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Skipped (timeout):* ${results.skippedJobs.join(', ')}`
        }
      });
    }

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

    logger.debug('[Daily Cron] Maintenance summary sent to Slack');

  } catch (error) {
    logger.error('[Daily Cron] Failed to send maintenance summary', { data: { error: error instanceof Error ? error.message : String(error) } });
  }
}
