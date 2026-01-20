/**
 * Unit tests for AI Interview Credits Management
 *
 * Tests monthly interview credit limits including:
 * - Plan-based quota limits
 * - Price ID to plan mapping
 * - Usage tracking
 * - Quota exceeded scenarios
 *
 * @jest-environment node
 */

// Mock environment variables before imports
const mockEnvVars: Record<string, string> = {
  STRIPE_TEST_BASIC_PRICE_ID: 'price_test_basic',
  STRIPE_EARLY_BASIC_PRICE_ID: 'price_early_basic',
  STRIPE_NORMAL_BASIC_PRICE_ID: 'price_normal_basic',
  STRIPE_TEST_PRO_PRICE_ID: 'price_test_pro',
  STRIPE_EARLY_PRO_PRICE_ID: 'price_early_pro',
  STRIPE_NORMAL_PRO_PRICE_ID: 'price_normal_pro',
  STRIPE_TEST_BUSINESS_PRICE_ID: 'price_test_business',
  STRIPE_EARLY_BUSINESS_PRICE_ID: 'price_early_business',
  STRIPE_NORMAL_BUSINESS_PRICE_ID: 'price_normal_business',
};

// Set up environment variables
Object.keys(mockEnvVars).forEach((key) => {
  process.env[key] = mockEnvVars[key];
});

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Supabase client
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseIn = jest.fn();
const mockSupabaseGte = jest.fn();
const mockSupabaseLt = jest.fn();
const mockSupabaseIs = jest.fn();
const mockSupabaseOrder = jest.fn();
const mockSupabaseLimit = jest.fn();
const mockSupabaseMaybeSingle = jest.fn();

const createMockChain = () => ({
  select: mockSupabaseSelect.mockReturnThis(),
  eq: mockSupabaseEq.mockReturnThis(),
  in: mockSupabaseIn.mockReturnThis(),
  gte: mockSupabaseGte.mockReturnThis(),
  lt: mockSupabaseLt.mockReturnThis(),
  is: mockSupabaseIs.mockReturnThis(),
  order: mockSupabaseOrder.mockReturnThis(),
  limit: mockSupabaseLimit.mockReturnThis(),
  maybeSingle: mockSupabaseMaybeSingle,
});

const mockSupabase = {
  from: mockSupabaseFrom.mockImplementation(() => createMockChain()),
};

describe('Interview Credits Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Reset mock implementations
    mockSupabaseFrom.mockImplementation(() => createMockChain());
  });

  describe('Plan Limits Configuration', () => {
    it('should have correct monthly limits for each plan', async () => {
      // Import fresh to get the configured limits
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      // These values should match MONTHLY_INTERVIEW_LIMITS
      const expectedLimits = {
        starter: 5,
        pro: 40,
        business: 200,
        enterprise: 500,
      };

      // Test by checking usage results for each plan
      // For starter (no subscription)
      mockSupabaseMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // subscription query
        .mockResolvedValueOnce({ data: null, error: null, count: 0 }); // usage query

      // Reset the mock chain after each query
      mockSupabaseFrom.mockImplementation(() => {
        const chain = createMockChain();
        return chain;
      });

      // Verify starter limit (no active subscription)
      const starterResult = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_starter'
      );
      expect(starterResult.monthlyLimit).toBe(expectedLimits.starter);
    });

    it('should enforce non-unlimited limits for all plans', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      // Setup: No subscription (defaults to starter)
      mockSupabaseMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null, count: 0 });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_test'
      );

      // All limits should be finite positive numbers (no -1 unlimited)
      expect(result.monthlyLimit).toBeGreaterThan(0);
      expect(Number.isFinite(result.monthlyLimit)).toBe(true);
    });
  });

  describe('checkMonthlyQuestionUsage', () => {
    it('should return allowed=true when under limit', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      // Mock: Active subscription with pro plan
      mockSupabaseMaybeSingle
        .mockResolvedValueOnce({
          data: { id: 'sub_1', price_id: 'price_test_pro', status: 'active' },
          error: null,
        });

      // Mock: Current usage is 10 (under pro limit of 40)
      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 10, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { id: 'sub_1', price_id: 'price_test_pro', status: 'active' },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 10, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_test_pro'
      );

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(10);
      expect(result.monthlyLimit).toBe(40); // Pro limit
      expect(result.remainingQuestions).toBe(30);
      expect(result.isExceeded).toBe(false);
    });

    it('should return allowed=false when at limit', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: null, // No subscription = starter
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 5, error: null }), // At starter limit
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_at_limit'
      );

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(5);
      expect(result.monthlyLimit).toBe(5); // Starter limit
      expect(result.remainingQuestions).toBe(0);
      expect(result.isExceeded).toBe(true);
    });

    it('should return allowed=false when over limit', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: null,
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 10, error: null }), // Over starter limit
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_over_limit'
      );

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(10);
      expect(result.monthlyLimit).toBe(5);
      expect(result.remainingQuestions).toBe(0); // Should be 0, not negative
      expect(result.isExceeded).toBe(true);
    });

    it('should default to starter limit for unknown price_id', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: {
                            id: 'sub_unknown',
                            price_id: 'price_unknown_id',
                            status: 'active',
                          },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 0, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_unknown_price'
      );

      // Should fallback to starter limit
      expect(result.monthlyLimit).toBe(5);
    });

    it('should handle subscription fetch error safely', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: null,
                          error: { message: 'Database error', code: '500' },
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_error'
      );

      // Should block on error (safe-side behavior)
      expect(result.allowed).toBe(false);
      expect(result.isExceeded).toBe(true);
    });

    it('should handle exception gracefully', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_exception'
      );

      // Should block on exception (safe-side behavior)
      expect(result.allowed).toBe(false);
      expect(result.isExceeded).toBe(true);
    });
  });

  describe('checkQuestionQuota', () => {
    it('should allow execution when requested questions fit in remaining quota', async () => {
      const { checkQuestionQuota } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { id: 'sub_1', price_id: 'price_test_pro', status: 'active' },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 35, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      // Pro limit is 40, current usage is 35, remaining is 5
      const result = await checkQuestionQuota(mockSupabase as any, 'org_test', 3);

      expect(result.canExecuteAll).toBe(true);
      expect(result.remainingQuestions).toBe(5);
    });

    it('should deny execution when requested questions exceed remaining quota', async () => {
      const { checkQuestionQuota } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { id: 'sub_1', price_id: 'price_test_pro', status: 'active' },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 38, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      // Pro limit is 40, current usage is 38, remaining is 2
      const result = await checkQuestionQuota(mockSupabase as any, 'org_test', 5);

      expect(result.canExecuteAll).toBe(false);
      expect(result.remainingQuestions).toBe(2);
    });
  });

  describe('getOrganizationPlanInfo', () => {
    it('should return complete plan info with usage percentage', async () => {
      const { getOrganizationPlanInfo } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { id: 'sub_1', price_id: 'price_test_business', status: 'active' },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 100, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      // Business limit is 200, current usage is 100
      const result = await getOrganizationPlanInfo(mockSupabase as any, 'org_test');

      expect(result.priceId).toBe('price_test_business');
      expect(result.monthlyLimit).toBe(200);
      expect(result.currentUsage).toBe(100);
      expect(result.remainingQuestions).toBe(100);
      expect(result.usagePercentage).toBe(50);
      expect(result.isExceeded).toBe(false);
    });

    it('should show 100% usage when at limit', async () => {
      const { getOrganizationPlanInfo } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: null,
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 5, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      // Starter limit is 5, current usage is 5
      const result = await getOrganizationPlanInfo(mockSupabase as any, 'org_test');

      expect(result.monthlyLimit).toBe(5);
      expect(result.currentUsage).toBe(5);
      expect(result.usagePercentage).toBe(100);
      expect(result.isExceeded).toBe(true);
    });
  });

  describe('Price ID to Plan Mapping', () => {
    it('should correctly map test environment price IDs', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      const testCases = [
        { priceId: 'price_test_basic', expectedLimit: 5 },
        { priceId: 'price_test_pro', expectedLimit: 40 },
        { priceId: 'price_test_business', expectedLimit: 200 },
      ];

      for (const { priceId, expectedLimit } of testCases) {
        jest.clearAllMocks();

        mockSupabaseFrom.mockImplementation((table: string) => {
          if (table === 'subscriptions') {
            return {
              select: () => ({
                eq: () => ({
                  in: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: () =>
                          Promise.resolve({
                            data: { id: 'sub_1', price_id: priceId, status: 'active' },
                            error: null,
                          }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'ai_interview_sessions') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    gte: () => ({
                      lt: () => ({
                        is: () => Promise.resolve({ count: 0, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return createMockChain();
        });

        const result = await checkMonthlyQuestionUsage(
          mockSupabase as any,
          `org_${priceId}`
        );

        expect(result.monthlyLimit).toBe(expectedLimit);
      }
    });

    it('should correctly map early user price IDs', async () => {
      const { checkMonthlyQuestionUsage } = await import(
        '@/lib/billing/interview-credits'
      );

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { id: 'sub_1', price_id: 'price_early_pro', status: 'active' },
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_interview_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    lt: () => ({
                      is: () => Promise.resolve({ count: 0, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return createMockChain();
      });

      const result = await checkMonthlyQuestionUsage(
        mockSupabase as any,
        'org_early'
      );

      expect(result.monthlyLimit).toBe(40); // Pro limit
    });
  });
});
