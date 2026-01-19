/**
 * Public Contract Security Tests
 *
 * These tests ensure that sensitive data is never leaked through public APIs.
 * If any of these tests fail, it means the public contract has been violated
 * and sensitive data may be exposed to the public internet.
 */

import {
  ORGANIZATION_BLOCKED_COLUMNS,
  ORGANIZATION_PUBLIC_COLUMNS,
  sanitizeOrganization,
  sanitizeObject,
} from '@/lib/public-contract';

// ============================================
// [A] BLOCKLIST Defense Tests
// ============================================

describe('ORGANIZATION_BLOCKED_COLUMNS', () => {
  describe('must contain critical security-sensitive columns', () => {
    it('blocks user identification: created_by', () => {
      expect(ORGANIZATION_BLOCKED_COLUMNS).toContain('created_by');
    });

    it('blocks user identification: user_id', () => {
      expect(ORGANIZATION_BLOCKED_COLUMNS).toContain('user_id');
    });

    it('blocks internal feature control: feature_flags', () => {
      expect(ORGANIZATION_BLOCKED_COLUMNS).toContain('feature_flags');
    });

    it('blocks billing information: plan', () => {
      expect(ORGANIZATION_BLOCKED_COLUMNS).toContain('plan');
    });

    it('blocks billing information: plan_id', () => {
      expect(ORGANIZATION_BLOCKED_COLUMNS).toContain('plan_id');
    });
  });

  it('is a non-empty readonly array', () => {
    expect(Array.isArray(ORGANIZATION_BLOCKED_COLUMNS)).toBe(true);
    expect(ORGANIZATION_BLOCKED_COLUMNS.length).toBeGreaterThan(0);
  });
});

// ============================================
// [B] sanitizeOrganization Behavior Tests
// ============================================

describe('sanitizeOrganization', () => {
  describe('removes all blocked columns from output', () => {
    it('removes created_by even if present in input', () => {
      const input = { id: '1', name: 'Test', created_by: 'user-123' };
      const output = sanitizeOrganization(input);

      expect(output).not.toHaveProperty('created_by');
    });

    it('removes user_id even if present in input', () => {
      const input = { id: '1', name: 'Test', user_id: 'user-456' };
      const output = sanitizeOrganization(input);

      expect(output).not.toHaveProperty('user_id');
    });

    it('removes feature_flags even if present in input', () => {
      const input = { id: '1', name: 'Test', feature_flags: { beta: true } };
      const output = sanitizeOrganization(input);

      expect(output).not.toHaveProperty('feature_flags');
    });

    it('removes plan even if present in input', () => {
      const input = { id: '1', name: 'Test', plan: 'enterprise' };
      const output = sanitizeOrganization(input);

      expect(output).not.toHaveProperty('plan');
    });

    it('removes plan_id even if present in input', () => {
      const input = { id: '1', name: 'Test', plan_id: 'plan_xyz' };
      const output = sanitizeOrganization(input);

      expect(output).not.toHaveProperty('plan_id');
    });

    it('removes ALL blocked columns when multiple are present', () => {
      const input = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        // All blocked columns
        created_by: 'user-123',
        user_id: 'user-456',
        plan: 'enterprise',
        plan_id: 'plan_xyz',
        discount_group: 'vip',
        original_signup_campaign: 'launch2024',
        entitlements: ['feature1'],
        trial_end: '2025-12-31',
        feature_flags: { beta: true },
        partner_id: 'partner-789',
        data_status: 'verified',
        verified_by: 'admin-001',
        verified_at: '2024-01-01',
        verification_source: 'manual',
        content_hash: 'abc123',
        source_urls: ['https://example.com'],
        archived: false,
        deleted_at: null,
        keywords: ['test'],
      };

      const output = sanitizeOrganization(input);

      // Verify ALL blocked columns are removed
      for (const blockedKey of ORGANIZATION_BLOCKED_COLUMNS) {
        expect(output).not.toHaveProperty(blockedKey);
      }
    });
  });

  describe('preserves allowed columns', () => {
    it('keeps id in output', () => {
      const input = { id: 'org-123', name: 'Test' };
      const output = sanitizeOrganization(input);

      expect(output).toHaveProperty('id', 'org-123');
    });

    it('keeps name in output', () => {
      const input = { id: '1', name: 'My Organization' };
      const output = sanitizeOrganization(input);

      expect(output).toHaveProperty('name', 'My Organization');
    });

    it('keeps slug in output', () => {
      const input = { id: '1', name: 'Test', slug: 'my-org' };
      const output = sanitizeOrganization(input);

      expect(output).toHaveProperty('slug', 'my-org');
    });

    it('keeps all public metadata fields', () => {
      const input = {
        id: '1',
        name: 'Test',
        description: 'A test organization',
        url: 'https://example.com',
        logo_url: 'https://example.com/logo.png',
        is_published: true,
      };
      const output = sanitizeOrganization(input);

      expect(output).toHaveProperty('description', 'A test organization');
      expect(output).toHaveProperty('url', 'https://example.com');
      expect(output).toHaveProperty('logo_url', 'https://example.com/logo.png');
      expect(output).toHaveProperty('is_published', true);
    });
  });

  describe('does not mutate original input', () => {
    it('returns a new object, leaving input unchanged', () => {
      const input = { id: '1', name: 'Test', created_by: 'user-123' };
      const inputCopy = { ...input };

      sanitizeOrganization(input);

      expect(input).toEqual(inputCopy);
      expect(input).toHaveProperty('created_by', 'user-123');
    });
  });
});

// ============================================
// [C] Regression Prevention Tests
// ============================================

describe('ALLOWLIST vs BLOCKLIST consistency', () => {
  /**
   * CRITICAL: This test detects human error where someone accidentally
   * adds a blocked column to the public columns allowlist.
   *
   * If this test fails, it means ORGANIZATION_PUBLIC_COLUMNS contains
   * a column that should NEVER be exposed publicly.
   */
  it('ORGANIZATION_PUBLIC_COLUMNS must NOT contain any blocked column', () => {
    const publicColumnsString = ORGANIZATION_PUBLIC_COLUMNS.toLowerCase();

    for (const blockedColumn of ORGANIZATION_BLOCKED_COLUMNS) {
      // Check if the blocked column appears as a word boundary in the allowlist
      // Using regex to avoid false positives (e.g., "user_id" vs "user_identifier")
      const regex = new RegExp(`\\b${blockedColumn}\\b`, 'i');
      const containsBlockedColumn = regex.test(publicColumnsString);

      expect(containsBlockedColumn).toBe(false);
    }
  });

  it('blocked columns list is not accidentally empty', () => {
    expect(ORGANIZATION_BLOCKED_COLUMNS.length).toBeGreaterThanOrEqual(10);
  });

  it('public columns string is not accidentally empty', () => {
    expect(ORGANIZATION_PUBLIC_COLUMNS.trim().length).toBeGreaterThan(0);
  });
});

// ============================================
// Generic sanitizeObject Tests
// ============================================

describe('sanitizeObject', () => {
  it('removes specified keys from any object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const blocked = ['b', 'c'] as const;

    const result = sanitizeObject(obj, blocked);

    expect(result).toEqual({ a: 1 });
    expect(result).not.toHaveProperty('b');
    expect(result).not.toHaveProperty('c');
  });

  it('handles empty blocklist gracefully', () => {
    const obj = { a: 1, b: 2 };
    const blocked: readonly string[] = [];

    const result = sanitizeObject(obj, blocked);

    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('handles object with no blocked keys gracefully', () => {
    const obj = { x: 1, y: 2 };
    const blocked = ['a', 'b', 'c'] as const;

    const result = sanitizeObject(obj, blocked);

    expect(result).toEqual({ x: 1, y: 2 });
  });
});
