'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PublicPageLinksProps {
  contentType: 'services' | 'posts' | 'case-studies' | 'faq';
  className?: string;
}

export default function PublicPageLinks({ contentType, className = '' }: PublicPageLinksProps) {
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgSlug = async () => {
      try {
        const response = await fetch('/api/my/organization');
        if (response.ok) {
          const result = await response.json();
          setOrgSlug(result.data?.slug || null);
        }
      } catch (error) {
        console.error('Failed to fetch organization slug:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgSlug();
  }, []);

  if (loading || !orgSlug) {
    return null;
  }

  const getPublicUrl = () => {
    switch (contentType) {
      case 'services':
        return `/o/${orgSlug}/services`;
      case 'posts':
        return `/o/${orgSlug}/posts`;
      case 'case-studies':
        return `/o/${orgSlug}/case-studies`;
      case 'faq':
        return `/o/${orgSlug}/faq`;
      default:
        return `/o/${orgSlug}`;
    }
  };

  const getLabel = () => {
    switch (contentType) {
      case 'services':
        return 'サービス一覧を表示';
      case 'posts':
        return '記事一覧を表示';
      case 'case-studies':
        return '事例一覧を表示';
      case 'faq':
        return 'FAQを表示';
      default:
        return '公開ページを表示';
    }
  };

  return (
    <Link
      href={getPublicUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors ${className}`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {getLabel()}
    </Link>
  );
}