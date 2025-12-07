import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateServiceJsonLd, generateOrganizationJsonLd } from '@/lib/utils/jsonld';
import type { Organization, Service } from '@/types/legacy/database';;
import { logger } from '@/lib/utils/logger';

// P4-2: ISR設定（サービス一覧ページ）
export const revalidate = 600; // 10分間隔での再生成

// P4-2: generateStaticParams適用（公開組織サービス一覧の事前生成）
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

    // サービスを持つ公開中組織のslugsを取得
    const { data: orgs } = await supabase
      .from('organizations')
      .select('slug')
      .eq('status', 'published')
      .eq('is_published', true)
      .eq('show_services', true)
      .limit(100); // サービスページの制限

    if (!orgs) return [];

    return orgs
      .filter(org => org.slug)
      .map(org => ({ slug: org.slug }));
  } catch (error) {
    console.warn('[generateStaticParams] Failed to fetch organizations with services:', error);
    return [];
  }
}

interface ServicesPageData {
  organization: Organization;
  services: Service[];
}

async function getServicesData(slug: string): Promise<ServicesPageData | null> {
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
      services: result.data.services || []
    };
  } catch (error) {
    logger.error('Failed to fetch services data', { data: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getServicesData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'Services Not Found',
    };
  }

  const { organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `サービス一覧 | ${organization.name}`,
    description: `${organization.name}が提供するサービス一覧をご覧いただけます。`,
    openGraph: {
      title: `${organization.name} - サービス一覧`,
      description: `${organization.name}が提供するサービス一覧`,
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}/services`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/services`,
    },
  };
}

export default async function ServicesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const data = await getServicesData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { organization, services } = data;
  
  // JSON-LD構造化データ生成
  const jsonLdArray = [];
  
  // 組織情報
  jsonLdArray.push(generateOrganizationJsonLd(organization));
  
  // 各サービスのJSON-LD
  services.forEach(service => {
    jsonLdArray.push(generateServiceJsonLd(service, organization));
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
                <span className="text-gray-900 font-medium">サービス一覧</span>
              </li>
            </ol>
          </nav>

          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {organization.name} - サービス一覧
            </h1>
            <p className="text-lg text-gray-600">
              私たちが提供するサービスをご紹介します
            </p>
          </div>

          {/* サービス一覧 */}
          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/o/${organization.slug}/services/${service.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h2>
                    {service.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {service.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {service.category && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full">
                        {service.category}
                      </span>
                    )}
                    {service.price && (
                      <span className="text-lg font-bold text-green-600">
                        ¥{service.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {service.duration_months && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        サービス期間: {service.duration_months}ヶ月
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  サービス情報はまだ公開されていません
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