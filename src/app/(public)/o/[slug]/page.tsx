import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { generateOrganizationPageJsonLd } from '@/lib/utils/jsonld';
import { LogoImage } from '@/components/ui/optimized-image';
import ReportButton from '@/components/common/ReportButton';
import AddressDisplay from '@/components/address/AddressDisplay';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import QAPublicDisplay from '@/components/qa/QAPublicDisplay';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isVerifiedBadgeAllowed } from '@/config/plans';
import { createFullAddress } from '@/lib/structured-data/organization';
import type { Organization, Post, Service, CaseStudy, FAQ } from '@/types/legacy/database';
import type { QAEntry } from '@/types/domain/qa-system';

// ISR: 10分キャッシュ + on-demand revalidate
export const revalidate = 600;

// P4-2: generateStaticParams適用（公開組織の事前生成）
// 🔒 VIEW経由でSST強制（世界商用レベル）
export async function generateStaticParams() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 🔒 VIEW経由で公開中の組織slugsを取得（非公開組織は絶対に含まれない）
    // ⚠️ VIEWは既に is_published=true AND deleted_at IS NULL でフィルター済み
    //    status/is_published フィルターは不要（VIEWに存在しないカラム）
    const { data: orgs } = await supabase
      .from('v_organizations_public')
      .select('slug')
      .limit(200);

    if (!orgs) return [];

    return orgs
      .filter(org => org.slug)
      .map(org => ({ slug: org.slug }));
  } catch {
    // 静的生成時のエラーは空配列を返してランタイム生成にフォールバック
    return [];
  }
}

interface OrganizationPageData {
  organization: Organization;
  posts: Post[];
  services: Service[];
  case_studies: CaseStudy[];
  faqs: FAQ[];
  qa_entries: QAEntry[];
}

// ✅ 公開組織データ取得: Public API経由で取得（RLS差異回避）
import { logger } from '@/lib/log';

/**
 * 🔥 FIX: Public API経由でデータ取得
 * 理由: Supabase直叩きとServer Client(API)で公開判定結果が異なるため、
 *       既存の /api/public/organizations/[slug] を利用して一本化
 */
async function fetchOrganizationFromPublicAPI(slug: string): Promise<OrganizationPageData | null> {
  const safeSlug = slug.toLowerCase().trim();

  // 内部API呼び出し（Server-side fetch）
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/public/organizations/${safeSlug}`;

  logger.debug(`[fetchOrganizationFromPublicAPI] Fetching from: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      // 🔥 まず cache: 'no-store' で確実に動作確認
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`[fetchOrganizationFromPublicAPI] Organization not found: ${safeSlug}`);
        return null;
      }
      logger.error(`[fetchOrganizationFromPublicAPI] API error:`, {
        status: response.status,
        statusText: response.statusText,
        slug: safeSlug,
      });
      return null;
    }

    const json = await response.json();
    const { organization, posts, services, case_studies, faqs } = json.data || {};

    if (!organization) {
      logger.warn(`[fetchOrganizationFromPublicAPI] No organization in response: ${safeSlug}`);
      return null;
    }

    logger.info(`[fetchOrganizationFromPublicAPI] Success: ${organization.name}, services=${services?.length || 0}`);

    // servicesのnameをtitleにマップ（Legacy Service型との互換性）
    const mappedServices = (services || []).map((s: Record<string, unknown>) => ({
      ...s,
      title: s.name,
    }));

    // Q&A entriesは別途取得が必要（APIに含まれていない）
    // 暫定的に空配列を返す（後で必要なら追加API or 別fetch）
    return {
      organization,
      posts: posts || [],
      services: mappedServices,
      case_studies: case_studies || [],
      faqs: faqs || [],
      qa_entries: [], // TODO: 必要なら /api/public/qa-entries/[orgId] を追加
    };
  } catch (error) {
    logger.error(`[fetchOrganizationFromPublicAPI] Fetch failed:`, {
      error: error instanceof Error ? error.message : error,
      slug: safeSlug,
    });
    return null;
  }
}

async function getOrganizationData(slug: string): Promise<OrganizationPageData | null> {
  try {
    // 🔥 Public API経由でデータ取得（RLS差異回避）
    const result = await fetchOrganizationFromPublicAPI(slug);
    return result;
  } catch (error) {
    logger.error('Failed to fetch organization data', { data: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getOrganizationData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'Organization Not Found',
    };
  }

  const { organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: organization.meta_title || `${organization.name} - AIOHub企業ディレクトリ`,
    description: organization.meta_description || organization.description || `${organization.name}の企業情報、サービス、記事を紹介します。`,
    keywords: organization.meta_keywords?.join(', '),
    openGraph: {
      title: organization.name,
      description: organization.description || '',
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}`,
      siteName: 'AIOHub企業ディレクトリ',
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: organization.name,
      description: organization.description || '',
      images: organization.logo_url ? [organization.logo_url] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}`,
    },
  };
}

export default async function OrganizationDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  
  // ✅ slug未定義なら即座に404
  if (!resolvedParams.slug || resolvedParams.slug === 'undefined') {
    logger.error('[VERIFY] slug missing or undefined:', { data: resolvedParams.slug });
    notFound();
  }
  
  const data = await getOrganizationData(resolvedParams.slug);

  if (!data) {
    logger.error('[VERIFY] organization data not found for slug:', { data: resolvedParams.slug });
    notFound();
  }

  const { organization, posts, services, case_studies, faqs, qa_entries } = data;
  const jsonLdArray = generateOrganizationPageJsonLd(organization, posts, services, case_studies, faqs);

  return (
    <>
      {/* Enhanced JSON-LD structured data with address and geo */}
      <OrganizationJsonLd 
        organization={organization} 
        includeGeo={!!(organization.lat && organization.lng)}
        includeContactInfo={true}
      />
      {/* FAQ JSON-LD for Q&A entries */}
      <FAQJsonLd 
        qaEntries={qa_entries}
        organization={organization}
        maxItems={50}
      />
      {/* Legacy JSON-LD for backward compatibility */}
      {jsonLdArray.slice(1).map((jsonLd, index) => (
        <script
          key={index + 1}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* パンくずナビ */}
          <nav className="flex mb-8 lg:mb-12" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 sm:space-x-3 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200 text-sm lg:text-base overflow-x-auto">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href="/organizations" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  企業ディレクトリ
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-semibold">{organization.name}</span>
              </li>
            </ol>
          </nav>

          {/* 企業情報 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-gray-200 overflow-hidden shadow-lg lg:shadow-xl">
            {/* ヘッダー部分 */}
            <div className="relative">
              {/* Background color */}
              <div className="absolute inset-0 bg-gray-50" />
              <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8">
                  {organization.logo_url ? (
                    <LogoImage
                      src={organization.logo_url}
                      alt={`${organization.name}のロゴ`}
                      size="xl"
                      organizationName={organization.name}
                    />
                  ) : (
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg mx-auto sm:mx-0">
                      <span className="text-white font-bold text-2xl lg:text-3xl">
                        {organization.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{organization.name}</h1>
                      <VerifiedBadge
                        verified={organization.verified}
                        isEligible={isVerifiedBadgeAllowed(organization.plan || 'trial')}
                        size="lg"
                        showLabel={true}
                      />
                    </div>
                    {organization.legal_form && (
                      <p className="text-lg lg:text-xl text-gray-600 mt-2">{organization.legal_form}</p>
                    )}
                    {organization.industries && organization.industries.length > 0 && (
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-4">
                        {organization.industries.map((industry, index) => (
                          <span 
                            key={index}
                            className="px-3 py-2 lg:px-4 bg-gray-100 text-gray-700 font-medium rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm text-sm lg:text-base"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 w-full lg:w-auto">
                  {organization.url && (
                    <a
                      href={organization.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] font-semibold rounded-xl lg:rounded-2xl px-4 py-3 lg:px-6 lg:py-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-h-[44px] text-sm lg:text-base"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      公式サイトを開く
                    </a>
                  )}
                  
                  {/* 通報ボタン */}
                  <div className="flex justify-end">
                    <ReportButton 
                      organizationId={organization.id}
                      organizationName={organization.name}
                    />
                  </div>
                </div>
              </div>

              {organization.description && (
                <div className="mt-6 lg:mt-8">
                  <p className="text-gray-700 text-lg lg:text-xl leading-relaxed text-center sm:text-left">
                    {organization.description}
                  </p>
                </div>
              )}
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="border-t border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">
                {/* 基本情報 */}
                <div className="bg-gray-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">基本情報</h2>
                  </div>
                  <dl className="space-y-4 lg:space-y-6">
                    {organization.representative_name && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">代表者</dt>
                        <dd className="text-base lg:text-lg text-gray-900">{organization.representative_name}</dd>
                      </div>
                    )}
                    {organization.established_at && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">設立</dt>
                        <dd className="text-base lg:text-lg text-gray-900">
                          {new Date(organization.established_at).toLocaleDateString('ja-JP')}
                        </dd>
                      </div>
                    )}
                    {organization.capital && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">資本金</dt>
                        <dd className="text-base lg:text-lg text-gray-900">{organization.capital.toLocaleString()}万円</dd>
                      </div>
                    )}
                    {organization.employees && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">従業員数</dt>
                        <dd className="text-base lg:text-lg text-gray-900">{organization.employees.toLocaleString()}名</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* 連絡先情報 */}
                {organization.show_contact !== false && (
                <div className="bg-gray-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">連絡先</h2>
                  </div>
                  <dl className="space-y-4 lg:space-y-6">
                    {/* 住所 */}
                    {(organization.address_region || organization.address_locality || organization.address_street) && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">所在地</dt>
                        <dd className="text-base lg:text-lg text-gray-900">
                          {organization.address_postal_code && `〒${organization.address_postal_code} `}
                          {organization.address_region}
                          {organization.address_locality}
                          {organization.address_street}
                        </dd>
                      </div>
                    )}
                    {organization.telephone && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">電話番号</dt>
                        <dd className="text-base lg:text-lg text-gray-900">
                          <a href={`tel:${organization.telephone}`} className="hover:text-emerald-600 transition-colors font-medium min-h-[44px] inline-flex items-center">
                            {organization.telephone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.email_public && organization.email && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">メールアドレス</dt>
                        <dd className="text-base lg:text-lg text-gray-900">
                          <a href={`mailto:${organization.email}`} className="hover:text-emerald-600 transition-colors font-medium min-h-[44px] inline-flex items-center">
                            {organization.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.url && (
                      <div className="bg-white rounded-xl lg:rounded-2xl p-4 border border-gray-100">
                        <dt className="text-sm font-semibold text-gray-600 mb-1">ウェブサイト</dt>
                        <dd className="text-base lg:text-lg text-gray-900">
                          <a 
                            href={organization.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium min-h-[44px] inline-flex items-center break-all"
                          >
                            {organization.url}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                )}
              </div>
            </div>

            {/* 所在地表示 */}
            {createFullAddress(organization) && (
              <div className="border-t border-gray-100">
                <div className="p-6 sm:p-8 lg:p-12">
                  <AddressDisplay
                    postalCode={organization.address_postal_code}
                    fullAddress={createFullAddress(organization)}
                    organizationName={organization.name}
                    showGoogleMapsLink={true}
                    showDirectionsLink={true}
                  />
                </div>
              </div>
            )}

            {/* 記事一覧 - 条件：show_posts が false でなく、かつ posts が存在して length > 0 */}
            {organization.show_posts !== false && posts && posts.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="p-8 sm:p-12">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 011 1.732l4 4a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">最新記事</h2>
                    </div>
                    {/* TODO: Re-enable posts list page when implemented:
                             href={`/o/${organization.slug}/posts`} */}
                    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 font-semibold rounded-2xl px-6 py-3 border border-gray-200 opacity-60">
                      記事一覧を見る（準備中）
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(0, 6).map((post) => (
                    <div
                      key={post.id}
                      className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-6 shadow-lg transition-all duration-300"
                    >
                      {/* TODO: Re-enable link when post detail page is implemented:
                           href={`/o/${organization.slug}/posts/${post.id}`} */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
                      {post.content_markdown && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {post.content_markdown.substring(0, 150)}...
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          post.status === 'published' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {post.status === 'published' ? '公開中' : '下書き'}
                        </span>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* サービス一覧 - 条件：show_services が false でなく、かつ services が存在して length > 0 */}
            {organization.show_services !== false && services && services.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">提供サービス</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service) => (
                    <div 
                      key={service.id} 
                      className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl overflow-hidden shadow-lg transition-all duration-300"
                    >
                      {/* TODO: Re-enable link when service detail page is implemented:
                           href={`/o/${organization.slug}/services/${service.id}`} */}
                      {/* サービス画像 */}
                      {service.image_url ? (
                        <div className="relative w-full h-48 bg-gray-100">
                          <Image
                            src={service.image_url}
                            alt={`${service.name}のサービス画像`}
                            width={400}
                            height={192}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          {service.category && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                              {service.category}
                            </span>
                          )}
                          {service.price && (
                            <span className="font-medium">¥{service.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 導入事例一覧 - 条件：show_case_studies が false でなく、かつ case_studies が存在して length > 0 */}
            {organization.show_case_studies !== false && case_studies && case_studies.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">導入事例</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {case_studies.map((caseStudy) => (
                    <div key={caseStudy.id} className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{caseStudy.title}</h3>
                        </div>
                      </div>
                      
                      {caseStudy.problem && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">課題</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.problem}</p>
                        </div>
                      )}
                      
                      {caseStudy.solution && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700">解決策</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.solution}</p>
                        </div>
                      )}
                      
                      {caseStudy.result && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700">成果</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.result}</p>
                        </div>
                      )}

                      {caseStudy.tags && caseStudy.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {caseStudy.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Q&A Knowledge Base - 条件：qa_entries が存在して length > 0 かつ show_qa が false でない */}
            {qa_entries && qa_entries.length > 0 && organization.show_qa !== false && (
              <div className="border-t border-gray-100">
                <div className="p-8 sm:p-12">
                  <QAPublicDisplay 
                    organizationSlug={organization.slug}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Legacy FAQ - 条件：show_faqs が false でなく、かつ faqs が存在して length > 0 */}
            {organization.show_faqs !== false && faqs && faqs.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-gray-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">よくある質問</h2>
                  </div>
                  <div className="space-y-6">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                        <details className="group">
                          <summary className="flex items-center justify-between p-4 cursor-pointer">
                            <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                            <svg 
                              className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="px-4 pb-4">
                            <p className="text-gray-600 whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="mt-16 text-center">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-2xl px-8 py-4 text-lg font-semibold text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              企業ディレクトリに戻る
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}