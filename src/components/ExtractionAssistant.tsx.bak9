'use client';

import { useState } from 'react';
import { ExtractedCandidates, generateCandidatesFromAPI } from '@/lib/text-extraction';

type Props = {
  onApplyCandidates: (candidates: ExtractedCandidates) => void;
  disabled?: boolean;
};

export default function ExtractionAssistant({ onApplyCandidates, disabled = false }: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [candidates, setCandidates] = useState<ExtractedCandidates | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'pdf'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleExtractFromUrl = async () => {
    if (!url.trim()) {
      setError('URLを入力してください');
      return;
    }

    setIsExtracting(true);
    setError('');
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'URLからの抽出に失敗しました');
      }

      const result = await response.json();
      setExtractionResult({ success: true, sourceType: 'url', ...result.data });
      
      const candidateData = generateCandidatesFromAPI(result.data);
      setCandidates(candidateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractFromPdf = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setIsExtracting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDFからの抽出に失敗しました');
      }

      const result = await response.json();
      setExtractionResult({ success: true, sourceType: 'pdf', ...result.data });
      
      const candidateData = generateCandidatesFromAPI(result.data);
      setCandidates(candidateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyCandidate = (field: keyof ExtractedCandidates, value: any) => {
    const candidateData = { [field]: value };
    onApplyCandidates(candidateData);
  };

  const handleApplyAllCandidates = () => {
    if (candidates) {
      onApplyCandidates(candidates);
    }
  };

  const resetExtraction = () => {
    setExtractionResult(null);
    setCandidates(null);
    setError('');
    setUrl('');
    setFile(null);
  };

  // テキスト品質評価は簡略化
  const textQuality = extractionResult?.content ? {
    score: extractionResult.content.length > 100 ? 85 : 60,
    issues: extractionResult.content.length < 100 ? ['テキストが短い'] : []
  } : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">入力アシスタント</h3>
        {extractionResult && (
          <button
            onClick={resetExtraction}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            リセット
          </button>
        )}
      </div>

      {!extractionResult ? (
        <div>
          {/* タブ */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'url'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              URL から抽出
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'pdf'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              PDF から抽出
            </button>
          </div>

          {/* URL抽出 */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業サイトのURL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={disabled || isExtracting}
                />
              </div>
              <button
                onClick={handleExtractFromUrl}
                disabled={disabled || isExtracting || !url.trim()}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'テキスト抽出中...' : 'テキストを抽出'}
              </button>
            </div>
          )}

          {/* PDF抽出 */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDFファイル（企業概要、パンフレット等）
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={disabled || isExtracting}
                />
                <p className="mt-1 text-xs text-gray-500">PDFファイル（最大10MB）</p>
              </div>
              <button
                onClick={handleExtractFromPdf}
                disabled={disabled || isExtracting || !file}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'テキスト抽出中...' : 'テキストを抽出'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 抽出結果サマリー */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">抽出結果</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">ソース:</span>
                <span className="ml-1 text-gray-900">
                  {extractionResult.sourceType === 'url' ? 'URL' : 'PDF'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">テキスト長:</span>
                <span className="ml-1 text-gray-900">{extractionResult.content?.length || 0}文字</span>
              </div>
              {extractionResult.title && (
                <div className="col-span-2">
                  <span className="text-gray-500">タイトル:</span>
                  <span className="ml-1 text-gray-900">{extractionResult.title}</span>
                </div>
              )}
            </div>
            
            {/* 品質評価 */}
            {textQuality && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">抽出品質:</span>
                  <span className={`text-xs font-medium ${
                    textQuality.score >= 80 ? 'text-green-600' :
                    textQuality.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {textQuality.score}点
                  </span>
                </div>
                {textQuality.issues.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600">
                      {textQuality.issues.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 候補データ */}
          {candidates && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">抽出された候補データ</h4>
                <button
                  onClick={handleApplyAllCandidates}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  disabled={disabled}
                >
                  すべて適用
                </button>
              </div>
              
              <div className="space-y-3">
                {candidates.name && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">企業名</div>
                      <div className="text-sm font-medium text-gray-900">{candidates.name}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('name', candidates.name)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.description && (
                  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">企業説明</div>
                      <div className="text-sm text-gray-900 line-clamp-2">{candidates.description}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('description', candidates.description)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2 flex-shrink-0"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.telephone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">電話番号</div>
                      <div className="text-sm font-medium text-gray-900">{candidates.telephone}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('telephone', candidates.telephone)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.email && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">メールアドレス</div>
                      <div className="text-sm font-medium text-gray-900">{candidates.email}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('email', candidates.email)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.url && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">公式サイト</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{candidates.url}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('url', candidates.url)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.address && (
                  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">住所</div>
                      <div className="text-sm text-gray-900">{candidates.address}</div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('address', candidates.address)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2 flex-shrink-0"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}

                {candidates.services && candidates.services.length > 0 && (
                  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">サービス候補</div>
                      <div className="text-sm text-gray-900">
                        {candidates.services.slice(0, 3).join(', ')}
                        {candidates.services.length > 3 && '...'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyCandidate('services', candidates.services)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2 flex-shrink-0"
                      disabled={disabled}
                    >
                      適用
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}