// Debug endpoint for session and organization verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    console.log('[whoami] GET handler start');
    
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    console.log('[whoami] cookie names:', cookieNames);
    
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
              console.warn('[whoami] Cookie set error:', error);
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

    console.log('[whoami] user =', user?.id || null, 'error =', authError?.message || null);

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
        
        console.log('[whoami] orgProbe:', orgProbe);
        if (orgError) {
          console.warn('[whoami] org query error:', orgError);
        }
      } catch (error) {
        console.error('[whoami] org probe failed:', error);
      }
    }

    const result = {
      cookieNames: cookieNames.filter(name => name.startsWith('sb-')),
      user: user ? { id: user.id, email: user.email } : null,
      orgProbe,
      timestamp: new Date().toISOString()
    };

    console.log('[whoami] result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[whoami] error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}