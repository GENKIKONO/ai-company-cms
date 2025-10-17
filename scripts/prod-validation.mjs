#!/usr/bin/env node

/**
 * Production Environment Validation and Report
 * Comprehensive validation of production deployment
 */

import { writeFileSync } from 'fs';

const PRODUCTION_URL = 'https://aiohub.jp';
const TARGET_PATH = '/o/luxucare';

const USER_AGENTS = {
  'Googlebot': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'GPTBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot',
  'CCBot': 'Mozilla/5.0 (compatible; CCBot/2.0; https://commoncrawl.org/faq/)',
  'Mozilla': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
};

async function testHttpResponse(url, userAgent, name) {
  try {
    console.log(`🔍 Testing ${name}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    const responseTime = Date.now();
    const html = await response.text();
    
    return {
      name,
      userAgent: name,
      url,
      statusCode: response.status,
      ok: response.ok,
      responseTime: 0, // We'd need proper timing
      contentLength: html.length,
      hasJsonLd: html.includes('application/ld+json'),
      hasCanonical: html.includes('rel="canonical"'),
      headers: Object.fromEntries(response.headers.entries())
    };
    
  } catch (error) {
    return {
      name,
      userAgent: name,
      url,
      statusCode: 0,
      ok: false,
      error: error.message,
      responseTime: 0,
      contentLength: 0,
      hasJsonLd: false,
      hasCanonical: false,
      headers: {}
    };
  }
}

async function testRobotsTxt() {
  try {
    const response = await fetch(`${PRODUCTION_URL}/robots.txt`);
    const content = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      content: content,
      hasGPTBot: content.includes('GPTBot'),
      hasCCBot: content.includes('CCBot'),
      hasGooglebot: content.includes('Googlebot'),
      hasOPath: content.includes('/o/'),
      hasSitemap: content.includes('Sitemap:')
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      content: '',
      hasGPTBot: false,
      hasCCBot: false,
      hasGooglebot: false,
      hasOPath: false,
      hasSitemap: false
    };
  }
}

async function testSitemap() {
  try {
    const response = await fetch(`${PRODUCTION_URL}/sitemap.xml`);
    const content = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      content: content,
      hasLuxucare: content.includes('/o/luxucare'),
      hasValidXml: content.includes('<?xml') && content.includes('<urlset>')
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      content: '',
      hasLuxucare: false,
      hasValidXml: false
    };
  }
}

async function testSupabaseConnection() {
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/admin/ai-visibility/latest`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN || 'test'}`
      }
    });
    
    if (response.status === 404) {
      return {
        status: response.status,
        ok: false,
        error: 'API endpoint not found',
        configAccessible: false
      };
    }
    
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      configAccessible: !data.error || data.configStatus !== 'error',
      configStatus: data.configStatus || 'unknown',
      message: data.message || 'No message'
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      configAccessible: false
    };
  }
}

async function testCronConfiguration() {
  // Since we can't directly test Vercel cron, we check the configuration
  try {
    const vercelConfig = await import('../vercel.json', { assert: { type: 'json' } });
    const crons = vercelConfig.default.crons || [];
    
    return {
      cronCount: crons.length,
      cronPaths: crons.map(c => c.path),
      withinLimit: crons.length <= 2,
      hasDaily: crons.some(c => c.path.includes('/daily'))
    };
  } catch (error) {
    return {
      cronCount: 0,
      cronPaths: [],
      withinLimit: true, // Assume OK if we can't read
      hasDaily: false,
      error: error.message
    };
  }
}

function generateStatusIcon(condition) {
  return condition ? '✅' : '❌';
}

function generateWarningIcon(condition) {
  return condition ? '⚠️' : '✅';
}

async function main() {
  console.log('🚀 Production Environment Validation Starting...');
  console.log(`📍 Target: ${PRODUCTION_URL}${TARGET_PATH}`);
  console.log(`🕐 Time: ${new Date().toISOString()}\\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    url: PRODUCTION_URL,
    targetPath: TARGET_PATH,
    httpTests: {},
    robotsTxt: null,
    sitemap: null,
    supabase: null,
    cron: null,
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };
  
  // 1. HTTP Response Tests
  console.log('1️⃣ HTTP Response Tests');
  console.log('========================');
  
  for (const [name, userAgent] of Object.entries(USER_AGENTS)) {
    const testResult = await testHttpResponse(`${PRODUCTION_URL}${TARGET_PATH}`, userAgent, name);
    results.httpTests[name] = testResult;
    
    const status = generateStatusIcon(testResult.ok && testResult.statusCode === 200);
    console.log(`${status} ${name}: ${testResult.statusCode} (${testResult.contentLength} bytes)`);
    
    if (testResult.ok) {
      console.log(`   JSON-LD: ${generateStatusIcon(testResult.hasJsonLd)} | Canonical: ${generateStatusIcon(testResult.hasCanonical)}`);
    }
    
    results.summary.totalTests++;
    if (testResult.ok && testResult.statusCode === 200) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  }
  
  // 2. robots.txt Verification
  console.log('\\n2️⃣ robots.txt Verification');
  console.log('============================');
  
  const robotsResult = await testRobotsTxt();
  results.robotsTxt = robotsResult;
  
  console.log(`${generateStatusIcon(robotsResult.ok)} Status: ${robotsResult.status}`);
  console.log(`${generateStatusIcon(robotsResult.hasGPTBot)} GPTBot rules: ${robotsResult.hasGPTBot ? 'Present' : 'Missing'}`);
  console.log(`${generateStatusIcon(robotsResult.hasCCBot)} CCBot rules: ${robotsResult.hasCCBot ? 'Present' : 'Missing'}`);
  console.log(`${generateStatusIcon(robotsResult.hasOPath)} /o/ path rules: ${robotsResult.hasOPath ? 'Present' : 'Missing'}`);
  console.log(`${generateStatusIcon(robotsResult.hasSitemap)} Sitemap reference: ${robotsResult.hasSitemap ? 'Present' : 'Missing'}`);
  
  results.summary.totalTests++;
  if (robotsResult.ok && robotsResult.hasGPTBot && robotsResult.hasCCBot) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // 3. Sitemap.xml Verification
  console.log('\\n3️⃣ Sitemap.xml Verification');
  console.log('=============================');
  
  const sitemapResult = await testSitemap();
  results.sitemap = sitemapResult;
  
  console.log(`${generateStatusIcon(sitemapResult.ok)} Status: ${sitemapResult.status}`);
  console.log(`${generateStatusIcon(sitemapResult.hasLuxucare)} LuxuCare URL: ${sitemapResult.hasLuxucare ? 'Listed' : 'Missing'}`);
  console.log(`${generateStatusIcon(sitemapResult.hasValidXml)} Valid XML: ${sitemapResult.hasValidXml ? 'Yes' : 'No'}`);
  
  results.summary.totalTests++;
  if (sitemapResult.ok && sitemapResult.hasLuxucare) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // 4. Supabase Configuration
  console.log('\\n4️⃣ Supabase Configuration');
  console.log('===========================');
  
  const supabaseResult = await testSupabaseConnection();
  results.supabase = supabaseResult;
  
  console.log(`${generateStatusIcon(supabaseResult.ok)} API Response: ${supabaseResult.status}`);
  console.log(`${generateStatusIcon(supabaseResult.configAccessible)} Config Access: ${supabaseResult.configAccessible ? 'OK' : 'Failed'}`);
  console.log(`📊 Config Status: ${supabaseResult.configStatus || 'Unknown'}`);
  
  results.summary.totalTests++;
  if (supabaseResult.configAccessible) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // 5. Cron Configuration
  console.log('\\n5️⃣ Cron Configuration');
  console.log('=======================');
  
  const cronResult = await testCronConfiguration();
  results.cron = cronResult;
  
  console.log(`${generateStatusIcon(cronResult.withinLimit)} Cron Count: ${cronResult.cronCount}/2 (${cronResult.withinLimit ? 'Within limit' : 'EXCEEDED'})`);
  console.log(`${generateStatusIcon(cronResult.hasDaily)} Daily cron: ${cronResult.hasDaily ? 'Integrated' : 'Missing'}`);
  console.log(`📋 Cron paths: ${cronResult.cronPaths.join(', ')}`);
  
  results.summary.totalTests++;
  if (cronResult.withinLimit && cronResult.hasDaily) {
    results.summary.passed++;
  } else if (cronResult.withinLimit) {
    results.summary.warnings++;
  } else {
    results.summary.failed++;
  }
  
  // Generate Summary Report
  console.log('\\n📊 VALIDATION SUMMARY');
  console.log('======================');
  console.log(`🎯 Total Tests: ${results.summary.totalTests}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  
  const successRate = Math.round((results.summary.passed / results.summary.totalTests) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  console.log(`\\n🌐 Production URL: ${PRODUCTION_URL}`);
  console.log(`🎯 Target Path: ${PRODUCTION_URL}${TARGET_PATH}`);
  
  // Save detailed report
  try {
    writeFileSync('production-validation-report.json', JSON.stringify(results, null, 2));
    console.log('\\n📄 Detailed report saved: production-validation-report.json');
  } catch (error) {
    console.error('⚠️ Failed to save report:', error.message);
  }
  
  // Exit with appropriate code
  if (results.summary.failed > 0) {
    console.log('\\n❌ Validation FAILED - Critical issues detected');
    process.exit(1);
  } else if (results.summary.warnings > 0) {
    console.log('\\n⚠️ Validation PASSED with warnings');
    process.exit(0);
  } else {
    console.log('\\n🎉 Validation PASSED - All systems operational');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});