'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { JsonLdModal } from './json-ld-modal';
import { useApiClient } from '@/hooks/useApiClient';
import { logger } from '@/lib/utils/logger';

interface OrganizationPreviewProps {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  isPublished: boolean;
}

interface OrganizationData {
  organization: any;
  posts: any[];
  services: any[];
  case_studies: any[];
  faqs: any[];
}

export function OrganizationPreview({ 
  organizationId, 
  organizationSlug, 
  organizationName, 
  isPublished 
}: OrganizationPreviewProps) {
  const [jsonLdData, setJsonLdData] = useState<any[]>([]);
  const { loading, error, execute } = useApiClient<OrganizationData>();

  useEffect(() => {
    async function fetchJsonLdData() {
      try {
        const data = await execute(`/api/public/organizations/${organizationSlug}`);
        if (data) {
          // Generate JSON-LD data (we'll need to import the utility)
          const { generateOrganizationPageJsonLd } = await import('@/lib/utils/jsonld');
          const jsonLd = generateOrganizationPageJsonLd(
            data.organization,
            data.posts,
            data.services,
            data.case_studies,
            data.faqs
          );
          setJsonLdData(jsonLd);
        }
      } catch (err) {
        logger.error('Failed to fetch JSON-LD data:', { data: err });
      }
    }

    if (isPublished) {
      fetchJsonLdData();
    }
  }, [organizationSlug, isPublished, execute]);

  if (!isPublished) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">組織が非公開です</h3>
            <p className="text-sm text-yellow-700 mt-1">
              公開ページのプレビューを表示するには、組織を公開状態にしてください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Section */}
      <div className="bg-[var(--aio-info-surface)] border border-[var(--aio-info-border)] rounded-md p-4">
        <div className="flex items-start justify-between">
          <div className="flex">
            <svg className="w-5 h-5 text-[var(--aio-info)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[var(--aio-info)]">公開ページプレビュー</h3>
              <p className="text-sm text-[var(--aio-info)] opacity-80 mt-1">
                組織の公開ページをプレビューしたり、SEO情報を確認できます。
              </p>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <Link
              href={`/o/${organizationSlug}`}
              target="_blank"
              className="inline-flex items-center px-3 py-1 border border-[var(--aio-info-border)] shadow-sm text-sm font-medium rounded-md text-[var(--aio-info)] bg-white hover:bg-[var(--aio-info-surface)]"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              公開ページを開く
            </Link>
            {jsonLdData.length > 0 && (
              <JsonLdModal
                jsonLdData={jsonLdData}
                organizationName={organizationName}
                trigger={
                  <button className="inline-flex items-center px-3 py-1 border border-[var(--aio-info-border)] shadow-sm text-sm font-medium rounded-md text-[var(--aio-info)] bg-white hover:bg-[var(--aio-info-surface)]">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    JSON-LD構造化データ
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/o/${organizationSlug}/posts`}
          target="_blank"
          className="block p-4 border border-gray-200 rounded-lg hover:border-[var(--aio-info-border)] hover:bg-[var(--aio-info-surface)] transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-gray-900">記事一覧</span>
          </div>
        </Link>
        <Link
          href={`/o/${organizationSlug}/services`}
          target="_blank"
          className="block p-4 border border-gray-200 rounded-lg hover:border-[var(--aio-info-border)] hover:bg-[var(--aio-info-surface)] transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="ml-2 text-sm font-medium text-gray-900">サービス一覧</span>
          </div>
        </Link>
        <Link
          href={`/o/${organizationSlug}/case-studies`}
          target="_blank"
          className="block p-4 border border-gray-200 rounded-lg hover:border-[var(--aio-info-border)] hover:bg-[var(--aio-info-surface)] transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-gray-900">事例一覧</span>
          </div>
        </Link>
        <Link
          href={`/o/${organizationSlug}/faq`}
          target="_blank"
          className="block p-4 border border-gray-200 rounded-lg hover:border-[var(--aio-info-border)] hover:bg-[var(--aio-info-surface)] transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-gray-900">FAQ</span>
          </div>
        </Link>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center text-sm text-gray-500">
          JSON-LD構造化データを読み込み中...
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}