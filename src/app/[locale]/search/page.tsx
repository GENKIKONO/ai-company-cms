import { Metadata } from 'next';
import { Suspense } from 'react';
import AdvancedSearchPage from '@/components/search/AdvancedSearchPage';

export const metadata: Metadata = {
  title: '高度検索 | LuxuCare - AI企業ディレクトリ',
  description: 'ファセット検索機能を使って企業を詳細に絞り込み、最適な企業を見つけることができます。業界、地域、企業規模、技術スタックなど多様な条件で検索可能。',
  keywords: 'ファセット検索, 企業検索, 高度検索, フィルター, 業界別, 地域別, 企業規模',
  openGraph: {
    title: '高度検索 | LuxuCare',
    description: 'ファセット検索機能を使って企業を詳細に絞り込み、最適な企業を見つけることができます。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '高度検索 | LuxuCare',
    description: 'ファセット検索機能を使って企業を詳細に絞り込み、最適な企業を見つけることができます。',
  },
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    industries?: string;
    regions?: string;
    sizes?: string;
    technologies?: string;
    hasUrl?: string;
    hasLogo?: string;
    hasServices?: string;
    hasCaseStudies?: string;
    isVerified?: string;
    lastUpdated?: string;
    view?: 'grid' | 'list' | 'table';
    sort?: string;
    page?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            企業高度検索
          </h1>
          <p className="text-lg text-gray-600">
            ファセット検索機能を使って、詳細な条件で企業を絞り込んで検索できます
          </p>
        </div>

        <Suspense 
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Results skeleton */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <AdvancedSearchPage searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}