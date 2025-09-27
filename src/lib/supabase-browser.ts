'use client';

import { createBrowserClient } from '@supabase/ssr';

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => {
          if (typeof document !== 'undefined') {
            const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
            return match ? decodeURIComponent(match[2]) : undefined;
          }
          return undefined;
        },
        set: (key, value, options) => {
          if (typeof document !== 'undefined') {
            const isProduction = process.env.NODE_ENV === 'production';
            const domain = isProduction && process.env.NEXT_PUBLIC_APP_URL?.includes('aiohub.jp') 
              ? '.aiohub.jp' 
              : undefined;
            
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: isProduction,
              domain,
              path: '/',
            };
            
            const cookieString = `${key}=${encodeURIComponent(value)}; ${Object.entries(cookieOptions)
              .filter(([_, v]) => v !== undefined && v !== false)
              .map(([k, v]) => v === true ? k : `${k}=${v}`)
              .join('; ')}`;
            
            document.cookie = cookieString;
          }
        },
        remove: (key, options) => {
          if (typeof document !== 'undefined') {
            const isProduction = process.env.NODE_ENV === 'production';
            const domain = isProduction && process.env.NEXT_PUBLIC_APP_URL?.includes('aiohub.jp')
              ? '.aiohub.jp'
              : undefined;
              
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: isProduction,
              domain,
              path: '/',
              maxAge: 0,
              expires: new Date(0),
            };
            
            const cookieString = `${key}=; ${Object.entries(cookieOptions)
              .filter(([_, v]) => v !== undefined && v !== false)
              .map(([k, v]) => v === true ? k : `${k}=${v}`)
              .join('; ')}`;
            
            document.cookie = cookieString;
          }
        },
      },
    }
  );
}

export default supabaseBrowser;