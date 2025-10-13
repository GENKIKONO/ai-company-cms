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
import { createFullAddress } from '@/lib/structured-data/organization';
import type { Organization, Post, Service, CaseStudy, FAQ, QAEntry } from '@/types/database';

interface OrganizationPageData {
  organization: Organization;
  posts: Post[];
  services: Service[];
  case_studies: CaseStudy[];
  faqs: FAQ[];
  qa_entries: QAEntry[];
}

// ✅ キャッシュ対応: 公開組織データ取得
import { unstable_cache } from 'next/cache';

const getOrganizationDataCached = (slug: string) =>
  unstable_cache(
    async (): Promise<OrganizationPageData | null> => {
      console.log(`[getOrganizationDataCached] Cache miss for slug: ${slug}`);
      
      // 🚫 匿名クライアントで公開データのみ取得（cookies/auth依存禁止）
      const { supabasePublic } = await import('@/lib/supabase-public');
      const supabase = supabasePublic();
      
      // ✅ 厳密な取得条件（status='published'かつis_published=true の企業のみ）
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_published', true)
        .maybeSingle();

      // ✅ VERIFY: Enhanced debugging for 404 issues with fallback diagnosis
      if (orgError || !organization) {
        console.error(`[VERIFY] Public page failed for slug: ${slug}`, {
          error: orgError?.message,
          requiredConditions: 'status=published AND is_published=true',
          client: 'anonymous'
        });
        
        // 🔍 Diagnostic fallback: Check individual conditions to identify mismatch
        const [statusCheck, publishedCheck, generalCheck] = await Promise.all([
          // Check if organization exists with status='published' only
          supabase
            .from('organizations')
            .select('slug, status, is_published')
            .eq('slug', slug)
            .eq('status', 'published')
            .maybeSingle(),
          
          // Check if organization exists with is_published=true only  
          supabase
            .from('organizations')
            .select('slug, status, is_published')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle(),
            
          // Check if organization exists at all
          supabase
            .from('organizations')
            .select('slug, status, is_published')
            .eq('slug', slug)
            .maybeSingle()
        ]);
        
        if (generalCheck.data) {
          const org = generalCheck.data;
          console.error(`[VERIFY] 404 ROOT CAUSE IDENTIFIED for ${slug}:`, {
            exists: true,
            status: org.status,
            is_published: org.is_published,
            hasStatusPublished: org.status === 'published',
            hasIsPublishedTrue: org.is_published === true,
            diagnosis: org.status !== 'published' 
              ? 'STATUS_NOT_PUBLISHED' 
              : org.is_published !== true 
                ? 'IS_PUBLISHED_FALSE'
                : 'UNKNOWN_ISSUE'
          });
          
          // 🚨 Data inconsistency detected - log for fixing
          if (org.status === 'published' && org.is_published === false) {
            console.error(`[VERIFY] DATA INCONSISTENCY: ${slug} has status=published but is_published=false`);
          } else if (org.status === 'draft' && org.is_published === true) {
            console.error(`[VERIFY] DATA INCONSISTENCY: ${slug} has status=draft but is_published=true`);
          }
        } else {
          console.warn(`[VERIFY] Organization not found at all: ${slug}`);
        }
        
        return null;
      }

      console.log(`[VERIFY] Public organization loaded successfully: ${organization.name} (${slug})`);

      // 公開されたコンテンツを並行取得
      const [postsResult, servicesResult, caseStudiesResult, faqsResult, qaEntriesResult] = await Promise.all([
        supabase
          .from('posts')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('services')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_studies')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('faqs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false }),
        
        supabase
          .from('qa_entries')
          .select(`
            *,
            qa_categories!left(id, name, slug)
          `)
          .eq('organization_id', organization.id)
          .eq('status', 'published')
          .eq('visibility', 'public')
          .order('published_at', { ascending: false })
          .limit(20)
      ]);

      return {
        organization,
        posts: postsResult.data || [],
        services: servicesResult.data || [],
        case_studies: caseStudiesResult.data || [],
        faqs: faqsResult.data || [],
        qa_entries: qaEntriesResult.data || []
      };
    },
    [`org-public-${slug}`],
    { 
      tags: [`org-public:${slug}`, `org-public`], 
      revalidate: 300 // 5分キャッシュ 
    }
  )();

async function getOrganizationData(slug: string): Promise<OrganizationPageData | null> {
  try {
    // ✅ キャッシュ付きの取得を使用
    return await getOrganizationDataCached(slug);
  } catch (error) {
    console.error('Failed to fetch organization data:', error);
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
    title: organization.meta_title || `${organization.name} - AIO Hub企業ディレクトリ`,
    description: organization.meta_description || organization.description || `${organization.name}の企業情報、サービス、記事を紹介します。`,
    keywords: organization.meta_keywords?.join(', '),
    openGraph: {
      title: organization.name,
      description: organization.description || '',
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}`,
      siteName: 'AIO Hub企業ディレクトリ',
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
    console.error('[VERIFY] slug missing or undefined:', resolvedParams.slug);
    notFound();
  }
  
  const data = await getOrganizationData(resolvedParams.slug);

  if (!data) {
    console.error('[VERIFY] organization data not found for slug:', resolvedParams.slug);
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
                <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                  企業ディレクトリ
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{organization.name}</span>
              </li>
            </ol>
          </nav>

          {/* 企業情報 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* ヘッダー部分 */}
            <div className="px-6 py-8 sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {organization.logo_url ? (
                    <LogoImage
                      src={organization.logo_url}
                      alt={`${organization.name}のロゴ`}
                      size="xl"
                      organizationName={organization.name}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-2xl">
                        {organization.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-6">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                      {organization.verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>認証済み法人</span>
                        </div>
                      )}
                    </div>
                    {organization.legal_form && (
                      <p className="text-lg text-gray-600 mt-1">{organization.legal_form}</p>
                    )}
                    {organization.industries && organization.industries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {organization.industries.map((industry, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {organization.url && (
                    <Link
                      href={organization.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      公式サイトを開く
                    </Link>
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
                <div className="mt-6">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {organization.description}
                  </p>
                </div>
              )}
            </div>

            {/* 詳細情報 */}
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
                {/* 基本情報 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
                  <dl className="space-y-3">
                    {organization.representative_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">代表者</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.representative_name}</dd>
                      </div>
                    )}
                    {organization.established_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">設立</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(organization.established_at).toLocaleDateString('ja-JP')}
                        </dd>
                      </div>
                    )}
                    {organization.capital && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">資本金</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.capital.toLocaleString()}万円</dd>
                      </div>
                    )}
                    {organization.employees && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">従業員数</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.employees.toLocaleString()}名</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* 連絡先情報 */}
                {organization.show_contact !== false && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">連絡先</h2>
                  <dl className="space-y-3">
                    {/* 住所 */}
                    {(organization.address_region || organization.address_locality || organization.address_street) && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">所在地</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {organization.address_postal_code && `〒${organization.address_postal_code} `}
                          {organization.address_region}
                          {organization.address_locality}
                          {organization.address_street}
                        </dd>
                      </div>
                    )}
                    {organization.telephone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`tel:${organization.telephone}`} className="hover:text-blue-600">
                            {organization.telephone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.email_public && organization.email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`mailto:${organization.email}`} className="hover:text-blue-600">
                            {organization.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.url && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ウェブサイト</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a 
                            href={organization.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
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
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
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

            {/* 記事一覧 */}
            {posts && posts.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">最新記事</h2>
                    <Link
                      href={`/o/${organization.slug}/posts`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      記事一覧を見る →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.slice(0, 6).map((post) => (
                      <Link
                        key={post.id}
                        href={`/o/${organization.slug}/posts/${post.id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
                        {post.content_markdown && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                            {post.content_markdown.substring(0, 150)}...
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.status === 'published' ? '公開中' : '下書き'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* サービス一覧 */}
            {services && services.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">提供サービス</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <Link 
                        key={service.id} 
                        href={`/o/${organization.slug}/services/${service.id}`}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 block"
                      >
                        {/* サービス画像 */}
                        {service.image_url ? (
                          <div className="relative w-full h-48 bg-gray-100">
                            <Image
                              src={service.image_url}
                              alt={`${service.name}のサービス画像`}
                              width={1200}
                              height={630}
                              className="w-full h-64 md:h-72 object-cover rounded-md shadow-sm"
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
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 事例一覧 */}
            {case_studies && case_studies.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">導入事例</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {case_studies.map((caseStudy) => (
                      <div key={caseStudy.id} className="border border-gray-200 rounded-lg p-6">
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
                                className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full"
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

            {/* Q&A Knowledge Base */}
            {qa_entries && qa_entries.length > 0 && organization.show_qa !== false && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <QAPublicDisplay 
                    organizationSlug={organization.slug}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Legacy FAQ */}
            {faqs && faqs.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">よくある質問 (旧形式)</h2>
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-lg">
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
          <div className="mt-12 text-center">
            <Link 
              href="/organizations"
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
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