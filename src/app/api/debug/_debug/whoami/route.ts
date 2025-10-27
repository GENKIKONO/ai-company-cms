// Debug endpoint for session and organization verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              logger.warn('Debug whoami cookie set error', error);
            }
          },
        },
      }
    );

    // ユーザー取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // User info logged for debug purposes only in development
    logger.debug('Whoami user check', { userId: user?.id, authError: authError?.message });

    // 組織の存在確認（RLS回避のため直接クエリ）
    let orgProbe = { found: false, id: null, created_by: null };
    
    if (user) {
      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, created_by')
          .eq('created_by', user.id)
          .limit(1)
          .maybeSingle();
          
        if (orgData) {
          orgProbe = {
            found: true,
            id: orgData.id,
            created_by: orgData.created_by
          };
        }
        
        if (orgError) {
          logger.warn('Whoami org query error', orgError);
        }
      } catch (error) {
        logger.error('Whoami org probe failed', error instanceof Error ? error : new Error(String(error)));
      }
    }

    const result = {
      cookieNames: cookieNames.filter(name => name.startsWith('sb-')),
      user: user ? { id: user.id, email: user.email } : null,
      orgProbe,
      timestamp: new Date().toISOString()
    };

    logger.debug('Whoami result', result);

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Whoami endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}