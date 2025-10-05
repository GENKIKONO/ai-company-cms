import { headers } from 'next/headers';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function serverFetch(path: string, init: RequestInit = {}) {
  const url = new URL(path, BASE).toString();
  const reqHeaders = await headers();
  const cookie = reqHeaders.get('cookie') ?? '';
  
  return fetch(url, { 
    ...init, 
    headers: { 
      ...(init.headers || {}), 
      cookie 
    }, 
    cache: 'no-store' 
  });
}