import { redirect } from 'next/navigation';

/**
 * Legacy route - redirects to dashboard interview
 * @see docs/architecture/boundaries.md
 */
export default function ServiceInterviewerPage() {
  redirect('/dashboard/interview');
}
