import { redirect } from 'next/navigation';

/**
 * Legacy route - redirects to canonical AI reports page
 * @see docs/architecture/boundaries.md
 * @see PR6: Reports Area Consolidation
 */
export default function MyReportsPage() {
  redirect('/dashboard/ai-reports');
}
