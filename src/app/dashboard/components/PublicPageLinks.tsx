'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PrimaryCTA } from '@/design-system';
import { logger } from '@/lib/utils/logger';

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
        logger.error('Failed to fetch organization slug', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    fetchOrgSlug();
  }, []);

  if (loading || !orgSlug || orgSlug.trim() === '') {
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
    <PrimaryCTA
      href={getPublicUrl()}
      target="_blank"
      rel="noopener noreferrer"
      size="small"
      icon="external-link"
      className={className}
    >
      {getLabel()}
    </PrimaryCTA>
  );
}