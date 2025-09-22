'use client';

import { useState, useEffect, useCallback } from 'react';

interface PublishGateProps {
  organizationId: string;
  organizationName: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  additionalChecks?: Record<string, {
    label: string;
    passed: boolean;
    message: string;
  }>;
}

interface PublishGateResult {
  canPublish: boolean;
  errors: string[];
  warnings: string[];
  requiredActions: string[];
}

export default function PublishGate({
  organizationId,
  organizationName,
  currentStatus,
  onStatusChange,
  additionalChecks
}: PublishGateProps) {
  const [gateResult, setGateResult] = useState<PublishGateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkPublishGate = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setGateResult(result);
        setLastCheck(new Date());
      } else {
        console.error('Publish gate check failed:', result);
        setGateResult({
          canPublish: false,
          errors: [result.error || 'チェックに失敗しました'],
          warnings: [],
          requiredActions: []
        });
      }
    } catch (error) {
      console.error('Publish gate check error:', error);
      setGateResult({
        canPublish: false,
        errors: ['チェック中にエラーが発生しました'],
        warnings: [],
        requiredActions: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const handlePublish = async () => {
    if (!gateResult?.canPublish) {
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('組織を公開しました！');
        onStatusChange?.('published');
        // チェック結果をリセット
        setGateResult(null);
        setLastCheck(null);
      } else {
        alert(result.message || '公開に失敗しました');
        // エラーの場合は再チェック
        await checkPublishGate();
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('公開中にエラーが発生しました');
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    // 初回ロード時にチェック実行
    if (currentStatus !== 'published') {
      checkPublishGate();
    }
  }, [currentStatus, checkPublishGate]);

  if (currentStatus === 'published') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-green-900">
              公開中
            </h3>
            <p className="text-sm text-green-700">
              {organizationName} は現在公開されています。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          公開前チェック（Publish Gate）
        </h3>
        <button
          onClick={checkPublishGate}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? '確認中...' : '再チェック'}
        </button>
      </div>

      {lastCheck && (
        <p className="text-xs text-gray-500 mb-4">
          最終チェック: {lastCheck.toLocaleString()}
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">公開前チェック実行中...</p>
        </div>
      ) : gateResult ? (
        <div className="space-y-4">
          {/* 全体ステータス */}
          <div className={`p-4 rounded-md ${
            gateResult.canPublish 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                gateResult.canPublish ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <p className={`ml-3 text-sm font-medium ${
                gateResult.canPublish ? 'text-green-800' : 'text-red-800'
              }`}>
                {gateResult.canPublish ? '公開可能です' : '公開前に修正が必要です'}
              </p>
            </div>
          </div>

          {/* エラー */}
          {gateResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                修正が必要な項目
              </h4>
              <ul className="space-y-1">
                {gateResult.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 警告 */}
          {gateResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                改善推奨項目
              </h4>
              <ul className="space-y-1">
                {gateResult.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-start">
                    <span className="text-yellow-500 mr-2">⚠</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 必要なアクション */}
          {gateResult.requiredActions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                推奨アクション
              </h4>
              <ul className="space-y-1">
                {gateResult.requiredActions.map((action, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="text-blue-500 mr-2">→</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 公開ボタン */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handlePublish}
              disabled={!gateResult.canPublish || isPublishing}
              className={`w-full px-6 py-3 rounded-md text-sm font-medium ${
                gateResult.canPublish && !isPublishing
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPublishing ? '公開中...' : gateResult.canPublish ? '公開する' : '修正後に公開可能'}
            </button>
            
            {gateResult.canPublish && gateResult.warnings.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 text-center">
                警告項目がありますが、公開は可能です
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">チェックを実行してください</p>
        </div>
      )}
    </div>
  );
}