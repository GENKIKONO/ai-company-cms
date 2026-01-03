/* eslint-disable no-console */
/**
 * Bulk Translation Enqueue Page
 * P4-3: 組織単位の一括翻訳投入
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

const CONTENT_TYPES = [
  { value: 'posts', label: '投稿', description: 'ブログ記事・ニュース' },
  { value: 'services', label: 'サービス', description: 'サービス・製品情報' },
  { value: 'faqs', label: 'FAQ', description: 'よくある質問' },
  { value: 'case_studies', label: '導入事例', description: '顧客導入事例' },
  { value: 'products', label: '製品', description: '製品情報' }
];

const TARGET_LANGUAGES = [
  { value: 'en', label: '英語', flag: '🇺🇸' },
  { value: 'zh', label: '中国語', flag: '🇨🇳' },
  { value: 'ko', label: '韓国語', flag: '🇰🇷' }
];

export default function BulkTranslationPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['posts', 'services']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [priority, setPriority] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; enqueued_count?: number } | null>(null);

  // 組織一覧取得
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // 管理者用のAPI経由で組織一覧を取得（実装に応じて調整）
        const response = await fetch('/api/admin/organizations');
        const data = await response.json();
        if (data.success && data.data) {
          setOrganizations(data.data);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // 一括翻訳実行
  const handleBulkEnqueue = async () => {
    if (!selectedOrgId) {
      alert('組織を選択してください');
      return;
    }

    if (selectedContentTypes.length === 0) {
      alert('翻訳対象を選択してください');
      return;
    }

    if (selectedLanguages.length === 0) {
      alert('翻訳言語を選択してください');
      return;
    }

    const confirmed = confirm(
      `選択された組織のコンテンツを${selectedLanguages.length}言語に翻訳します。\n` +
      `対象: ${selectedContentTypes.join(', ')}\n` +
      `言語: ${selectedLanguages.map(lang => TARGET_LANGUAGES.find(l => l.value === lang)?.label).join(', ')}\n\n` +
      'この操作には時間がかかる場合があります。続行しますか？'
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_enqueue',
          organization_id: selectedOrgId,
          target_languages: selectedLanguages,
          content_types: selectedContentTypes,
          priority
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // 成功時は選択をリセット
        setSelectedOrgId('');
        setSelectedContentTypes(['posts', 'services']);
        setSelectedLanguages(['en']);
      }

    } catch (error) {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">一括翻訳投入</h1>
          <p className="mt-2 text-gray-600">組織のコンテンツを複数言語に一括翻訳します</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* 組織選択 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                対象組織 *
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
              >
                <option value="">組織を選択してください</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
              {selectedOrg && (
                <p className="mt-2 text-sm text-gray-500">
                  選択中: {selectedOrg.name}
                </p>
              )}
            </div>

            {/* コンテンツタイプ選択 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                翻訳対象コンテンツ *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONTENT_TYPES.map((type) => (
                  <div key={type.value} className="relative">
                    <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={type.value}
                        checked={selectedContentTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContentTypes([...selectedContentTypes, type.value]);
                          } else {
                            setSelectedContentTypes(selectedContentTypes.filter(t => t !== type.value));
                          }
                        }}
                        className="mt-1 rounded border-gray-300 text-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                選択されたタイプのtitle・descriptionフィールドが翻訳されます
              </p>
            </div>

            {/* 翻訳言語選択 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                翻訳先言語 *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TARGET_LANGUAGES.map((lang) => (
                  <div key={lang.value} className="relative">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={lang.value}
                        checked={selectedLanguages.includes(lang.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLanguages([...selectedLanguages, lang.value]);
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.value));
                          }
                        }}
                        className="rounded border-gray-300 text-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {lang.flag} {lang.label}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 優先度設定 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度 (1-10)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[2rem]">
                  {priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                数値が高いほど早く処理されます（デフォルト: 5）
              </p>
            </div>

            {/* 実行ボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleBulkEnqueue}
                disabled={loading || !selectedOrgId || selectedContentTypes.length === 0 || selectedLanguages.length === 0}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    処理中...
                  </>
                ) : (
                  '一括翻訳を実行'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className={`mt-6 rounded-md p-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <CheckIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '一括翻訳投入完了' : 'エラーが発生しました'}
                </p>
                <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  <p>{result.message}</p>
                  {result.success && result.enqueued_count && (
                    <p className="mt-1">
                      {result.enqueued_count}件の翻訳ジョブが投入されました
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>翻訳処理にはOpenAI APIを使用します</li>
                  <li>大量のコンテンツの場合、処理に時間がかかることがあります</li>
                  <li>重複する翻訳ジョブは自動的にスキップされます</li>
                  <li>処理状況は翻訳ジョブ管理画面で確認できます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}