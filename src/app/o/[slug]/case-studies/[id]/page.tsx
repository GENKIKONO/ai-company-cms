import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateCaseStudyJsonLd } from '@/lib/utils/jsonld';
import type { Organization, CaseStudy } from '@/types/database';
import { PrimaryCTA } from '@/design-system';
import { LogoImage } from '@/components/ui/optimized-image';
import { logger } from '@/lib/utils/logger';

interface CaseStudyDetailData {
  caseStudy: CaseStudy;
  organization: Organization;
}

async function getCaseStudyData(slug: string, caseStudyId: string): Promise<CaseStudyDetailData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // まず企業情報を取得
    const orgResponse = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store'
    });
    
    if (!orgResponse.ok) {
      return null;
    }
    
    const orgResult = await orgResponse.json();
    const organization = orgResult.data.organization;
    const caseStudies = orgResult.data.case_studies || [];
    
    // 事例詳細を検索
    const caseStudy = caseStudies.find((cs: CaseStudy) => cs.id === caseStudyId);
    
    if (!caseStudy) {
      return null;
    }

    return {
      caseStudy,
      organization
    };
  } catch (error) {
    logger.error('Failed to fetch case study data', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getCaseStudyData(resolvedParams.slug, resolvedParams.id);

  if (!data) {
    return {
      title: 'Case Study Not Found',
    };
  }

  const { caseStudy, organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${caseStudy.title} | ${organization.name}`,
    description: caseStudy.problem || `${organization.name}の導入事例「${caseStudy.title}」をご紹介します。`,
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.problem || '',
      type: 'article',
      url: `${baseUrl}/o/${organization.slug}/case-studies/${caseStudy.id}`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/case-studies/${caseStudy.id}`,
    },
  };
}

export default async function CaseStudyDetailPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const resolvedParams = await params;
  const data = await getCaseStudyData(resolvedParams.slug, resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { caseStudy, organization } = data;
  const jsonLd = generateCaseStudyJsonLd(caseStudy, organization);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                  AIO Hub AI企業CMS
                </Link>
                <nav className="ml-10 hidden md:flex space-x-8">
                  <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                    企業ディレクトリ
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Link href={`/o/${organization.slug}/case-studies`} className="text-gray-500 hover:text-gray-700">
                  導入事例
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{caseStudy.title}</span>
              </li>
            </ol>
          </nav>

          {/* 企業情報ヘッダー */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-4">
              {organization.logo_url && (
                <LogoImage
                  src={organization.logo_url}
                  alt={organization.name}
                  size="lg"
                  organizationName={organization.name}
                />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {organization.name}
                </h2>
                {organization.description && (
                  <p className="text-sm text-gray-600">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 事例詳細 */}
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 事例ヘッダー */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {caseStudy.title}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    作成日: {new Date(caseStudy.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            </div>

            {/* 事例詳細コンテンツ */}
            <div className="px-6 py-8">
              <div className="space-y-8">
                {/* 課題 */}
                {caseStudy.problem && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      課題・背景
                    </h2>
                    <div className="bg-red-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {caseStudy.problem}
                      </p>
                    </div>
                  </div>
                )}

                {/* 解決策 */}
                {caseStudy.solution && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      解決策・アプローチ
                    </h2>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {caseStudy.solution}
                      </p>
                    </div>
                  </div>
                )}

                {/* 成果 */}
                {caseStudy.result && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      成果・効果
                    </h2>
                    <div className="bg-green-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {caseStudy.result}
                      </p>
                    </div>
                  </div>
                )}


                {/* タグ */}
                {caseStudy.tags && caseStudy.tags.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">タグ</h2>
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 px-3 py-1 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* お問い合わせ・連絡先 */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">類似事例のお問い合わせ</h2>
            <p className="text-gray-700 mb-4">
              類似の課題をお持ちでしたら、お気軽にご相談ください。お客様に最適なソリューションをご提案いたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {organization.email && (
                <PrimaryCTA 
                  href={`mailto:${organization.email}?subject=${encodeURIComponent(`「${caseStudy.title}」類似案件について`)}`}
                  size="large"
                  icon="mail"
                >
                  メールでお問い合わせ
                </PrimaryCTA>
              )}
              {organization.telephone && (
                <a 
                  href={`tel:${organization.telephone}`}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  電話でお問い合わせ
                </a>
              )}
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="mt-8 flex justify-between">
            <Link 
              href={`/o/${organization.slug}/case-studies`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              導入事例一覧に戻る
            </Link>
            
            <PrimaryCTA 
              href={`/o/${organization.slug}`}
              size="medium"
              icon="arrow-right"
            >
              {organization.name} トップページへ
            </PrimaryCTA>
          </div>
        </main>
      </div>
    </>
  );
}