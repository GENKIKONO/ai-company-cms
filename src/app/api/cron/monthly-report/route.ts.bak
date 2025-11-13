import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { collectMonthlyData, generateHTMLReport, saveReportToStorage } from '@/lib/report-generator';
import { logger } from '@/lib/utils/logger';
import type { MonthlyReport } from '@/types/database';

// Monthly Report Generation Cron
// Schedule: Monthly on 1st at 5:00 AM JST (20:00 UTC on previous day)
export async function GET(request: NextRequest) {
  try {
    // Verify this is actually a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('[Monthly Cron] Starting monthly report generation...');
    const startTime = Date.now();
    const now = new Date();
    
    // Calculate previous month
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const results = {
      targetPeriod: `${targetYear}-${targetMonth.toString().padStart(2, '0')}`,
      organizationsProcessed: 0,
      reportsGenerated: 0,
      reportsSkipped: 0,
      reportsFailed: 0,
      errors: [] as string[]
    };

    // Get all organizations eligible for monthly reports using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, plan')
      .eq('is_published', true);

    if (orgsError) {
      logger.error('[Monthly Cron] Failed to fetch organizations', orgsError);
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: orgsError },
        { status: 500 }
      );
    }

    logger.info(`[Monthly Cron] Processing ${organizations?.length || 0} organizations for ${results.targetPeriod}`);

    // Process each organization
    for (const org of organizations || []) {
      results.organizationsProcessed++;
      
      try {
        // Check if report already exists for this period
        const { data: existingReport } = await supabase
          .from('monthly_reports')
          .select('id, status')
          .eq('organization_id', org.id)
          .eq('year', targetYear)
          .eq('month', targetMonth)
          .single();

        if (existingReport) {
          logger.info(`[Monthly Cron] Report already exists for ${org.name} (${results.targetPeriod})`);
          results.reportsSkipped++;
          continue;
        }

        // Create report record in generating status
        const reportId = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from('monthly_reports')
          .insert({
            id: reportId,
            organization_id: org.id,
            year: targetYear,
            month: targetMonth,
            status: 'generating',
            format: 'html',
            data_summary: {
              ai_visibility_score: 0,
              total_bot_hits: 0,
              unique_bots: 0,
              analyzed_urls: 0,
              top_performing_urls: 0,
              improvement_needed_urls: 0
            }
          });

        if (insertError) {
          logger.error(`[Monthly Cron] Failed to create report record for ${org.name}`, insertError);
          results.errors.push(`${org.name}: Failed to create report record`);
          results.reportsFailed++;
          continue;
        }

        // Collect data for the organization
        const reportData = await collectMonthlyData(org.id, targetYear, targetMonth);
        
        if (!reportData) {
          await supabase
            .from('monthly_reports')
            .update({
              status: 'failed',
              error_message: 'Failed to collect monthly data'
            })
            .eq('id', reportId);
          
          logger.error(`[Monthly Cron] Failed to collect data for ${org.name}`);
          results.errors.push(`${org.name}: Failed to collect data`);
          results.reportsFailed++;
          continue;
        }

        // Generate HTML report
        const htmlContent = generateHTMLReport(reportData);
        
        // Save to Supabase Storage
        const fileUrl = await saveReportToStorage(reportId, htmlContent, org.id);
        
        if (!fileUrl) {
          await supabase
            .from('monthly_reports')
            .update({
              status: 'failed',
              error_message: 'Failed to save report to storage'
            })
            .eq('id', reportId);
          
          logger.error(`[Monthly Cron] Failed to save report to storage for ${org.name}`);
          results.errors.push(`${org.name}: Failed to save to storage`);
          results.reportsFailed++;
          continue;
        }

        // Update report record with completion
        const { error: updateError } = await supabase
          .from('monthly_reports')
          .update({
            status: 'completed',
            file_url: fileUrl,
            file_size: Buffer.byteLength(htmlContent, 'utf8'),
            data_summary: {
              ai_visibility_score: reportData.aiVisibilityData.overall_score,
              total_bot_hits: reportData.botLogsData.total_count,
              unique_bots: reportData.botLogsData.unique_bots,
              analyzed_urls: reportData.aiVisibilityData.summary.total_analyzed_urls,
              top_performing_urls: reportData.aiVisibilityData.summary.top_performing_urls,
              improvement_needed_urls: reportData.aiVisibilityData.summary.improvement_needed_urls
            },
            generated_at: new Date().toISOString()
          })
          .eq('id', reportId);

        if (updateError) {
          logger.error(`[Monthly Cron] Failed to update report completion for ${org.name}`, updateError);
          results.errors.push(`${org.name}: Failed to update report status`);
          results.reportsFailed++;
        } else {
          logger.info(`[Monthly Cron] Successfully generated report for ${org.name} (${results.targetPeriod})`);
          results.reportsGenerated++;
          
          // TODO: Send email notification
          // await sendMonthlyReportEmail(org.id, reportData, fileUrl);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Monthly Cron] Error processing ${org.name}`, error);
        results.errors.push(`${org.name}: ${errorMsg}`);
        results.reportsFailed++;
        
        // Ensure report is marked as failed if it was created
        try {
          await supabase
            .from('monthly_reports')
            .update({
              status: 'failed',
              error_message: errorMsg
            })
            .eq('organization_id', org.id)
            .eq('year', targetYear)
            .eq('month', targetMonth);
        } catch (updateError) {
          logger.error(`[Monthly Cron] Failed to mark report as failed for ${org.name}`, updateError);
        }
      }
    }

    const duration = Date.now() - startTime;
    const successRate = results.organizationsProcessed > 0 
      ? Math.round((results.reportsGenerated / results.organizationsProcessed) * 100)
      : 0;

    logger.info('[Monthly Cron] Monthly report generation completed', {
      duration: `${duration}ms`,
      period: results.targetPeriod,
      organizations: results.organizationsProcessed,
      generated: results.reportsGenerated,
      skipped: results.reportsSkipped,
      failed: results.reportsFailed,
      successRate: `${successRate}%`,
      errors: results.errors.length
    });

    // Send summary notification if there are failures
    if (results.errors.length > 0) {
      await sendMonthlyReportSummary(results, duration);
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: `Monthly report generation completed for ${results.targetPeriod}`,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Monthly Cron] Fatal error in monthly report generation', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        error: 'Monthly report generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function sendMonthlyReportSummary(results: any, duration: number) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.debug('[Monthly Cron] No Slack webhook configured, skipping summary notification');
    return;
  }
  
  try {
    const hasFailures = results.reportsFailed > 0;
    const successRate = results.organizationsProcessed > 0 
      ? Math.round((results.reportsGenerated / results.organizationsProcessed) * 100)
      : 0;

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: hasFailures ? "⚠️ Monthly Report Generation Issues" : "📊 Monthly Reports Generated"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Period:* ${results.targetPeriod}`
            },
            {
              type: "mrkdwn",
              text: `*Duration:* ${duration}ms`
            },
            {
              type: "mrkdwn",
              text: `*Organizations:* ${results.organizationsProcessed}`
            },
            {
              type: "mrkdwn",
              text: `*Success Rate:* ${successRate}%`
            },
            {
              type: "mrkdwn",
              text: `*Generated:* ${results.reportsGenerated}`
            },
            {
              type: "mrkdwn",
              text: `*Failed:* ${results.reportsFailed}`
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
          text: `*Errors:*\n${results.errors.slice(0, 5).map((error: string) => `• ${error}`).join('\n')}`
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
    
    logger.info('[Monthly Cron] Report summary sent to Slack');
    
  } catch (error) {
    logger.error('[Monthly Cron] Failed to send report summary', error instanceof Error ? error : new Error(String(error)));
  }
}