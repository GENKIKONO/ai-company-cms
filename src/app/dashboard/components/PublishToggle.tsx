'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

interface PublishToggleProps {
  organizationId: string;
  isPublished: boolean;
  organizationName: string;
}

export default function PublishToggle({ 
  organizationId, 
  isPublished, 
  organizationName 
}: PublishToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPublishState, setCurrentPublishState] = useState(isPublished);
  const router = useRouter();

  const handleTogglePublish = async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/my/organization/publish', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_published: !currentPublishState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update publish status');
      }

      const result = await response.json();
      logger.debug('[VERIFY] dashboard publish toggle', {
        organizationId,
        previousState: currentPublishState,
        newState: !currentPublishState,
        result
      });
      
      // 状態を更新
      setCurrentPublishState(!currentPublishState);
      
      // ページを再読み込みして最新状態を反映
      router.refresh();
      
    } catch (error) {
      logger.error('Failed to toggle publish status', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('公開状態の更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleTogglePublish}
      disabled={isLoading}
      data-testid="qa-toggle-publish"
      className={`flex items-center p-3 sm:p-4 border-2 border-dashed rounded-lg transition-colors min-h-0 h-20 sm:h-auto ${
        isLoading
          ? 'border-[var(--dashboard-card-border)] bg-[var(--aio-surface)] cursor-not-allowed opacity-50'
          : currentPublishState
            ? 'border-[var(--status-error)] hover:border-[var(--aio-danger)] hover:bg-[var(--aio-danger-muted)]'
            : 'border-[var(--status-success)] hover:border-[var(--aio-success)] hover:bg-[var(--aio-success-muted)]'
      }`}
    >
      <div className={`p-2 rounded-lg mr-2 sm:mr-3 ${
        isLoading
          ? 'bg-[var(--aio-surface)]'
          : currentPublishState ? 'bg-[var(--aio-danger-muted)]' : 'bg-[var(--aio-success-muted)]'
      }`}>
        {isLoading ? (
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-text-secondary)] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${
            currentPublishState ? 'text-[var(--aio-danger)]' : 'text-[var(--aio-success)]'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {currentPublishState ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m3.828 3.828l4.242 4.242m-4.242-4.242L9.88 9.88m4.242 4.242L18.05 18.05" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
        )}
      </div>
      <div className="text-left min-w-0 flex-1">
        <p className={`font-medium text-xs sm:text-base ${isLoading ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'} truncate`}>
          {isLoading 
            ? '更新中...' 
            : currentPublishState 
              ? 'サイトを非公開にする' 
              : 'サイトを公開する'
          }
        </p>
        <p className={`text-xs sm:text-sm ${isLoading ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'} hidden sm:block`}>
          {isLoading 
            ? `${organizationName}の公開状態を更新しています`
            : currentPublishState 
              ? '一般からアクセス不可にします' 
              : '一般に公開して検索可能にします'
          }
        </p>
      </div>
    </button>
  );
}