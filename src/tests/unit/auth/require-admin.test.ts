/**
 * Unit tests for require-admin.ts
 *
 * Tests the admin authentication guard functions:
 * - checkAdminAuth
 * - requireAdmin
 * - isAuthorized
 *
 * @jest-environment node
 */

import {
  checkAdminAuth,
  requireAdmin,
  isAuthorized,
  AdminAuthResult
} from '@/lib/auth/require-admin';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('require-admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthorized', () => {
    it('should return true for authorized result', () => {
      const result: AdminAuthResult = {
        authorized: true,
        userId: 'test-user-id',
      };
      expect(isAuthorized(result)).toBe(true);
    });

    it('should return false for unauthorized result', () => {
      const result: AdminAuthResult = {
        authorized: false,
        response: {} as any,
      };
      expect(isAuthorized(result)).toBe(false);
    });
  });

  describe('checkAdminAuth', () => {
    it('should return unauthorized when no user session', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: jest.fn(),
      } as any);

      const result = await checkAdminAuth();

      expect(result.isAdmin).toBe(false);
      expect(result.userId).toBeNull();
      expect(result.error?.error_code).toBe('UNAUTHORIZED');
    });

    it('should return unauthorized when auth error', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
        from: jest.fn(),
      } as any);

      const result = await checkAdminAuth();

      expect(result.isAdmin).toBe(false);
      expect(result.userId).toBeNull();
      expect(result.error?.error_code).toBe('UNAUTHORIZED');
    });

    it('should return forbidden when user is not site_admin', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            }),
          }),
        }),
      } as any);

      const result = await checkAdminAuth();

      expect(result.isAdmin).toBe(false);
      expect(result.userId).toBe('user-123');
      expect(result.error?.error_code).toBe('FORBIDDEN');
    });

    it('should return authorized for site_admin user', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com' };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'admin-123' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await checkAdminAuth();

      expect(result.isAdmin).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.error).toBeUndefined();
    });
  });

  describe('requireAdmin', () => {
    it('should return 401 response for unauthenticated user', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: jest.fn(),
      } as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        // Get the response body
        const body = await result.response.json();
        expect(body.error_code).toBe('UNAUTHORIZED');
      }
    });

    it('should return 403 response for non-admin user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      } as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error_code).toBe('FORBIDDEN');
      }
    });

    it('should return authorized result for site_admin', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com' };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'admin-123' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.userId).toBe('admin-123');
      }
    });
  });

  describe('type guard usage', () => {
    it('should narrow type correctly when authorized', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com' };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'admin-123' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const authResult = await requireAdmin();

      if (isAuthorized(authResult)) {
        // TypeScript should know authResult.userId exists here
        expect(authResult.userId).toBe('admin-123');
      } else {
        fail('Expected authorized result');
      }
    });

    it('should narrow type correctly when unauthorized', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: jest.fn(),
      } as any);

      const authResult = await requireAdmin();

      if (!isAuthorized(authResult)) {
        // TypeScript should know authResult.response exists here
        expect(authResult.response).toBeDefined();
      } else {
        fail('Expected unauthorized result');
      }
    });
  });
});
