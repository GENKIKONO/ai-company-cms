import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function LoginRedirect() {
  // 301 permanent redirect to canonical login URL
  redirect('/auth/login');
}