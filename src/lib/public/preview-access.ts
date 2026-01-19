/**
 * Preview Access Decision Logic
 *
 * Pure function to determine preview access authorization.
 * Extracted from route handler for testability.
 *
 * Security invariants:
 * - preview=true requires valid auth + owner permission
 * - Missing auth header → 401
 * - Invalid token → 401
 * - Valid token but non-owner → 403
 */

export type PreviewAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; code: 'UNAUTHORIZED' | 'FORBIDDEN' };

export interface PreviewAccessInput {
  preview: boolean;
  hasAuthHeader: boolean;
  tokenValid: boolean;
  isOwner: boolean;
}

/**
 * Decide whether preview access should be granted.
 *
 * This function handles ONLY the preview-specific authorization logic.
 * For normal (non-preview) access, it always returns ok:true,
 * leaving the "published-only" filtering to the caller.
 *
 * @param input - The authorization context
 * @returns PreviewAuthResult indicating access decision
 */
export function decidePreviewAccess(input: PreviewAccessInput): PreviewAuthResult {
  const { preview, hasAuthHeader, tokenValid, isOwner } = input;

  // Non-preview access: no additional auth required
  if (!preview) {
    return { ok: true };
  }

  // Preview mode: strict authentication required

  // Step 1: Auth header must be present
  if (!hasAuthHeader) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED' };
  }

  // Step 2: Token must be valid (user exists)
  if (!tokenValid) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED' };
  }

  // Step 3: User must be organization owner
  if (!isOwner) {
    return { ok: false, status: 403, code: 'FORBIDDEN' };
  }

  // All checks passed
  return { ok: true };
}
