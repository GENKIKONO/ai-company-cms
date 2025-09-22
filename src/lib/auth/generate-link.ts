import { supabaseAdmin } from '@/lib/supabase-server';

interface GenerateLinkParams {
  email: string;
  type: 'signup' | 'magiclink';
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
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
  
  try {
    console.info({
      event: 'auth_link_generating',
      type,
      email,
      redirectTo,
      requestId,
      timestamp: new Date().toISOString()
    });

    const admin = supabaseAdmin();
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
      console.error({
        event: 'auth_link_error',
        type,
        email,
        requestId,
        error: error.message || error,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        requestId,
        error: error.message || 'Failed to generate auth link'
      };
    }

    console.info({
      event: 'auth_link_generated',
      type,
      email,
      requestId,
      hasUrl: !!data?.properties?.action_link,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      requestId,
      url: data?.properties?.action_link
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error({
      event: 'auth_link_error',
      type,
      email,
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      requestId,
      error: errorMessage
    };
  }
}