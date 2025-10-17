import { NextRequest } from 'next/server';

export interface AiVisibilityJobResult {
  success: boolean;
  summary?: any;
  error?: string;
  timestamp: string;
}

export async function runAiVisibilityJob(): Promise<AiVisibilityJobResult> {
  try {
    console.log('[AI Visibility Job] Starting AI visibility check...');
    
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
        source: 'daily-cron',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Visibility Job] Check failed:', errorText);
      throw new Error(`AI visibility check failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('[AI Visibility Job] Check completed successfully:', {
      summary: result.summary,
      timestamp: new Date().toISOString()
    });
    
    // Send notifications if there are P0 issues
    if (result.summary?.p0Issues > 0) {
      await sendSlackNotification(result.summary, result.results);
    }
    
    return {
      success: true,
      summary: result.summary,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[AI Visibility Job] Error:', error);
    
    // Send error notification
    await sendErrorNotification(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

async function sendSlackNotification(summary: any, results: any[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[AI Visibility Job] No Slack webhook configured, skipping notification');
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
    
    console.log('[AI Visibility Job] Slack notification sent successfully');
    
  } catch (error) {
    console.error('[AI Visibility Job] Failed to send Slack notification:', error);
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
            text: "💥 AI Visibility Job Failed"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* ${error instanceof Error ? error.message : 'Unknown error'}\n*Time:* ${new Date().toISOString()}\n*Source:* Daily Maintenance Cron`
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
    console.error('[AI Visibility Job] Failed to send error notification:', slackError);
  }
}