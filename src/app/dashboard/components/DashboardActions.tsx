'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardActionsProps {
  organization: any;
  context?: 'quickActions' | 'activity';
}

export default function DashboardActions({ organization, context = 'quickActions' }: DashboardActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const handleShareLink = async () => {
    if (!organization?.slug || organization.slug.trim() === '') {
      alert('企業のスラッグが設定されていません。企業情報を編集してスラッグを設定してください。');
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/o/${organization.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // 3秒後にコピー状態をリセット
      setTimeout(() => setCopied(false), 3000);
      
      // 簡易トースト（後でより良いものに置き換え可能）
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = '共有リンクをコピーしました！';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // エラートースト
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = 'コピーに失敗しました';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    }
  };

  const handleDataExport = async () => {
    if (!organization?.id) {
      alert('組織情報が見つかりません');
      return;
    }

    setLoading(prev => ({ ...prev, export: true }));
    
    try {
      const response = await fetch(`/api/dashboard/export?orgId=${organization.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${organization.name}_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // 成功トースト
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = 'データのエクスポートが完了しました！';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      
      // エラートースト
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = 'エクスポートに失敗しました';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handleSettings = () => {
    router.push('/dashboard/settings');
  };

  const handleHelp = () => {
    router.push('/dashboard/help');
  };

  const handleShowAllActivity = () => {
    router.push('/dashboard/activity');
  };

  const isDisabled = !organization?.id;
  const hasSlug = !!organization?.slug && organization.slug.trim() !== '';

  if (context === 'activity') {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button 
          onClick={handleShowAllActivity}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          すべてのアクティビティを表示
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={handleShareLink}
          disabled={isDisabled || !hasSlug}
          className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDisabled ? '企業が未作成です' : !hasSlug ? '企業のスラッグが未設定です。企業情報を編集してスラッグを設定してください。' : '共有リンクをコピー'}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          {copied ? 'コピー済み' : '共有リンク'}
        </button>
        
        <button 
          onClick={handleDataExport}
          disabled={isDisabled || loading.export}
          className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDisabled ? '企業が未作成です' : 'データをCSV形式でエクスポート'}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {loading.export ? '出力中...' : 'データ出力'}
        </button>
        
        <button 
          onClick={handleSettings}
          className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          設定
        </button>
        
        <button 
          onClick={handleHelp}
          className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ヘルプ
        </button>
      </div>
    </div>
  );
}