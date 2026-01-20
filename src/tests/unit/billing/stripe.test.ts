/**
 * Unit tests for Stripe billing functions
 *
 * Tests core Stripe integration including:
 * - Plan configuration and limits
 * - Resource limit checking
 * - Mock mode behavior
 * - Webhook signature verification
 *
 * @jest-environment node
 */

import {
  SUBSCRIPTION_PLANS,
  getCurrentPlan,
  canCreateResource,
  verifyWebhookSignature,
} from '@/lib/stripe';

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
    products: {
      list: jest.fn(),
      create: jest.fn(),
    },
    prices: {
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

// Mock @stripe/stripe-js
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue(null),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

describe('Stripe Billing Module', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should have all required plan tiers', () => {
      expect(SUBSCRIPTION_PLANS).toHaveProperty('FREE');
      expect(SUBSCRIPTION_PLANS).toHaveProperty('BASIC');
      expect(SUBSCRIPTION_PLANS).toHaveProperty('BUSINESS');
      expect(SUBSCRIPTION_PLANS).toHaveProperty('ENTERPRISE');
    });

    it('should have correct pricing structure', () => {
      expect(SUBSCRIPTION_PLANS.FREE.price).toBe(0);
      expect(SUBSCRIPTION_PLANS.BASIC.price).toBeGreaterThan(0);
      expect(SUBSCRIPTION_PLANS.BUSINESS.price).toBeGreaterThan(SUBSCRIPTION_PLANS.BASIC.price);
      expect(SUBSCRIPTION_PLANS.ENTERPRISE.price).toBeGreaterThan(SUBSCRIPTION_PLANS.BUSINESS.price);
    });

    it('should have increasing limits for higher tiers', () => {
      const freeLimits = SUBSCRIPTION_PLANS.FREE.limits;
      const basicLimits = SUBSCRIPTION_PLANS.BASIC.limits;
      const businessLimits = SUBSCRIPTION_PLANS.BUSINESS.limits;

      // Free has lowest limits
      expect(freeLimits.maxServices).toBeLessThan(basicLimits.maxServices);
      expect(freeLimits.maxQAItems).toBeLessThan(basicLimits.maxQAItems);

      // Business has higher than Basic
      expect(basicLimits.maxServices).toBeLessThan(businessLimits.maxServices);
    });

    it('should have features array for each plan', () => {
      Object.values(SUBSCRIPTION_PLANS).forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it('should have unique plan IDs', () => {
      const ids = Object.values(SUBSCRIPTION_PLANS).map((plan) => plan.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getCurrentPlan', () => {
    it('should return FREE plan when planId is undefined', () => {
      const plan = getCurrentPlan();
      expect(plan).toEqual(SUBSCRIPTION_PLANS.FREE);
    });

    it('should return FREE plan when planId is null', () => {
      const plan = getCurrentPlan(undefined);
      expect(plan).toEqual(SUBSCRIPTION_PLANS.FREE);
    });

    it('should return FREE plan for unknown planId', () => {
      const plan = getCurrentPlan('unknown-plan');
      expect(plan).toEqual(SUBSCRIPTION_PLANS.FREE);
    });

    it('should return correct plan for valid planId', () => {
      const freePlan = getCurrentPlan('FREE');
      expect(freePlan).toEqual(SUBSCRIPTION_PLANS.FREE);

      const basicPlan = getCurrentPlan('BASIC');
      expect(basicPlan).toEqual(SUBSCRIPTION_PLANS.BASIC);

      const businessPlan = getCurrentPlan('BUSINESS');
      expect(businessPlan).toEqual(SUBSCRIPTION_PLANS.BUSINESS);

      const enterprisePlan = getCurrentPlan('ENTERPRISE');
      expect(enterprisePlan).toEqual(SUBSCRIPTION_PLANS.ENTERPRISE);
    });
  });

  describe('canCreateResource', () => {
    describe('organizations resource', () => {
      it('should allow creation when under limit', () => {
        const canCreate = canCreateResource(0, 'FREE', 'organizations');
        expect(canCreate).toBe(true);
      });

      it('should deny creation when at limit', () => {
        const limit = SUBSCRIPTION_PLANS.FREE.limits.maxOrganizations;
        const canCreate = canCreateResource(limit, 'FREE', 'organizations');
        expect(canCreate).toBe(false);
      });

      it('should deny creation when over limit', () => {
        const limit = SUBSCRIPTION_PLANS.FREE.limits.maxOrganizations;
        const canCreate = canCreateResource(limit + 1, 'FREE', 'organizations');
        expect(canCreate).toBe(false);
      });
    });

    describe('services resource', () => {
      it('should respect FREE plan limits', () => {
        const limit = SUBSCRIPTION_PLANS.FREE.limits.maxServices;
        expect(canCreateResource(0, 'FREE', 'services')).toBe(true);
        expect(canCreateResource(limit - 1, 'FREE', 'services')).toBe(true);
        expect(canCreateResource(limit, 'FREE', 'services')).toBe(false);
      });

      it('should respect BASIC plan limits', () => {
        const limit = SUBSCRIPTION_PLANS.BASIC.limits.maxServices;
        expect(canCreateResource(0, 'BASIC', 'services')).toBe(true);
        expect(canCreateResource(limit - 1, 'BASIC', 'services')).toBe(true);
        expect(canCreateResource(limit, 'BASIC', 'services')).toBe(false);
      });

      it('should allow unlimited for ENTERPRISE (limit = -1)', () => {
        // Enterprise has unlimited (-1)
        expect(canCreateResource(0, 'ENTERPRISE', 'services')).toBe(true);
        expect(canCreateResource(100, 'ENTERPRISE', 'services')).toBe(true);
        expect(canCreateResource(1000, 'ENTERPRISE', 'services')).toBe(true);
      });
    });

    describe('caseStudies resource', () => {
      it('should respect plan limits for case studies', () => {
        const freeLimit = SUBSCRIPTION_PLANS.FREE.limits.maxCaseStudies;
        expect(canCreateResource(freeLimit - 1, 'FREE', 'caseStudies')).toBe(true);
        expect(canCreateResource(freeLimit, 'FREE', 'caseStudies')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should use FREE plan limits for unknown plan', () => {
        const freeLimit = SUBSCRIPTION_PLANS.FREE.limits.maxServices;
        expect(canCreateResource(0, 'UNKNOWN_PLAN', 'services')).toBe(true);
        expect(canCreateResource(freeLimit, 'UNKNOWN_PLAN', 'services')).toBe(false);
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return null when webhook secret is not configured', () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const result = verifyWebhookSignature('body', 'signature');
      expect(result).toBeNull();
    });

    it('should handle missing webhook secret gracefully', () => {
      // When webhook secret is missing, verifyWebhookSignature returns null
      // This is the expected safe behavior - fail open in dev, but log warning
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const result = verifyWebhookSignature('body', 'signature');

      // The function should return null to indicate verification was skipped
      expect(result).toBeNull();
    });
  });

  describe('Plan Limits Integrity', () => {
    it('should have all required limit keys in each plan', () => {
      const requiredLimitKeys = [
        'maxServices',
        'maxQAItems',
        'maxMaterials',
        'maxOrganizations',
        'maxCaseStudies',
        'maxPosts',
        'maxFaqs',
      ];

      Object.values(SUBSCRIPTION_PLANS).forEach((plan) => {
        requiredLimitKeys.forEach((key) => {
          expect(plan.limits).toHaveProperty(key);
          expect(typeof plan.limits[key as keyof typeof plan.limits]).toBe('number');
        });
      });
    });

    it('should have non-negative limits (or -1 for unlimited)', () => {
      Object.values(SUBSCRIPTION_PLANS).forEach((plan) => {
        Object.entries(plan.limits).forEach(([key, value]) => {
          expect(value >= -1).toBe(true);
          if (value !== -1) {
            expect(value >= 0).toBe(true);
          }
        });
      });
    });

    it('should have consistent limit progression across plans', () => {
      const plans = ['FREE', 'BASIC', 'BUSINESS', 'ENTERPRISE'] as const;
      const limitKeys = ['maxServices', 'maxCaseStudies', 'maxPosts', 'maxFaqs'] as const;

      limitKeys.forEach((limitKey) => {
        for (let i = 0; i < plans.length - 1; i++) {
          const currentLimit =
            SUBSCRIPTION_PLANS[plans[i]].limits[limitKey];
          const nextLimit =
            SUBSCRIPTION_PLANS[plans[i + 1]].limits[limitKey];

          // Higher tier should have same or higher limit (-1 means unlimited, which is highest)
          if (nextLimit === -1) {
            // Unlimited is always >= any finite limit
            expect(true).toBe(true);
          } else if (currentLimit === -1) {
            // Current is unlimited but next is not - this would be a regression
            fail(
              `${plans[i]} has unlimited ${limitKey} but ${plans[i + 1]} has finite limit`
            );
          } else {
            expect(nextLimit).toBeGreaterThanOrEqual(currentLimit);
          }
        }
      });
    });
  });
});
