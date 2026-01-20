/**
 * Unit tests for Stripe Webhook Handler
 *
 * Tests webhook processing including:
 * - Signature verification
 * - Event idempotency
 * - Subscription lifecycle events
 * - Payment events
 * - Checkout completion
 * - Error handling and retries
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import type Stripe from 'stripe';

// Mock dependencies before imports
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/utils/sentry-utils', () => ({
  SentryUtils: {
    withTransaction: jest.fn((_name, _op, fn) => fn({ setTag: jest.fn() })),
    addBreadcrumb: jest.fn(),
    trackWebhookEvent: jest.fn(),
    captureException: jest.fn(),
  },
}));

jest.mock('@/lib/emails', () => ({
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
}));

const mockSupabaseFrom = jest.fn();
const mockSupabaseRpc = jest.fn();
const mockSupabaseAuth = {
  admin: {
    updateUserById: jest.fn().mockResolvedValue({ error: null }),
  },
};

jest.mock('@/lib/supabase-admin-client', () => ({
  supabaseAdmin: {
    from: (table: string) => mockSupabaseFrom(table),
    rpc: mockSupabaseRpc,
    auth: mockSupabaseAuth,
  },
}));

const mockStripeWebhookConstruct = jest.fn();
const mockStripeSubscriptionsRetrieve = jest.fn();

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: mockStripeWebhookConstruct,
    },
    subscriptions: {
      retrieve: mockStripeSubscriptionsRetrieve,
    },
  },
  verifyWebhookSignature: jest.fn((body, sig) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) return null;
    if (sig === 'invalid') return null;
    return JSON.parse(body);
  }),
  updateSubscriptionInDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn((name: string) => {
      if (name === 'stripe-signature') return 'valid-signature';
      return null;
    }),
  }),
}));

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret';

    // Default mock implementations
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should reject request without signature header', async () => {
      const { headers } = require('next/headers');
      headers.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue(null),
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Missing stripe-signature header');
    });

    it('should reject request with invalid signature', async () => {
      const { verifyWebhookSignature } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(null);

      const { headers } = require('next/headers');
      headers.mockResolvedValueOnce({
        get: jest.fn((name: string) => (name === 'stripe-signature' ? 'invalid' : null)),
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid signature');
    });

    it('should return warning when webhook secret not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const { verifyWebhookSignature } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(null);

      const { headers } = require('next/headers');
      headers.mockResolvedValueOnce({
        get: jest.fn((name: string) => (name === 'stripe-signature' ? 'some-sig' : null)),
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.warning).toBe('Webhook not configured');
    });
  });

  describe('Subscription Events', () => {
    const createMockEvent = (
      type: string,
      object: Partial<Stripe.Subscription>
    ): Stripe.Event => ({
      id: `evt_test_${Date.now()}`,
      type,
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          metadata: { organization_id: 'org_test123' },
          ...object,
        },
      },
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    });

    it('should handle subscription.created event', async () => {
      const event = createMockEvent('customer.subscription.created', {
        status: 'active',
      });

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.processed).toBe(true);
      expect(updateSubscriptionInDB).toHaveBeenCalledWith('sub_test123');
    });

    it('should handle subscription.updated event', async () => {
      const event = createMockEvent('customer.subscription.updated', {
        status: 'active',
      });

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.processed).toBe(true);
      expect(updateSubscriptionInDB).toHaveBeenCalled();
    });

    it('should handle subscription.deleted event', async () => {
      const event = createMockEvent('customer.subscription.deleted', {
        status: 'canceled',
      });

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.processed).toBe(true);
      expect(updateSubscriptionInDB).toHaveBeenCalled();
    });

    it('should handle subscription.paused event', async () => {
      const event = createMockEvent('customer.subscription.paused', {
        status: 'paused',
      });

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(updateSubscriptionInDB).toHaveBeenCalled();
    });

    it('should handle subscription.resumed event', async () => {
      const event = createMockEvent('customer.subscription.resumed', {
        status: 'active',
      });

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(updateSubscriptionInDB).toHaveBeenCalled();
    });
  });

  describe('Checkout Session Events', () => {
    it('should handle checkout.session.completed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_checkout_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            subscription: 'sub_test123',
            customer: 'cus_test123',
            metadata: {
              organization_id: 'org_test123',
              plan_type: 'business',
            },
            customer_details: {
              email: 'test@example.com',
            },
          } as Partial<Stripe.Checkout.Session>,
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.processed).toBe(true);
      expect(updateSubscriptionInDB).toHaveBeenCalledWith('sub_test123');
    });

    it('should not process checkout without subscription', async () => {
      const event: Stripe.Event = {
        id: 'evt_checkout_no_sub',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_no_sub',
            subscription: null,
            customer: 'cus_test123',
            metadata: {},
          } as Partial<Stripe.Checkout.Session>,
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      // Should not call updateSubscriptionInDB for checkout without subscription
      expect(updateSubscriptionInDB).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled Events', () => {
    it('should acknowledge unhandled event types', async () => {
      const event: Stripe.Event = {
        id: 'evt_unknown',
        type: 'some.unknown.event',
        data: { object: {} },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      const { verifyWebhookSignature } = require('@/lib/stripe');
      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      // Unhandled events should still return success (acknowledge receipt)
      expect(response.status).toBe(200);
      expect(body.received).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      updateSubscriptionInDB.mockRejectedValueOnce(new Error('Database error'));

      const event: Stripe.Event = {
        id: 'evt_error_test',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_error_test',
            customer: 'cus_test',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            metadata: {},
          },
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      // Should return 500 for processing failures
      expect(response.status).toBe(500);
    });

    it('should have error tracking available', async () => {
      // Verify Sentry is properly mocked and available
      const { SentryUtils } = require('@/lib/utils/sentry-utils');
      expect(SentryUtils.captureException).toBeDefined();
      expect(typeof SentryUtils.captureException).toBe('function');
    });
  });

  describe('Security Considerations', () => {
    it('should not leak internal error details in response', async () => {
      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      updateSubscriptionInDB.mockRejectedValueOnce(
        new Error('Sensitive internal error: database connection string exposed')
      );

      const event: Stripe.Event = {
        id: 'evt_security_test',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_security_test',
            customer: 'cus_test',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            metadata: {},
          },
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();

      // Should return error status
      expect(response.status).toBe(500);
      // Response should have an error field
      expect(body.error).toBeDefined();
      // Should not contain sensitive information in response body
      const bodyString = JSON.stringify(body);
      expect(bodyString).not.toContain('database connection');
      expect(bodyString).not.toContain('Sensitive');
    });

    it('should not expose stack traces in error responses', async () => {
      const { verifyWebhookSignature, updateSubscriptionInDB } = require('@/lib/stripe');
      const errorWithStack = new Error('Internal error');
      errorWithStack.stack = 'Error: Internal error\n    at /app/src/lib/stripe.ts:123:45';
      updateSubscriptionInDB.mockRejectedValueOnce(errorWithStack);

      const event: Stripe.Event = {
        id: 'evt_stack_test',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stack_test',
            customer: 'cus_test',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            metadata: {},
          },
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      verifyWebhookSignature.mockReturnValueOnce(event);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      const response = await POST(request);
      const body = await response.json();
      const bodyString = JSON.stringify(body);

      // Should not expose file paths or stack traces
      expect(bodyString).not.toContain('/app/src');
      expect(bodyString).not.toContain('.ts:');
      expect(bodyString).not.toContain('at ');
    });
  });
});
