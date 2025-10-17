import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron job for AI Visibility checks
// Schedule: Daily at 3:00 AM JST (18:00 UTC)
export async function GET(request: NextRequest) {
  try {
    // Verify this is actually a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[AI Visibility Cron] Starting scheduled check...');
    
    // Call the main AI visibility check API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
    const response = await fetch(`${baseUrl}/api/admin/ai-visibility/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN || 'internal-cron'}`
      },
      body: JSON.stringify({
        dryRun: false,
        source: 'cron',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Visibility Cron] Check failed:', errorText);
      throw new Error(`AI visibility check failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('[AI Visibility Cron] Check completed successfully:', {
      summary: result.summary,
      timestamp: new Date().toISOString()
    });
    
    // Send notifications if there are P0 issues
    if (result.summary?.p0Issues > 0) {
      await sendSlackNotification(result.summary, result.results);
    }
    
    return NextResponse.json({
      success: true,
      message: 'AI visibility check completed',
      summary: result.summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[AI Visibility Cron] Error:', error);
    
    // Send error notification
    await sendErrorNotification(error);
    
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function sendSlackNotification(summary: any, results: any[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[AI Visibility Cron] No Slack webhook configured, skipping notification');
    return;
  }
  
  try {
    const p0Issues = results.filter(r => r.severity === 'P0');
    const criticalUrls = [...new Set(p0Issues.map(r => r.url))];
    
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 AI Visibility Alert - Critical Issues Detected"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*P0 Critical:* ${summary.p0Issues}`
            },
            {
              type: "mrkdwn",
              text: `*P1 Important:* ${summary.p1Issues}`
            },
            {
              type: "mrkdwn",
              text: `*P2 Minor:* ${summary.p2Issues}`
            },
            {
              type: "mrkdwn",
              text: `*Healthy:* ${summary.okChecks}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Critical URLs affected:*\n${criticalUrls.slice(0, 5).map(url => `• ${url}`).join('\n')}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Common Issues:*\n${summary.topIssues.slice(0, 3).map((issue: string) => `• ${issue}`).join('\n')}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Dashboard"
              },
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/ai-visibility`
            }
          ]
        }
      ]
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status}`);
    }
    
    console.log('[AI Visibility Cron] Slack notification sent successfully');
    
  } catch (error) {
    console.error('[AI Visibility Cron] Failed to send Slack notification:', error);
  }
}

async function sendErrorNotification(error: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "💥 AI Visibility Cron Job Failed"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* ${error instanceof Error ? error.message : 'Unknown error'}\n*Time:* ${new Date().toISOString()}`
          }
        }
      ]
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
  } catch (slackError) {
    console.error('[AI Visibility Cron] Failed to send error notification:', slackError);
  }
}