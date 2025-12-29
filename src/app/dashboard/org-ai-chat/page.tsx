'use client';

/**
 * Organization AI Chat Page - 新アーキテクチャ版
 */

import { useState, useEffect } from 'react';
import { DashboardPageShell, useDashboardPageContext } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
} from '@/components/dashboard/ui';
import { supabaseBrowser } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';

export default function OrgAIChatPage() {
  return (
    <DashboardPageShell
      title="企業専用AIチャット"
      requiredRole="admin"
    >
      <OrgAIChatContent />
    </DashboardPageShell>
  );
}

function OrgAIChatContent() {
  const { organization } = useDashboardPageContext();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [documentsUploaded, setDocumentsUploaded] = useState(0);

  const organizationId = organization?.id || '';

  const handleDocumentUploaded = () => {
    setDocumentsUploaded(prev => prev + 1);
  };

  if (!organizationId) {
    return (
      <>
        <DashboardPageHeader
          title="企業専用AIチャット"
          description="アップロードした文書をもとにAIと対話できます"
          backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
        />
        <DashboardAlert variant="error">
          <p className="text-sm">企業情報が見つかりません。</p>
        </DashboardAlert>
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="企業専用AIチャット"
        description="アップロードした文書をもとにAIと対話できます"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      {/* タブナビゲーション */}
      <DashboardCard className="mb-6">
        <DashboardCardContent>
          <div className="border-b border-[var(--dashboard-card-border)]">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('chat')}
                className={`${
                  activeTab === 'chat'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)]'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                AIチャット
                {documentsUploaded > 0 && (
                  <span className="ml-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {documentsUploaded}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`${
                  activeTab === 'documents'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)]'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                文書管理
              </button>
            </nav>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      {/* タブコンテンツ */}
      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <DocumentUpload
              organizationId={organizationId}
              onUploadComplete={handleDocumentUploaded}
            />
          </div>
          <div className="lg:col-span-3">
            <ChatInterface organizationId={organizationId} />
          </div>
        </div>
      ) : (
        <DocumentList organizationId={organizationId} />
      )}
    </>
  );
}