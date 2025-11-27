import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { APP_URL } from '@/lib/utils/env';

import { logger } from '@/lib/log';
interface GenerateLinkParams {
  email: string;
  type: 'signup' | 'magiclink' | 'recovery';
  requestId?: string;
}

interface GenerateLinkResult {
  success: boolean;
  requestId: string;
  url?: string;
  error?: string;
}

export async function generateAuthLink({
  email,
  type,
  requestId = crypto.randomUUID()
}: GenerateLinkParams): Promise<GenerateLinkResult> {
  // Unified redirectTo based on auth type
  const redirectTo = type === 'recovery' 
    ? `${APP_URL}/auth/reset-password-confirm`
    : `${APP_URL}/auth/confirm`;
  
  try {
    logger.info('auth_link_generating', {
      data: {
        type,
        email,
        redirectTo,
        requestId,
        timestamp: new Date().toISOString()
      }
    });

    const admin = supabaseAdmin;
    let data, error;
    
    if (type === 'signup') {
      // For signup confirmation, use 'confirmation' type instead
      const result = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password: 'temp-password-for-link-generation',
        options: {
          redirectTo: redirectTo
        }
      });
      data = result.data;
      error = result.error;
    } else if (type === 'recovery') {
      const result = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: redirectTo
        }
      });
      data = result.data;
      error = result.error;
    } else {
      const result = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: redirectTo
        }
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('auth_link_error', {
        data: {
          type,
          email,
          requestId,
          error: error.message || error,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: false,
        requestId,
        error: error.message || 'Failed to generate auth link'
      };
    }

    logger.info('auth_link_generated', {
      data: {
        type,
        email,
        requestId,
        hasUrl: !!data?.properties?.action_link,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      requestId,
      url: data?.properties?.action_link
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    logger.error('auth_link_error', {
      data: {
        type,
        email,
        requestId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: false,
      requestId,
      error: errorMessage
    };
  }
}