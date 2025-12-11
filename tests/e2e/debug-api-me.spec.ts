import { test } from '@playwright/test';

test('Debug /api/me response for admin+e2e user', async ({ page }) => {
  const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  
  console.log('🔍 Testing /api/me with enhanced debug logging...');
  
  if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) {
    console.error('❌ Required environment variables not set');
    test.skip();
    return;
  }

  // Login as admin+e2e user
  await page.goto('/auth/signin');
  await page.waitForLoadState('domcontentloaded');
  
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(E2E_ADMIN_EMAIL!);
  
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(E2E_ADMIN_PASSWORD!);
  
  const loginButton = page.locator('button[type="submit"], form button').first();
  await loginButton.waitFor({ state: 'visible', timeout: 10000 });
  await loginButton.click();
  
  try {
    await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    console.log('✅ Login successful');
  } catch {
    console.log('⚠️ Dashboard redirect failed');
  }
  
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Test /api/me with debug logging
  console.log('\n🔄 Testing /api/me...');
  
  const response = await page.request.get('/api/me');
  const status = response.status();
  const responseText = await response.text();
  
  console.log('📡 /api/me Response:');
  console.log(`  Status: ${status}`);
  console.log(`  Raw Response: ${responseText}`);
  
  try {
    const responseBody = JSON.parse(responseText);
    console.log('📋 Parsed Response:');
    console.log(`  errorType: ${responseBody.errorType}`);
    console.log(`  organizations.length: ${responseBody.organizations?.length || 0}`);
    console.log(`  error: ${responseBody.error || 'none'}`);
    console.log(`  user.id: ${responseBody.user?.id}`);
    console.log(`  user.email: ${responseBody.user?.email}`);
  } catch (e) {
    console.log('❌ Failed to parse JSON response');
  }
  
  console.log('\n✅ Debug test completed');
});