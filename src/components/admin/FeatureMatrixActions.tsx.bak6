'use client';

/**
 * Feature Matrix Actions Component
 * 保存・リセットボタン
 */

import { HIGButton } from '@/components/ui/HIGButton';

interface FeatureMatrixActionsProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function FeatureMatrixActions({ 
  hasChanges, 
  isSaving, 
  onSave, 
  onReset 
}: FeatureMatrixActionsProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg">
      <div className="flex items-center space-x-4">
        <HIGButton
          variant="primary"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>保存中...</span>
            </div>
          ) : (
            '設定を保存'
          )}
        </HIGButton>
        
        <HIGButton
          variant="secondary"
          onClick={onReset}
          disabled={!hasChanges || isSaving}
        >
          リセット
        </HIGButton>
      </div>

      <div className="text-sm text-[var(--aio-text-muted)]">
        {hasChanges ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[var(--aio-warning)] rounded-full"></div>
            <span>未保存の変更があります</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[var(--aio-success)] rounded-full"></div>
            <span>すべて保存済み</span>
          </div>
        )}
      </div>
    </div>
  );
}