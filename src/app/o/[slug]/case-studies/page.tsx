import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateCaseStudyJsonLd, generateOrganizationJsonLd } from '@/lib/utils/jsonld';
import type { Organization, CaseStudy } from '@/types/database';
import { logger } from '@/lib/utils/logger';

interface CaseStudiesPageData {
  organization: Organization;
  case_studies: CaseStudy[];
}

async function getCaseStudiesData(slug: string): Promise<CaseStudiesPageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return {
      organization: result.data.organization,
      case_studies: result.data.case_studies || []
    };
  } catch (error) {
    logger.error('Failed to fetch case studies data', { data: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getCaseStudiesData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'Case Studies Not Found',
    };
  }

  const { organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `導入事例 | ${organization.name}`,
    description: `${organization.name}の導入事例をご紹介します。お客様の課題解決実績をご覧いただけます。`,
    openGraph: {
      title: `${organization.name} - 導入事例`,
      description: `${organization.name}の導入事例・実績`,
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}/case-studies`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/case-studies`,
    },
  };
}

export default async function CaseStudiesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const data = await getCaseStudiesData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { organization, case_studies } = data;
  
  // JSON-LD構造化データ生成
  const jsonLdArray = [];
  
  // 組織情報
  jsonLdArray.push(generateOrganizationJsonLd(organization));
  
  // 各事例のJSON-LD
  case_studies.forEach(caseStudy => {
    jsonLdArray.push(generateCaseStudyJsonLd(caseStudy, organization));
  });

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLdArray.map((jsonLd, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-[var(--aio-primary)]">
                  AIO Hub AI企業CMS
                </Link>
                <nav className="ml-10 hidden md:flex space-x-8">
                  <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                    企業ディレクトリ
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* パンくずナビ */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  ホーム
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href={`/o/${organization.slug}`} className="text-gray-500 hover:text-gray-700">
                  {organization.name}
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">導入事例</span>
              </li>
            </ol>
          </nav>

          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {organization.name} - 導入事例
            </h1>
            <p className="text-lg text-gray-600">
              お客様の課題解決実績をご紹介します
            </p>
          </div>

          {/* 事例一覧 */}
          {case_studies && case_studies.length > 0 ? (
            <div className="space-y-8">
              {case_studies.map((caseStudy) => (
                <Link
                  key={caseStudy.id}
                  href={`/o/${organization.slug}/case-studies/${caseStudy.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {caseStudy.title}
                      </h2>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(caseStudy.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 課題 */}
                    {caseStudy.problem && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          課題
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {caseStudy.problem}
                        </p>
                      </div>
                    )}

                    {/* 解決策 */}
                    {caseStudy.solution && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          解決策
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {caseStudy.solution}
                        </p>
                      </div>
                    )}

                    {/* 成果 */}
                    {caseStudy.result && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          成果
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {caseStudy.result}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* タグ */}
                  {caseStudy.tags && caseStudy.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {caseStudy.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {caseStudy.tags.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{caseStudy.tags.length - 5}件
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[var(--aio-primary)] text-sm font-medium">
                      詳細を見る →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  導入事例はまだ公開されていません
                </h3>
                <p className="text-gray-600">
                  現在準備中です。しばらくお待ちください。
                </p>
              </div>
            </div>
          )}

          {/* 企業情報に戻るリンク */}
          <div className="mt-12 text-center">
            <Link 
              href={`/o/${organization.slug}`}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              {organization.name} トップページに戻る
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}