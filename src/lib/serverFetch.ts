const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export async function serverFetch(path: string, init: RequestInit = {}, cookieString?: string) {
  const url = new URL(path, BASE).toString();
  
  // サーバー側の場合、Cookieを動的に取得
  let cookie = cookieString || '';
  if (typeof window === 'undefined' && !cookieString) {
    try {
      const { headers } = await import('next/headers');
      const reqHeaders = await headers();
      cookie = reqHeaders.get('cookie') ?? '';
    } catch {
      // Client側またはheadersが取得できない場合は空文字
      cookie = '';
    }
  }
  
  return fetch(url, { 
    ...init, 
    headers: { 
      ...(init.headers || {}), 
      ...(cookie ? { cookie } : {}),
    }, 
    cache: 'no-store' 
  });
}