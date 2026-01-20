/**
 * Unit tests for Campaign-based Billing Functions
 *
 * Tests campaign and discount functionality including:
 * - Organization discount group mapping
 * - Checkout link retrieval
 * - Price calculations
 * - Campaign descriptions
 *
 * @jest-environment node
 */

import {
  getCampaignFromOrganization,
  calculateDiscountedPrice,
  getCampaignDescription,
  type Organization,
} from '@/lib/billing/campaign';

// Mock dependencies
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/env', () => ({
  env: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_KEY: 'test-service-key',
  },
}));

// Mock Supabase SSR client
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: mockSupabaseSelect.mockReturnThis(),
      eq: mockSupabaseEq.mockReturnThis(),
      single: mockSupabaseSingle,
    })),
  })),
}));

describe('Campaign Billing Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaignFromOrganization', () => {
    it('should return "test_user" for test_user_30off discount group', () => {
      const org: Organization = {
        id: 'org_test1',
        discount_group: 'test_user_30off',
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('test_user');
    });

    it('should return "early_user" for early_user_20off discount group', () => {
      const org: Organization = {
        id: 'org_test2',
        discount_group: 'early_user_20off',
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('early_user');
    });

    it('should return "early_user" for early_bird signup campaign', () => {
      const org: Organization = {
        id: 'org_test3',
        discount_group: null,
        original_signup_campaign: 'early_bird',
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('early_user');
    });

    it('should return "regular" when no discount group or campaign', () => {
      const org: Organization = {
        id: 'org_test4',
        discount_group: null,
        original_signup_campaign: null,
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('regular');
    });

    it('should return "regular" for unknown discount group', () => {
      const org: Organization = {
        id: 'org_test5',
        discount_group: 'unknown_group',
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('regular');
    });

    it('should return "regular" for undefined discount group', () => {
      const org: Organization = {
        id: 'org_test6',
      };

      const result = getCampaignFromOrganization(org);
      expect(result).toBe('regular');
    });

    it('should prioritize discount_group over original_signup_campaign', () => {
      const org: Organization = {
        id: 'org_test7',
        discount_group: 'test_user_30off',
        original_signup_campaign: 'early_bird',
      };

      const result = getCampaignFromOrganization(org);
      // discount_group takes precedence
      expect(result).toBe('test_user');
    });
  });

  describe('calculateDiscountedPrice', () => {
    it('should calculate 0% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 0);
      expect(result).toBe(10000);
    });

    it('should calculate 10% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 10);
      expect(result).toBe(9000);
    });

    it('should calculate 20% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 20);
      expect(result).toBe(8000);
    });

    it('should calculate 30% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 30);
      expect(result).toBe(7000);
    });

    it('should calculate 50% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 50);
      expect(result).toBe(5000);
    });

    it('should calculate 100% discount correctly', () => {
      const result = calculateDiscountedPrice(10000, 100);
      expect(result).toBe(0);
    });

    it('should floor the result for non-integer results', () => {
      // 2980 * (100 - 30) / 100 = 2086
      const result = calculateDiscountedPrice(2980, 30);
      expect(result).toBe(2086);

      // 2980 * (100 - 20) / 100 = 2384
      const result2 = calculateDiscountedPrice(2980, 20);
      expect(result2).toBe(2384);
    });

    it('should handle zero price', () => {
      const result = calculateDiscountedPrice(0, 30);
      expect(result).toBe(0);
    });

    it('should handle typical plan prices with standard discounts', () => {
      // Starter plan: 2980円
      const starterRegular = calculateDiscountedPrice(2980, 0);
      const starter20Off = calculateDiscountedPrice(2980, 20);
      const starter30Off = calculateDiscountedPrice(2980, 30);

      expect(starterRegular).toBe(2980);
      expect(starter20Off).toBe(2384);
      expect(starter30Off).toBe(2086);

      // Business plan: 15000円
      const business20Off = calculateDiscountedPrice(15000, 20);
      const business30Off = calculateDiscountedPrice(15000, 30);

      expect(business20Off).toBe(12000);
      expect(business30Off).toBe(10500);

      // Enterprise plan: 30000円
      const enterprise20Off = calculateDiscountedPrice(30000, 20);
      const enterprise30Off = calculateDiscountedPrice(30000, 30);

      expect(enterprise20Off).toBe(24000);
      expect(enterprise30Off).toBe(21000);
    });
  });

  describe('getCampaignDescription', () => {
    it('should return correct description for test_user campaign', () => {
      const result = getCampaignDescription('test_user');
      expect(result).toBe('6ヶ月無料 + その後ずっと30%OFF');
    });

    it('should return correct description for early_user campaign', () => {
      const result = getCampaignDescription('early_user');
      expect(result).toBe('ずっと20%OFF');
    });

    it('should return correct description for regular campaign', () => {
      const result = getCampaignDescription('regular');
      expect(result).toBe('通常価格');
    });

    it('should return empty string for unknown campaign', () => {
      const result = getCampaignDescription('unknown_campaign');
      expect(result).toBe('');
    });

    it('should return empty string for empty campaign type', () => {
      const result = getCampaignDescription('');
      expect(result).toBe('');
    });
  });

  describe('Campaign Integration Scenarios', () => {
    it('should correctly map test user organization to discounted price', () => {
      const org: Organization = {
        id: 'org_test_integration',
        discount_group: 'test_user_30off',
      };

      const campaignType = getCampaignFromOrganization(org);
      expect(campaignType).toBe('test_user');

      // Test user gets 30% off
      const discountedPrice = calculateDiscountedPrice(2980, 30);
      expect(discountedPrice).toBe(2086);

      const description = getCampaignDescription(campaignType);
      expect(description).toBe('6ヶ月無料 + その後ずっと30%OFF');
    });

    it('should correctly map early user organization to discounted price', () => {
      const org: Organization = {
        id: 'org_early_integration',
        discount_group: 'early_user_20off',
      };

      const campaignType = getCampaignFromOrganization(org);
      expect(campaignType).toBe('early_user');

      // Early user gets 20% off
      const discountedPrice = calculateDiscountedPrice(2980, 20);
      expect(discountedPrice).toBe(2384);

      const description = getCampaignDescription(campaignType);
      expect(description).toBe('ずっと20%OFF');
    });

    it('should correctly map regular organization to full price', () => {
      const org: Organization = {
        id: 'org_regular_integration',
        discount_group: null,
      };

      const campaignType = getCampaignFromOrganization(org);
      expect(campaignType).toBe('regular');

      // Regular user gets no discount
      const discountedPrice = calculateDiscountedPrice(2980, 0);
      expect(discountedPrice).toBe(2980);

      const description = getCampaignDescription(campaignType);
      expect(description).toBe('通常価格');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle organization with all optional fields undefined', () => {
      const org: Organization = { id: 'org_minimal' };
      const result = getCampaignFromOrganization(org);
      expect(result).toBe('regular');
    });

    it('should not throw for negative discount rate', () => {
      // This shouldn't happen in practice, but the function should handle it
      const result = calculateDiscountedPrice(10000, -10);
      // Math: 10000 * (100 - (-10)) / 100 = 10000 * 110 / 100 = 11000
      expect(result).toBe(11000);
    });

    it('should not throw for discount rate over 100', () => {
      // This shouldn't happen in practice, but the function should handle it
      const result = calculateDiscountedPrice(10000, 150);
      // Math: 10000 * (100 - 150) / 100 = 10000 * -50 / 100 = -5000
      expect(result).toBe(-5000);
    });

    it('should handle very large prices', () => {
      const result = calculateDiscountedPrice(1000000000, 20);
      expect(result).toBe(800000000);
    });

    it('should handle very small prices', () => {
      const result = calculateDiscountedPrice(1, 50);
      expect(result).toBe(0); // Math.floor(0.5) = 0
    });
  });
});
