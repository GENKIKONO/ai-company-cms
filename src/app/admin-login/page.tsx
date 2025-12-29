import { redirect } from 'next/navigation';

/**
 * Legacy route - redirects to new location
 *
 * @see docs/architecture/boundaries.md
 */
export default function AdminLoginRedirect() {
  redirect('/auth/admin-login');
}
