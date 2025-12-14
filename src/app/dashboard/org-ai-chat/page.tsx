'use client';

import { useState, useEffect } from 'react';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { HIGButton } from '@/design-system';
import { supabaseBrowser } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';

export default function OrgAIChatPage() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [documentsUploaded, setDocumentsUploaded] = useState(0);

  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userOrg } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .maybeSingle();
          
          if (userOrg) {
            setOrganizationId(userOrg.organization_id);
          } else {
            setError('企業アカウントが見つかりません。');
          }
        }
      } catch (error) {
        logger.error('Failed to get organization ID:', { data: error });
        setError('組織情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    getOrganizationId();
  }, []);

  const handleDocumentUploaded = () => {
    setDocumentsUploaded(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organizationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardBackLink />
          
          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    エラー
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error || '企業情報が見つかりません。'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardBackLink />
        
        {/* ヘッダー */}
        <div className="mt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                企業専用AIチャット
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                アップロードした文書をもとにAIと対話できます
              </p>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('chat')}
                className={`${
                  activeTab === 'chat'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                AIチャット
                {documentsUploaded > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {documentsUploaded}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`${
                  activeTab === 'documents'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                文書管理
              </button>
            </nav>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="mt-8">
          {activeTab === 'chat' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* 左サイド: 文書アップロード */}
              <div className="lg:col-span-1">
                <DocumentUpload 
                  organizationId={organizationId}
                  onUploadComplete={handleDocumentUploaded}
                />
              </div>
              
              {/* 右サイド: チャットインターフェース */}
              <div className="lg:col-span-3">
                <ChatInterface organizationId={organizationId} />
              </div>
            </div>
          ) : (
            <DocumentList organizationId={organizationId} />
          )}
        </div>
      </div>
    </div>
  );
}