// 統一されたローディングスケルトンコンポーネント
import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  variant?: 'default' | 'card' | 'list' | 'table' | 'grid' | 'hero' | 'form';
  className?: string;
  animate?: boolean;
}

// Shimmer animation CSS
const shimmerAnimation = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-white before:opacity-60';

export function LoadingSkeleton({ 
  lines = 3, 
  variant = 'default', 
  className = '',
  animate = true 
}: LoadingSkeletonProps) {
  
  const baseClasses = animate ? 'animate-pulse' : '';
  const skeletonClasses = animate ? shimmerAnimation : '';
  if (variant === 'card') {
    return (
      <div className={`animate-pulse bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className={`${baseClasses} bg-white rounded-lg border border-gray-200 p-6`}>
            <div className="space-y-4">
              <div className={`h-6 bg-gray-200 rounded w-3/4 ${skeletonClasses}`}></div>
              <div className="space-y-2">
                <div className={`h-3 bg-gray-200 rounded ${skeletonClasses}`}></div>
                <div className={`h-3 bg-gray-200 rounded w-2/3 ${skeletonClasses}`}></div>
              </div>
              <div className="flex space-x-2">
                <div className={`h-8 bg-gray-200 rounded w-16 ${skeletonClasses}`}></div>
                <div className={`h-8 bg-gray-200 rounded w-20 ${skeletonClasses}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`${baseClasses} space-y-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className={`h-12 bg-gray-200 rounded w-2/3 mx-auto ${skeletonClasses}`}></div>
          <div className={`h-6 bg-gray-200 rounded w-1/2 mx-auto ${skeletonClasses}`}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div className={`h-6 bg-gray-200 rounded w-3/4 ${skeletonClasses}`}></div>
                <div className={`h-3 bg-gray-200 rounded ${skeletonClasses}`}></div>
                <div className={`h-3 bg-gray-200 rounded w-2/3 ${skeletonClasses}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`${baseClasses} bg-white rounded-lg border border-gray-200 p-6 space-y-6 ${className}`}>
        <div className={`h-8 bg-gray-200 rounded w-1/3 ${skeletonClasses}`}></div>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 bg-gray-200 rounded w-1/4 ${skeletonClasses}`}></div>
            <div className={`h-10 bg-gray-200 rounded ${skeletonClasses}`}></div>
          </div>
        ))}
        <div className="flex space-x-3">
          <div className={`h-10 bg-gray-200 rounded w-24 ${skeletonClasses}`}></div>
          <div className={`h-10 bg-gray-200 rounded w-20 ${skeletonClasses}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} space-y-4 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded w-3/4 ${skeletonClasses}`}></div>
          <div className={`h-3 bg-gray-200 rounded w-1/2 ${skeletonClasses}`}></div>
        </div>
      ))}
    </div>
  );
}

// ページ全体のローディング表示
export function PageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// 空の状態表示コンポーネント
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  icon 
}: EmptyStateProps) {
  const defaultIcon = (
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        {icon || defaultIcon}
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {actionLabel && onAction && (
          <div className="mt-6">
            <button
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--bg-primary)]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}