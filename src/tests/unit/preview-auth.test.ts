/**
 * Preview Auth Boundary Tests
 *
 * Tests the pure function decidePreviewAccess to ensure
 * preview authentication boundary is strictly enforced.
 *
 * Security invariants tested:
 * - preview=true WITHOUT auth header → 401 UNAUTHORIZED
 * - preview=true WITH invalid token → 401 UNAUTHORIZED
 * - preview=true WITH valid token but non-owner → 403 FORBIDDEN
 * - preview=true WITH valid token AND owner → ok:true
 * - preview=false (normal access) → ok:true (no additional auth required)
 */

import { decidePreviewAccess, PreviewAccessInput, PreviewAuthResult } from '@/lib/public/preview-access';

describe('decidePreviewAccess', () => {
  // ─────────────────────────────────────────
  // [1] preview=true + hasAuthHeader=false → 401
  // ─────────────────────────────────────────
  describe('[1] preview=true WITHOUT auth header', () => {
    it('returns 401 UNAUTHORIZED', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: false,
        tokenValid: false,
        isOwner: false,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns 401 even if tokenValid and isOwner are true (header takes precedence)', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: false,
        tokenValid: true,  // Would be valid, but no header
        isOwner: true,     // Would be owner, but no header
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.code).toBe('UNAUTHORIZED');
      }
    });
  });

  // ─────────────────────────────────────────
  // [2] preview=true + hasAuthHeader=true + tokenValid=false → 401
  // ─────────────────────────────────────────
  describe('[2] preview=true WITH auth header BUT invalid token', () => {
    it('returns 401 UNAUTHORIZED', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: true,
        tokenValid: false,
        isOwner: false,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns 401 even if isOwner is true (token validation takes precedence)', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: true,
        tokenValid: false,
        isOwner: true,  // Logically impossible, but test defense-in-depth
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
      }
    });
  });

  // ─────────────────────────────────────────
  // [3] preview=true + hasAuthHeader=true + tokenValid=true + isOwner=false → 403
  // ─────────────────────────────────────────
  describe('[3] preview=true WITH valid token BUT non-owner', () => {
    it('returns 403 FORBIDDEN', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: true,
        tokenValid: true,
        isOwner: false,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.code).toBe('FORBIDDEN');
      }
    });
  });

  // ─────────────────────────────────────────
  // [4] preview=true + hasAuthHeader=true + tokenValid=true + isOwner=true → ok:true
  // ─────────────────────────────────────────
  describe('[4] preview=true WITH valid token AND owner', () => {
    it('returns ok:true', () => {
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: true,
        tokenValid: true,
        isOwner: true,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // [5] preview=false（通常アクセス）→ ok:true
  // ─────────────────────────────────────────
  describe('[5] Normal access (preview=false)', () => {
    it('returns ok:true regardless of auth state', () => {
      const input: PreviewAccessInput = {
        preview: false,
        hasAuthHeader: false,
        tokenValid: false,
        isOwner: false,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(true);
    });

    it('returns ok:true even with auth provided (auth is optional for normal access)', () => {
      const input: PreviewAccessInput = {
        preview: false,
        hasAuthHeader: true,
        tokenValid: true,
        isOwner: true,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // Additional edge cases
  // ─────────────────────────────────────────
  describe('Edge cases and defense-in-depth', () => {
    it('401 is returned before 403 (auth header check is first)', () => {
      // Even if somehow isOwner=false, lack of auth header should be 401 not 403
      const input: PreviewAccessInput = {
        preview: true,
        hasAuthHeader: false,
        tokenValid: true,
        isOwner: false,
      };

      const result = decidePreviewAccess(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
      }
    });

    it('returns correct code string for UNAUTHORIZED', () => {
      const result = decidePreviewAccess({
        preview: true,
        hasAuthHeader: false,
        tokenValid: false,
        isOwner: false,
      }) as { ok: false; status: number; code: string };

      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('returns correct code string for FORBIDDEN', () => {
      const result = decidePreviewAccess({
        preview: true,
        hasAuthHeader: true,
        tokenValid: true,
        isOwner: false,
      }) as { ok: false; status: number; code: string };

      expect(result.code).toBe('FORBIDDEN');
    });
  });
});
