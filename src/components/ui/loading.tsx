/**
 * Loading UI Components
 * P3-8: Admin Metrics Dashboard用のローディングコンポーネント
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading..."
      >
        <span className="sr-only">読み込み中...</span>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title, description, className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
      {title && (
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      )}
      {description && (
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
      )}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

interface LoadingChartProps {
  className?: string;
}

export function LoadingChart({ className = '' }: LoadingChartProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
      
      {/* チャートプレースホルダー */}
      <div className="h-64 bg-gray-100 rounded flex items-end justify-between p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={index}
            className="bg-gray-200 rounded-t w-8"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}