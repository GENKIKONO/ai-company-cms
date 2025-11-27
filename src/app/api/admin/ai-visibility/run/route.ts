/* eslint-disable no-console */
import { supabaseAdmin } from '@/lib/supabase-admin-client';import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateLastCheck } from '@/lib/ai-visibility-config';
import { logger } from '@/lib/log';

// Error message translation mapping
function translateIssue(issue: string): string {
  const translations: Record<string, string> = {
    'Missing canonical URL': 'カノニカルURLが設定されていません',
    'Missing page title': 'ページタイトルがありません',
    'Missing meta description': 'meta descriptionがありません',
    'Access forbidden - check robots.txt or middleware blocking': 'アクセスが禁止されています - robots.txtまたはミドルウェアを確認してください',
    'Page not found': 'ページが見つかりません',
    'Rate limited - reduce request frequency': 'レート制限に達しました - リクエスト頻度を下げてください',
    'Meta robots contains noindex': 'meta robotsにnoindexが含まれています',
    'Missing JSON-LD structured data': 'JSON-LD構造化データがありません',
    'Insufficient text content for AI understanding': 'AIが理解するためのテキストコンテンツが不足しています'
  };

  // Check for status code patterns
  const statusCodeMatch = issue.match(/^Unexpected status code: (\d+)$/);
  if (statusCodeMatch) {
    return `予期しないステータスコード: ${statusCodeMatch[1]}`;
  }

  return translations[issue] || issue;
}

// AI Visibility Monitoring System
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Check authentication (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json().catch(() => ({}));
    const isDryRun = body.dryRun || false;
    const urls = body.urls || getDefaultUrls();
    
    logger.debug(`[AI Visibility] Starting ${isDryRun ? 'dry run' : 'full run'} check`);
    
    const results = await runAIVisibilityCheck(urls, isDryRun);
    
    if (!isDryRun) {
      // Save results to database
      await saveResults(supabase, results);
      
      // Update last check timestamp
      await updateLastCheck();
      
      // Send notifications if needed
      await sendNotifications(results);
    }
    
    return NextResponse.json({
      success: true,
      summary: generateSummary(results),
      results: results,
      dryRun: isDryRun
    });
    
  } catch (error) {
    logger.error('AI Visibility check error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for dry run
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isDryRun = true; // GET is always dry run
    const urls = getDefaultUrls();
    
    const results = await runAIVisibilityCheck(urls, isDryRun);
    
    return NextResponse.json({
      success: true,
      summary: generateSummary(results),
      results: results,
      dryRun: isDryRun
    });
    
  } catch (error) {
    logger.error('AI Visibility dry run error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultUrls(): string[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
  return [
    `${baseUrl}/`,
    `${baseUrl}/o/luxucare`,
    `${baseUrl}/o/luxucare/services`,
    `${baseUrl}/o/luxucare/posts`,
    `${baseUrl}/o/luxucare/faq`,
    `${baseUrl}/robots.txt`,
    `${baseUrl}/sitemap.xml`,
  ];
}

async function runAIVisibilityCheck(urls: string[], isDryRun: boolean) {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'GPTBot/1.0 (+https://openai.com/gptbot)',
    'CCBot/2.0 (https://commoncrawl.org/faq/)',
    'PerplexityBot/1.0 (+https://perplexity.ai)',
    'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)'
  ];
  
  const results: any[] = [];
  
  for (const url of urls) {
    for (const userAgent of userAgents) {
      try {
        const result = await checkSingleUrl(url, userAgent, isDryRun);
        results.push(result);
        
        // Rate limiting to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error checking ${url} with ${userAgent}:`, { data: error });
        results.push({
          url,
          userAgent,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  return results;
}

async function checkSingleUrl(url: string, userAgent: string, isDryRun: boolean) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const contentType = response.headers.get('content-type') || '';
    const statusCode = response.status;
    
    let htmlContent = '';
    let analysis: any = {};
    
    if (contentType.includes('text/html') && statusCode === 200) {
      htmlContent = await response.text();
      analysis = analyzeHTML(htmlContent, url);
    }
    
    const severity = determineSeverity(statusCode, analysis, userAgent, url);
    
    return {
      url,
      userAgent: userAgent.split('/')[0], // Extract bot name
      timestamp: new Date().toISOString(),
      statusCode,
      responseTime,
      contentType,
      analysis,
      severity,
      issues: generateIssues(statusCode, analysis, userAgent, url),
      signature: generateContentSignature(htmlContent)
    };
    
  } catch (error) {
    return {
      url,
      userAgent: userAgent.split('/')[0],
      timestamp: new Date().toISOString(),
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      severity: 'P0',
      issues: [`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

function analyzeHTML(html: string, url: string) {
  const analysis: any = {
    hasJsonLd: false,
    jsonLdSchemas: [],
    metaRobots: null,
    canonical: null,
    title: null,
    description: null,
    mainTextLength: 0
  };
  
  // Extract JSON-LD
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    analysis.hasJsonLd = true;
    jsonLdMatches.forEach(match => {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const parsed = JSON.parse(jsonContent);
        if (parsed['@type']) {
          analysis.jsonLdSchemas.push(parsed['@type']);
        }
      } catch (e) {
        // Invalid JSON-LD
      }
    });
  }
  
  // Extract meta robots
  const metaRobotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (metaRobotsMatch) {
    analysis.metaRobots = metaRobotsMatch[1];
  }
  
  // Extract canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    analysis.canonical = canonicalMatch[1];
  }
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    analysis.title = titleMatch[1];
  }
  
  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    analysis.description = descMatch[1];
  }
  
  // Calculate main text length (rough estimate)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  analysis.mainTextLength = textContent.length;
  
  return analysis;
}

function determineSeverity(statusCode: number, analysis: any, userAgent: string, url: string): string {
  // P0: Critical issues that prevent AI indexing
  if (statusCode === 403 || statusCode === 404 || statusCode === 500) {
    return 'P0';
  }
  
  if (statusCode === 429) {
    return 'P0'; // Rate limited
  }
  
  if (analysis.metaRobots && analysis.metaRobots.includes('noindex')) {
    return 'P0';
  }
  
  // P1: Important issues that reduce effectiveness
  if (statusCode !== 200) {
    return 'P1';
  }
  
  if (!analysis.hasJsonLd && url.includes('/o/')) {
    return 'P1'; // Organization pages should have JSON-LD
  }
  
  if (!analysis.canonical) {
    return 'P1';
  }
  
  if (analysis.mainTextLength < 100) {
    return 'P1'; // Too little content
  }
  
  // P2: Minor issues for improvement
  if (!analysis.title || analysis.title.length < 10) {
    return 'P2';
  }
  
  if (!analysis.description || analysis.description.length < 50) {
    return 'P2';
  }
  
  return 'OK';
}

function generateIssues(statusCode: number, analysis: any, userAgent: string, url: string): string[] {
  const issues: string[] = [];
  
  if (statusCode === 403) {
    issues.push('Access forbidden - check robots.txt or middleware blocking');
  }
  
  if (statusCode === 404) {
    issues.push('Page not found');
  }
  
  if (statusCode === 429) {
    issues.push('Rate limited - reduce request frequency');
  }
  
  if (statusCode !== 200 && statusCode !== 403 && statusCode !== 404 && statusCode !== 429) {
    issues.push(`Unexpected status code: ${statusCode}`);
  }
  
  if (analysis.metaRobots && analysis.metaRobots.includes('noindex')) {
    issues.push('Meta robots contains noindex');
  }
  
  if (!analysis.hasJsonLd && url.includes('/o/')) {
    issues.push('Missing JSON-LD structured data');
  }
  
  if (!analysis.canonical) {
    issues.push('Missing canonical URL');
  }
  
  if (analysis.mainTextLength < 100) {
    issues.push('Insufficient text content for AI understanding');
  }
  
  if (!analysis.title) {
    issues.push('Missing page title');
  }
  
  if (!analysis.description) {
    issues.push('Missing meta description');
  }
  
  return issues.map(translateIssue);
}

function generateContentSignature(html: string): string {
  // Generate SHA256 hash of main content for tamper detection
  const content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function generateSummary(results: any[]) {
  const uniqueUrls = new Set<string>();
  const uniqueUserAgents = new Set<string>();
  
  const summary = {
    total: results.length,
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
  
  results.forEach(result => {
    uniqueUrls.add(result.url);
    uniqueUserAgents.add(result.userAgent);
    
    switch (result.severity) {
      case 'P0': summary.p0Issues++; break;
      case 'P1': summary.p1Issues++; break;
      case 'P2': summary.p2Issues++; break;
      default: summary.okChecks++; break;
    }
    
    if (result.responseTime) {
      totalResponseTime += result.responseTime;
    }
    
    if (result.issues) {
      allIssues.push(...result.issues);
    }
  });
  
  summary.avgResponseTime = Math.round(totalResponseTime / results.length);
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

async function saveResults(supabase: any, results: any[]) {
  // Save to ai_visibility_logs table
  for (const result of results) {
    try {
      await supabase
        .from('ai_visibility_logs')
        .insert({
          url: result.url,
          user_agent: result.userAgent,
          status_code: result.statusCode,
          response_time_ms: result.responseTime,
          robots_allowed: result.statusCode !== 403,
          meta_robots: result.analysis?.metaRobots,
          canonical_url: result.analysis?.canonical,
          jsonld_valid: result.analysis?.hasJsonLd,
          jsonld_schemas: result.analysis?.jsonLdSchemas || [],
          jsonld_signature: result.signature,
          severity_level: result.severity,
          issues: result.issues || [],
          environment: process.env.NODE_ENV || 'production'
        });
    } catch (error) {
      logger.error('Error saving result', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }
}

async function sendNotifications(results: any[]) {
  // TODO: Implement Slack notifications
  const summary = generateSummary(results);
  
  if (summary.p0Issues > 0) {
    logger.debug(`🚨 P0 Alert: ${summary.p0Issues} critical issues found`);
    // Send immediate Slack notification
  }
  
  logger.debug(`📊 AI Visibility Summary: P0:${summary.p0Issues} P1:${summary.p1Issues} P2:${summary.p2Issues} OK:${summary.okChecks}`);
}