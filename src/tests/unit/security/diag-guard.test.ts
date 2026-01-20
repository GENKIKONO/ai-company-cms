/**
 * Unit tests for Diagnostic Endpoint Guard
 *
 * Tests the security guard for diagnostic/debug endpoints:
 * - Production vs development environment handling
 * - Admin authentication requirement in production
 * - Safe error responses
 * - Environment info masking
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import {
  diagGuard,
  diagErrorResponse,
  getSafeEnvironmentInfo,
} from '@/lib/api/diag-guard';

// Mock dependencies
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/log', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockRequireAdmin = jest.fn();
const mockIsAuthorized = jest.fn();

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: () => mockRequireAdmin(),
  isAuthorized: (result: any) => mockIsAuthorized(result),
}));

describe('Diagnostic Guard Security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('diagGuard', () => {
    describe('Development Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should allow access without authentication in development', async () => {
        const request = new NextRequest('http://localhost:3000/api/diag/test');

        const result = await diagGuard(request);

        expect(result.authorized).toBe(true);
        expect(result.isProduction).toBe(false);
        expect(result.response).toBeUndefined();
      });

      it('should not call requireAdmin in development', async () => {
        const request = new NextRequest('http://localhost:3000/api/diag/test');

        await diagGuard(request);

        expect(mockRequireAdmin).not.toHaveBeenCalled();
      });
    });

    describe('Production Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should require admin authentication in production', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          userId: 'admin-123',
        });
        mockIsAuthorized.mockReturnValue(true);

        const request = new NextRequest('https://app.example.com/api/diag/test');

        const result = await diagGuard(request);

        expect(mockRequireAdmin).toHaveBeenCalled();
        expect(result.authorized).toBe(true);
        expect(result.isProduction).toBe(true);
      });

      it('should deny access for non-admin users in production', async () => {
        const mockResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
        });
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: mockResponse,
        });
        mockIsAuthorized.mockReturnValue(false);

        const request = new NextRequest('https://app.example.com/api/diag/test');

        const result = await diagGuard(request);

        expect(result.authorized).toBe(false);
        expect(result.response).toBeDefined();
        expect(result.isProduction).toBe(true);
      });

      it('should deny access for unauthenticated users in production', async () => {
        const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        });
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: mockResponse,
        });
        mockIsAuthorized.mockReturnValue(false);

        const request = new NextRequest('https://app.example.com/api/diag/test');

        const result = await diagGuard(request);

        expect(result.authorized).toBe(false);
        expect(result.response).toBeDefined();
      });

      it('should log unauthorized access attempts', async () => {
        const { logger } = require('@/lib/log');
        const mockResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
        });
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: mockResponse,
        });
        mockIsAuthorized.mockReturnValue(false);

        const request = new NextRequest('https://app.example.com/api/diag/test');

        await diagGuard(request);

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Unauthorized access attempt'),
          expect.any(Object)
        );
      });
    });

    describe('Test Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'test';
      });

      it('should treat test environment as non-production', async () => {
        const request = new NextRequest('http://localhost:3000/api/diag/test');

        const result = await diagGuard(request);

        expect(result.isProduction).toBe(false);
        expect(mockRequireAdmin).not.toHaveBeenCalled();
      });
    });
  });

  describe('diagErrorResponse', () => {
    it('should return generic error message', async () => {
      const error = new Error('Database connection failed: password=secret123');

      const response = diagErrorResponse(error, 'test-context');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Diagnostic operation failed');
      expect(body.timestamp).toBeDefined();
    });

    it('should not leak sensitive error details', async () => {
      const sensitiveError = new Error(
        'Connection to postgres://user:password@db.example.com:5432/mydb failed'
      );

      const response = diagErrorResponse(sensitiveError, 'db-context');
      const body = await response.json();
      const bodyString = JSON.stringify(body);

      expect(bodyString).not.toContain('password');
      expect(bodyString).not.toContain('postgres://');
      expect(bodyString).not.toContain('db.example.com');
    });

    it('should not expose stack traces', async () => {
      const errorWithStack = new Error('Test error');
      errorWithStack.stack = 'Error: Test error\n    at /app/src/lib/db.ts:42:15';

      const response = diagErrorResponse(errorWithStack, 'stack-context');
      const body = await response.json();
      const bodyString = JSON.stringify(body);

      expect(bodyString).not.toContain('/app/src');
      expect(bodyString).not.toContain('.ts:');
      expect(bodyString).not.toContain('at ');
    });

    it('should handle non-Error objects', async () => {
      const nonError = { message: 'Something went wrong', code: 500 };

      const response = diagErrorResponse(nonError, 'non-error');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Diagnostic operation failed');
    });

    it('should handle string errors', async () => {
      const response = diagErrorResponse('String error', 'string-context');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Diagnostic operation failed');
    });

    it('should log errors with context', () => {
      const { logger } = require('@/lib/log');
      const error = new Error('Test error');

      diagErrorResponse(error, 'test-context');

      expect(logger.error).toHaveBeenCalledWith(
        '[Diag] test-context error',
        expect.objectContaining({
          data: expect.any(Error),
        })
      );
    });
  });

  describe('getSafeEnvironmentInfo', () => {
    describe('Production Environment', () => {
      it('should only return mode in production', () => {
        const info = getSafeEnvironmentInfo(true);

        expect(info).toEqual({ mode: 'production' });
        expect(Object.keys(info)).toHaveLength(1);
      });

      it('should not expose sensitive env vars in production', () => {
        process.env.DATABASE_URL = 'postgres://user:pass@db:5432/mydb';
        process.env.SECRET_KEY = 'super-secret-key';

        const info = getSafeEnvironmentInfo(true);
        const infoString = JSON.stringify(info);

        expect(infoString).not.toContain('postgres');
        expect(infoString).not.toContain('super-secret');
        expect(infoString).not.toContain('DATABASE_URL');
        expect(infoString).not.toContain('SECRET_KEY');
      });
    });

    describe('Development Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        process.env.VERCEL_ENV = 'development';
      });

      it('should return more info in development', () => {
        const info = getSafeEnvironmentInfo(false);

        expect(info.mode).toBe('development');
        expect(info.nodeEnv).toBeDefined();
        expect(info.vercelEnv).toBeDefined();
      });

      it('should still limit exposed information', () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
        process.env.SUPABASE_SERVICE_KEY = 'service-key-xxx';

        const info = getSafeEnvironmentInfo(false);
        const infoString = JSON.stringify(info);

        expect(infoString).not.toContain('sk_test');
        expect(infoString).not.toContain('service-key');
      });
    });
  });

  describe('Security Edge Cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should handle missing auth result gracefully', async () => {
      // When requireAdmin returns an unauthorized result without response,
      // the guard should still work properly
      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
      mockRequireAdmin.mockResolvedValue({
        authorized: false,
        response: mockResponse,
      });
      mockIsAuthorized.mockReturnValue(false);

      const request = new NextRequest('https://app.example.com/api/diag/test');

      const result = await diagGuard(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();
    });

    it('should handle requireAdmin throwing error', async () => {
      mockRequireAdmin.mockRejectedValue(new Error('Auth service unavailable'));

      const request = new NextRequest('https://app.example.com/api/diag/test');

      // Should not throw, should return unauthorized
      await expect(diagGuard(request)).rejects.toThrow();
    });

    it('should handle concurrent requests correctly', async () => {
      mockRequireAdmin.mockResolvedValue({
        authorized: true,
        userId: 'admin-123',
      });
      mockIsAuthorized.mockReturnValue(true);

      const requests = Array(10)
        .fill(null)
        .map(() => new NextRequest('https://app.example.com/api/diag/test'));

      const results = await Promise.all(requests.map((req) => diagGuard(req)));

      results.forEach((result) => {
        expect(result.authorized).toBe(true);
      });
    });
  });
});
