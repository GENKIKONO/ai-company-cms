import { test, expect } from "@playwright/test";

// Explicit timeout for all operations
const HTTP_TIMEOUT = 10_000;
const PAGE_TIMEOUT = 15_000;

// E2E test user configuration (from setup-e2e-user.js)
const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';

test("Bot logs API with E2E endpoint (no UI login)", async ({ request }) => {
  // Set test timeout to avoid hanging
  test.setTimeout(60_000);

  // Fail-fast environment checks
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3099';
  console.log(`🌐 Using base URL: ${baseURL}`);
  
  // Check admin token (required for E2E endpoint)
  const RLS_ADMIN_TOKEN = process.env.RLS_REGRESSION_ADMIN_TOKEN;
  
  // Explicit fail if no authentication method available
  if (!RLS_ADMIN_TOKEN || RLS_ADMIN_TOKEN.trim() === '') {
    throw new Error(
      'AUTHENTICATION REQUIRED: Missing RLS_REGRESSION_ADMIN_TOKEN. ' +
      'Set RLS_REGRESSION_ADMIN_TOKEN environment variable to proceed.'
    );
  }

  let authMethod = 'E2E_TOKEN_AUTH';
  let realOrgId = '';

  try {
    // Use E2E endpoint to get user + organization data (bypass UI login)
    console.log(`🔑 Authenticating with ${authMethod}`);
    
    const meResponse = await request.get(
      `/api/test/e2e-me?user_id=${E2E_USER_ID}`,
      {
        headers: {
          'x-rls-regression-admin-token': RLS_ADMIN_TOKEN
        },
        timeout: HTTP_TIMEOUT
      }
    );
    
    if (meResponse.status() === 401 || meResponse.status() === 403) {
      throw new Error(`❌ E2E /api/test/e2e-me authentication failed: ${meResponse.status()}`);
    }
    
    if (meResponse.status() !== 200) {
      const errorBody = await meResponse.text().catch(() => 'Unable to read response');
      throw new Error(`❌ E2E /api/test/e2e-me returned ${meResponse.status()}: ${errorBody}`);
    }
    
    const contentType = meResponse.headers()['content-type'];
    if (!contentType?.includes('application/json')) {
      throw new Error(`❌ E2E /api/test/e2e-me returned non-JSON content-type: ${contentType}`);
    }
    
    const meBody = await meResponse.json();
    if (!meBody.organizations || !Array.isArray(meBody.organizations) || meBody.organizations.length === 0) {
      throw new Error(`❌ E2E /api/test/e2e-me missing organizations: ${JSON.stringify(meBody)}`);
    }
    
    realOrgId = meBody.organizations[0].id;
    if (!realOrgId) {
      throw new Error(`❌ Empty organization ID from E2E endpoint: ${JSON.stringify(meBody.organizations[0])}`);
    }
    
    console.log(`📋 Retrieved organization ID from E2E endpoint: ${realOrgId}`);

    // Test bot-logs API with real organization ID and explicit timeout
    console.log(`🤖 Testing bot-logs API with org_id: ${realOrgId}`);
    
    const botLogsResponse = await request.get(
      `/api/analytics/ai/bot-logs?organization_id=${realOrgId}&limit=10`,
      {
        headers: {
          'x-rls-regression-admin-token': RLS_ADMIN_TOKEN
        },
        timeout: HTTP_TIMEOUT
      }
    );
    
    const botLogsStatus = botLogsResponse.status();
    console.log(`📊 Bot logs API status: ${botLogsStatus}`);
    
    // Fail-fast: Check if it's 500 
    if (botLogsStatus === 500) {
      const errorBody = await botLogsResponse.text().catch(() => 'Unable to read error response');
      throw new Error(`❌ Bot logs API returned 500: ${errorBody}`);
    }
    
    // Check content-type (should be JSON, not HTML)
    const botLogsContentType = botLogsResponse.headers()['content-type'];
    if (!botLogsContentType?.includes('application/json')) {
      const responsePreview = await botLogsResponse.text().catch(() => 'Unable to read response');
      throw new Error(`❌ Bot logs API returned HTML instead of JSON. Content-Type: ${botLogsContentType}. Response preview: ${responsePreview.substring(0, 200)}`);
    }
    
    // Parse JSON response
    const botLogsBody = await botLogsResponse.json();
    
    // Validate JSON structure (even if empty)
    if (botLogsStatus === 200) {
      if (!botLogsBody.hasOwnProperty('logs')) {
        throw new Error(`❌ Bot logs API missing 'logs' property: ${JSON.stringify(botLogsBody)}`);
      }
      if (!Array.isArray(botLogsBody.logs)) {
        throw new Error(`❌ Bot logs API 'logs' is not an array: ${JSON.stringify(botLogsBody.logs)}`);
      }
      if (!botLogsBody.hasOwnProperty('total_count') || typeof botLogsBody.total_count !== 'number') {
        throw new Error(`❌ Bot logs API missing/invalid 'total_count': ${JSON.stringify(botLogsBody)}`);
      }
      if (!botLogsBody.hasOwnProperty('pagination')) {
        throw new Error(`❌ Bot logs API missing 'pagination': ${JSON.stringify(botLogsBody)}`);
      }
      
      console.log(`✅ Bot logs API returned valid structure: ${botLogsBody.logs.length} logs, total_count: ${botLogsBody.total_count}`);
    }
    
    console.log(`✅ Bot logs test passed with ${authMethod}`);
    
  } catch (error) {
    // Ensure any error is immediately visible
    console.error(`❌ Bot logs test failed with ${authMethod}:`, error);
    throw error;
  }
});