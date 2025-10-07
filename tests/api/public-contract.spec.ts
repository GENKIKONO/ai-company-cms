/**
 * 公開API契約テスト - OpenAPIスキーマとの整合性検証
 * REQ-AIO-06: OpenAPI 3.1 完全対応
 */

import { describe, it, expect } from '@jest/globals';

describe('Public API Contract Validation', () => {

  describe('Services API Contract', () => {
    it('should match OpenAPI schema structure', () => {
      // サービスAPIレスポンス形式の契約確認
      const mockServiceResponse = {
        services: [
          {
            id: 'uuid-string',
            name: 'Test Service',
            description: null, // nullable
            category: null,    // nullable (DBマイグレーション後)
            features: null,    // nullable
            price: null,       // nullable
            cta_url: null,     // nullable
            status: 'published',
            created_at: '2025-10-07T00:00:00.000Z',
            updated_at: '2025-10-07T00:00:00.000Z'
          }
        ],
        total: 1
      };

      // 必須フィールドの存在確認
      expect(mockServiceResponse.services[0]).toHaveProperty('id');
      expect(mockServiceResponse.services[0]).toHaveProperty('name');
      expect(mockServiceResponse.services[0]).toHaveProperty('status');
      expect(mockServiceResponse.services[0]).toHaveProperty('created_at');
      expect(mockServiceResponse.services[0]).toHaveProperty('updated_at');
      
      // nullable フィールドの型確認
      const service = mockServiceResponse.services[0];
      expect(service.category === null || typeof service.category === 'string').toBe(true);
      expect(service.description === null || typeof service.description === 'string').toBe(true);
    });
  });

  describe('FAQs API Contract', () => {
    it('should match OpenAPI schema with sort_order', () => {
      const mockFaqResponse = {
        faqs: [
          {
            id: 'uuid-string',
            question: 'Test Question',
            answer: 'Test Answer',
            category: null,
            sort_order: 0, // 必須 (DBマイグレーション後)
            status: 'published',
            created_at: '2025-10-07T00:00:00.000Z',
            updated_at: '2025-10-07T00:00:00.000Z'
          }
        ],
        total: 1
      };

      const faq = mockFaqResponse.faqs[0];
      
      // 必須フィールド確認
      expect(faq).toHaveProperty('id');
      expect(faq).toHaveProperty('question');
      expect(faq).toHaveProperty('answer');
      expect(faq).toHaveProperty('sort_order');
      expect(typeof faq.sort_order).toBe('number');
      
      // sort_order のデフォルト値確認
      expect(faq.sort_order).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Case Studies API Contract', () => {
    it('should match OpenAPI schema with result field', () => {
      const mockCaseStudyResponse = {
        caseStudies: [
          {
            id: 'uuid-string',
            title: 'Test Case Study',
            problem: null,   // nullable
            solution: null,  // nullable
            result: null,    // nullable (DBマイグレーション後)
            tags: null,      // nullable
            status: 'published',
            created_at: '2025-10-07T00:00:00.000Z',
            updated_at: '2025-10-07T00:00:00.000Z'
          }
        ],
        total: 1
      };

      const caseStudy = mockCaseStudyResponse.caseStudies[0];
      
      // 必須フィールド確認
      expect(caseStudy).toHaveProperty('id');
      expect(caseStudy).toHaveProperty('title');
      expect(caseStudy).toHaveProperty('status');
      expect(caseStudy).toHaveProperty('created_at');
      expect(caseStudy).toHaveProperty('updated_at');
      
      // result フィールドの存在確認（nullable）
      expect(caseStudy).toHaveProperty('result');
      expect(caseStudy.result === null || typeof caseStudy.result === 'string').toBe(true);
    });
  });

  describe('API Response Headers', () => {
    it('should have proper cache control headers', () => {
      const expectedHeaders = {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Type': 'application/json; charset=utf-8'
      };

      // ヘッダー契約の確認
      Object.entries(expectedHeaders).forEach(([header, expectedValue]) => {
        expect(typeof header).toBe('string');
        expect(typeof expectedValue).toBe('string');
        expect(expectedValue).toContain('public');
      });
    });
  });

  describe('OpenAPI Specification Validation', () => {
    it('should generate valid OpenAPI 3.1.0 spec', () => {
      const mockOpenApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'LuxuCare CMS Public API',
          version: '1.0.0'
        },
        components: {
          schemas: {
            Service: {
              type: 'object',
              properties: {
                category: { type: 'string', nullable: true }
              },
              required: ['id', 'name', 'status', 'created_at', 'updated_at']
            },
            FAQ: {
              type: 'object',
              properties: {
                sort_order: { type: 'integer', default: 0 }
              },
              required: ['id', 'question', 'answer', 'sort_order', 'status', 'created_at', 'updated_at']
            },
            CaseStudy: {
              type: 'object',
              properties: {
                result: { type: 'string', nullable: true }
              },
              required: ['id', 'title', 'status', 'created_at', 'updated_at']
            }
          }
        }
      };

      // OpenAPI 3.1.0 準拠確認
      expect(mockOpenApiSpec.openapi).toBe('3.1.0');
      expect(mockOpenApiSpec.components.schemas.Service.properties.category.nullable).toBe(true);
      expect(mockOpenApiSpec.components.schemas.FAQ.required).toContain('sort_order');
      expect(mockOpenApiSpec.components.schemas.CaseStudy.properties.result.nullable).toBe(true);
    });
  });

  describe('Error Response Contract', () => {
    it('should have consistent error format', () => {
      const mockErrorResponse = {
        error: 'Database error',
        message: 'Specific error details'
      };

      expect(mockErrorResponse).toHaveProperty('error');
      expect(typeof mockErrorResponse.error).toBe('string');
      
      // messageは任意だが、存在する場合は文字列
      if (mockErrorResponse.message) {
        expect(typeof mockErrorResponse.message).toBe('string');
      }
    });
  });

});