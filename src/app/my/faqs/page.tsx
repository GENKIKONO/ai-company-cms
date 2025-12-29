import { redirect } from 'next/navigation';

/**
 * Legacy route - redirects to dashboard
 * @see docs/architecture/boundaries.md
 */
export default function MyFAQsPage() {
  redirect('/dashboard/faqs');
}
