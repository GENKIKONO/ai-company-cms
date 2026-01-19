/**
 * Unit tests for error-responses.ts
 *
 * Tests the standardized API error response utilities
 *
 * @jest-environment node
 */

import { ZodError, z } from 'zod';
import {
  createErrorResponse,
  unauthorizedError,
  forbiddenError,
  validationError,
  conflictError,
  notFoundError,
  rateLimitError,
  handleZodError,
  handleDatabaseError,
  handleApiError,
} from '@/lib/api/error-responses';

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('error-responses', () => {
  describe('createErrorResponse', () => {
    it('should create response with correct structure', async () => {
      const response = createErrorResponse('TEST_ERROR', 'Test message', 400, { extra: 'data' });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('TEST_ERROR');
      expect(body.error.message).toBe('Test message');
      expect(body.error.details).toEqual({ extra: 'data' });
      expect(body.error.timestamp).toBeDefined();
    });
  });

  describe('unauthorizedError', () => {
    it('should return 401 with default message', async () => {
      const response = unauthorizedError();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('ログインしてください');
    });

    it('should return 401 with custom message', async () => {
      const response = unauthorizedError('Custom auth message');
      const body = await response.json();

      expect(body.error.message).toBe('Custom auth message');
    });
  });

  describe('forbiddenError', () => {
    it('should return 403 with default message', async () => {
      const response = forbiddenError();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Insufficient permissions');
    });
  });

  describe('validationError', () => {
    it('should return 400 with validation details', async () => {
      const details = [{ field: 'email', message: 'Invalid format' }];
      const response = validationError(details);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual(details);
    });
  });

  describe('conflictError', () => {
    it('should return 409 with resource info', async () => {
      const response = conflictError('Organization', 'slug');
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.message).toBe('Organization with this slug already exists');
      expect(body.error.details).toEqual({ resource: 'Organization', field: 'slug' });
    });

    it('should return 409 without field', async () => {
      const response = conflictError('User');
      const body = await response.json();

      expect(body.error.message).toBe('User already exists');
    });
  });

  describe('notFoundError', () => {
    it('should return 404 with resource info', async () => {
      const response = notFoundError('Organization');
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Organization not found');
    });
  });

  describe('rateLimitError', () => {
    it('should return 429', async () => {
      const response = rateLimitError();
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('handleZodError', () => {
    it('should convert ZodError to validation response', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      try {
        schema.parse({ name: '', email: 'not-an-email' });
        fail('Should have thrown');
      } catch (error) {
        if (error instanceof ZodError) {
          const response = handleZodError(error);
          const body = await response.json();

          expect(response.status).toBe(400);
          expect(body.error.code).toBe('VALIDATION_ERROR');
          expect(Array.isArray(body.error.details)).toBe(true);
          expect(body.error.details.length).toBe(2);
        }
      }
    });

    it('should provide Japanese error messages for known fields', async () => {
      const schema = z.object({
        name: z.string().min(1),
      });

      try {
        schema.parse({ name: '' });
        fail('Should have thrown');
      } catch (error) {
        if (error instanceof ZodError) {
          const response = handleZodError(error);
          const body = await response.json();

          const nameError = body.error.details.find((d: any) => d.field === 'name');
          expect(nameError.message).toBe('企業名を入力してください');
        }
      }
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle unique constraint violation', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key (slug)=(test-slug) already exists',
      };

      const response = handleDatabaseError(dbError);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error.code).toBe('CONFLICT');
    });

    it('should handle foreign key violation', async () => {
      const dbError = {
        code: '23503',
        message: 'Foreign key violation',
      };

      const response = handleDatabaseError(dbError);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('FOREIGN_KEY_VIOLATION');
    });

    it('should handle generic database error', async () => {
      const dbError = {
        code: '99999',
        message: 'Unknown error',
      };

      const response = handleDatabaseError(dbError);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('handleApiError', () => {
    it('should handle ZodError', async () => {
      const schema = z.object({ name: z.string() });
      try {
        schema.parse({});
      } catch (error) {
        const response = handleApiError(error);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle database error', async () => {
      const dbError = { code: '23505' };
      const response = handleApiError(dbError);
      const body = await response.json();

      expect(body.error.code).toBe('CONFLICT');
    });

    it('should handle Error instance', async () => {
      const error = new Error('Something went wrong');
      const response = handleApiError(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Something went wrong');
    });

    it('should handle unknown error', async () => {
      const response = handleApiError('string error');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
