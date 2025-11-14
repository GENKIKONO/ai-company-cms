import Link from 'next/link';

interface DashboardBackLinkProps {
  href?: string;
  className?: string;
  variant?: 'simple' | 'button';
}

export default function DashboardBackLink({ 
  href = '/dashboard', 
  className = '',
  variant = 'simple'
}: DashboardBackLinkProps) {
  const linkClasses = variant === 'button'
    ? "inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] transition-colors"
    : "text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] inline-flex items-center transition-colors";

  return (
    <div className={`mb-6 ${className}`}>
      <Link href={href} className={linkClasses}>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        ダッシュボードに戻る
      </Link>
    </div>
  );
}