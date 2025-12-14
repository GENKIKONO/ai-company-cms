/**
 * Analytics API Smoke Test
 * Tests that analytics APIs return appropriate responses without 500 errors
 */

import { test, expect } from '@playwright/test';

test.describe('Analytics API Smoke Tests', () => {
  const testOrgId = '00000000-0000-4000-8000-000000000000'; // Valid UUID format

  test('AI visibility API should return 200 with fallback for missing tables', async ({ request }) => {
    const response = await request.get(`/api/analytics/ai/visibility?organization_id=${testOrgId}`);
    
    // Should return 200 (fail-open)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('organization_id');
    expect(data).toHaveProperty('overall_score');
    expect(data).toHaveProperty('score_trend');
    expect(data).toHaveProperty('content_scores');
    expect(data).toHaveProperty('summary');
    
    // Check if fallback mode
    if (data.is_fallback) {
      expect(data.fallback_reason).toBe('MISSING_TABLE');
      expect(data.score_trend).toHaveLength(0);
      expect(data.content_scores).toHaveLength(0);
    }
  });

  test('AI bot logs API should return 200 with fallback for missing tables', async ({ request }) => {
    const response = await request.get(`/api/analytics/ai/bot-logs?organization_id=${testOrgId}`);
    
    // Should return 200 (fail-open)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('logs');
    expect(data).toHaveProperty('total_count');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.logs)).toBeTruthy();
    
    // Check if fallback mode
    if (data.is_fallback) {
      expect(data.fallback_reason).toBe('MISSING_TABLE');
      expect(data.logs).toHaveLength(0);
      expect(data.total_count).toBe(0);
    }
  });

  test('Dashboard stats API should not return 500', async ({ request }) => {
    const response = await request.get(`/api/dashboard/stats?organizationId=${testOrgId}`);
    
    // Should not return 500 server error
    expect(response.status()).not.toBe(500);
    
    // Should return valid status codes
    expect([200, 400, 401, 403, 404].includes(response.status())).toBeTruthy();
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('ok');
      expect(data).toHaveProperty('counts');
      expect(data).toHaveProperty('analytics');
    }
  });
});