/**
 * EPIC 2-2: セッション競合解決ダイアログ
 * 
 * 他のタブや他のユーザーによって同じセッションが更新された場合の
 * 競合解決用ダイアログコンポーネント
 */

'use client';

import React from 'react';
import { HIGButton } from '@/design-system';

interface ConflictDialogProps {
  isOpen: boolean;
  onResolve: (useLatest: boolean) => void;
  conflictInfo: {
    currentAnswerCount: number;
    latestAnswerCount: number;
    lastUpdated: string;
  };
}

export default function ConflictDialog({ isOpen, onResolve, conflictInfo }: ConflictDialogProps) {
  if (!isOpen) return null;

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* アイコンとタイトル */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">他の画面で更新されています</h3>
        </div>

        {/* 説明 */}
        <div className="mb-6">
          <p className="text-gray-700 text-sm mb-3">
            このセッションが他のタブまたは他のユーザーによって更新されました。
            現在の編集内容を保持するか、最新の内容を取得するかを選択してください。
          </p>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>現在の回答数:</span>
              <span className="font-medium">{conflictInfo.currentAnswerCount}件</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>最新の回答数:</span>
              <span className="font-medium">{conflictInfo.latestAnswerCount}件</span>
            </div>
            <div className="flex justify-between">
              <span>最終更新:</span>
              <span className="font-medium">{formatDateTime(conflictInfo.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-3">
          <HIGButton
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => onResolve(false)}
          >
            現在の編集を保持
          </HIGButton>
          <HIGButton
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onResolve(true)}
          >
            最新の内容を取得
          </HIGButton>
        </div>

        {/* 注意事項 */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <span className="font-medium">💡 ヒント:</span> 
            「現在の編集を保持」を選択すると、次回の保存時に現在の内容で上書きされます。
            「最新の内容を取得」を選択すると、現在の編集内容は失われます。
          </p>
        </div>
      </div>
    </div>
  );
}