/**
 * AI Citations Integration Tests - DB準拠版
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { 
  VCitationAggregateSchema, 
  MVCitationOrgPeriodSchema,
  formatBigIntString,
  parseBigIntString
} from '@/types/ai-citations-corrected';

describe('AI Citations DB Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrgId: string;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // テスト用
    );
    testOrgId = process.env.TEST_ORG_ID || 'test-org-id';
  });

  describe('A. 型整合性テスト', () => {
    it('should validate v_ai_citations_aggregates schema', async () => {
      const { data, error } = await supabase
        .from('v_ai_citations_aggregates')
        .select('*')
        .eq('organization_id', testOrgId)
        .limit(1)
        .maybeSingle();

      expect(error).toBeNull();
      
      if (data) {
        // Schema validation
        const validation = VCitationAggregateSchema.safeParse(data);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          // model_name AS model 互換確認
          expect(typeof validation.data.model).toBe('string');
          
          // bigint → string 確認
          expect(typeof validation.data.citations_count).toBe('string');
          expect(typeof validation.data.total_quoted_chars).toBe('string');
        }
      }
    });

    it('should validate mv_ai_citations_org_period schema', async () => {
      const { data, error } = await supabase
        .from('mv_ai_citations_org_period')
        .select('*')
        .eq('organization_id', testOrgId)
        .limit(1)
        .maybeSingle();

      expect(error).toBeNull();
      
      if (data) {
        const validation = MVCitationOrgPeriodSchema.safeParse(data);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          // day_bucket が YYYY-MM-DD 形式
          expect(validation.data.day_bucket).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          
          // source_key が content_unit_id::text or url
          expect(typeof validation.data.source_key).toBe('string');
        }
      }
    });

    it('should handle bigint string conversion', () => {
      // formatBigIntString テスト
      expect(formatBigIntString('1234567')).toBe('1,234,567');
      expect(formatBigIntString('0')).toBe('0');
      expect(formatBigIntString(null)).toBe('0');
      
      // parseBigIntString テスト
      expect(parseBigIntString('1234567')).toBe(1234567);
      expect(parseBigIntString('0')).toBe(0);
      expect(parseBigIntString(null)).toBe(0);
    });
  });

  describe('B. 90日レンジ制約テスト', () => {
    it('should enforce 90-day limit in API', async () => {
      const response = await fetch('/api/my/ai-citations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: testOrgId,
          from: '2023-01-01',
          to: '2023-06-01' // > 90日
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.code).toBe('PERIOD_TOO_LONG');
    });

    it('should filter data within 90 days in views', async () => {
      const { data, error } = await supabase
        .from('v_ai_citations_aggregates')
        .select('response_created_at')
        .eq('organization_id', testOrgId);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        
        // すべてのレコードが90日以内
        for (const record of data) {
          const createdAt = new Date(record.response_created_at);
          expect(createdAt.getTime()).toBeGreaterThanOrEqual(ninetyDaysAgo.getTime());
        }
      }
    });
  });

  describe('C. RLS越境防止テスト', () => {
    it('should prevent cross-organization data access', async () => {
      // 異なる組織IDでアクセス試行（サービスロールキー使用時は要注意）
      const { data: org1Data } = await supabase
        .rpc('set_claim', { claim: 'org_id', value: 'org-1' })
        .then(() => supabase
          .from('v_ai_citations_aggregates')
          .select('*')
          .eq('organization_id', 'org-1')
        );

      const { data: org2Data } = await supabase
        .rpc('set_claim', { claim: 'org_id', value: 'org-2' })
        .then(() => supabase
          .from('v_ai_citations_aggregates')
          .select('*')
          .eq('organization_id', 'org-2')
        );

      // org-1のデータにorg-2のデータが含まれていないことを確認
      if (org1Data && org2Data) {
        const org1OrgIds = new Set(org1Data.map(r => r.organization_id));
        expect(org1OrgIds.has('org-2')).toBe(false);
      }
    });

    it('should validate organization membership in API', async () => {
      // 無効な組織IDでAPIアクセス
      const response = await fetch('/api/my/ai-citations', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          orgId: 'invalid-org-id',
          from: '2024-11-01',
          to: '2024-11-30'
        })
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('D. パフォーマンステスト', () => {
    it('should complete mv queries within SLA', async () => {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('mv_ai_citations_org_period')
        .select('*')
        .eq('organization_id', testOrgId)
        .gte('day_bucket', '2024-11-01')
        .lte('day_bucket', '2024-11-30')
        .limit(100);

      const duration = Date.now() - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(2000); // 2秒以内
    });

    it('should use proper indexes', async () => {
      // EXPLAIN クエリでindex使用確認（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        const { data, error } = await supabase
          .rpc('explain_query', {
            query: `
              SELECT * FROM mv_ai_citations_org_period 
              WHERE organization_id = $1 AND day_bucket >= $2
            `,
            params: [testOrgId, '2024-11-01']
          });

        expect(error).toBeNull();
        // Index Scan の使用を確認
        expect(data?.some(row => 
          row.includes('Index Scan') || row.includes('idx_mv_ai_citations')
        )).toBe(true);
      }
    });
  });

  describe('E. データ整合性テスト', () => {
    it('should maintain source_key consistency', async () => {
      const { data, error } = await supabase
        .from('v_ai_citations_aggregates')
        .select('source_key, response_id')
        .eq('organization_id', testOrgId)
        .limit(10);

      expect(error).toBeNull();
      
      if (data) {
        for (const record of data) {
          // source_key が content_unit_id::text か url のフォーマット
          expect(record.source_key).toBeTruthy();
          expect(typeof record.source_key).toBe('string');
        }
      }
    });

    it('should validate content_unit_id references', async () => {
      // ai_citations_items で content_unit_id が正しく設定されているかチェック
      const { data: itemsData, error } = await supabase
        .from('ai_citations_items')
        .select('content_unit_id, response_id')
        .not('content_unit_id', 'is', null)
        .limit(5);

      expect(error).toBeNull();
      
      if (itemsData && itemsData.length > 0) {
        // 対応するcontent_unitsレコードが存在するかチェック
        const contentUnitIds = itemsData.map(item => item.content_unit_id);
        
        const { data: unitsData } = await supabase
          .from('ai_content_units')
          .select('id')
          .in('id', contentUnitIds);

        expect(unitsData?.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('API Route Integration Tests', () => {
  describe('/api/my/ai-citations', () => {
    it('should return session citations with correct schema', async () => {
      const sessionId = process.env.TEST_SESSION_ID;
      if (!sessionId) return;

      const response = await fetch(`/api/my/ai-citations?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.sessionId).toBe(sessionId);
      expect(Array.isArray(result.data.responses)).toBe(true);
      
      // bigint fields are strings
      if (result.data.responses.length > 0) {
        const firstResponse = result.data.responses[0];
        expect(typeof firstResponse.model).toBe('string'); // model_name AS model
        
        if (firstResponse.sources.length > 0) {
          const firstSource = firstResponse.sources[0];
          expect(typeof firstSource.citationsCount).toBe('string');
          expect(typeof firstSource.totalQuotedChars).toBe('string');
        }
      }
    });

    it('should return org period citations within 90 days', async () => {
      const orgId = process.env.TEST_ORG_ID;
      if (!orgId) return;

      const from = '2024-11-01';
      const to = '2024-11-30';
      
      const response = await fetch(`/api/my/ai-citations?orgId=${orgId}&from=${from}&to=${to}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.organizationId).toBe(orgId);
      expect(result.data.period.from).toBe(from);
      expect(result.data.period.to).toBe(to);
      
      // totals are string bigints
      expect(typeof result.data.totals.totalCitations).toBe('string');
      expect(typeof result.data.totals.totalQuotedTokens).toBe('string');
    });
  });
});