import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateServiceJsonLd } from '@/lib/utils/jsonld';
import type { Organization, Service } from '@/types/database';
import { LogoImage } from '@/components/ui/optimized-image';

interface ServiceDetailData {
  service: Service;
  organization: Organization;
}

async function getServiceData(slug: string, serviceId: string): Promise<ServiceDetailData | null> {
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
    const services = orgResult.data.services || [];
    
    // サービス詳細を検索
    const service = services.find((s: Service) => s.id === serviceId);
    
    if (!service) {
      return null;
    }

    return {
      service,
      organization
    };
  } catch (error) {
    console.error('Failed to fetch service data:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getServiceData(resolvedParams.slug, resolvedParams.id);

  if (!data) {
    return {
      title: 'Service Not Found',
    };
  }

  const { service, organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${service.name} | ${organization.name}`,
    description: service.description || `${organization.name}が提供する${service.name}サービスの詳細情報です。`,
    openGraph: {
      title: service.name,
      description: service.description || '',
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}/services/${service.id}`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/services/${service.id}`,
    },
  };
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const resolvedParams = await params;
  const data = await getServiceData(resolvedParams.slug, resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { service, organization } = data;
  const jsonLd = generateServiceJsonLd(service, organization);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
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
                <Link href={`/o/${organization.slug}/services`} className="text-gray-500 hover:text-gray-700">
                  サービス一覧
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{service.name}</span>
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

          {/* サービス詳細 */}
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* サービスヘッダー */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {service.name}
                  </h1>
                  {service.category && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full">
                      {service.category}
                    </span>
                  )}
                </div>
                {service.price && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      ¥{service.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">（税別）</div>
                  </div>
                )}
              </div>
              
              {service.description && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>

            {/* サービス詳細情報 */}
            <div className="px-6 py-8">
              {/* サービス期間 */}
              {service.duration_months && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">サービス期間</h2>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {service.duration_months}ヶ月間のサービス提供
                    </p>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* お問い合わせ・連絡先 */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">お問い合わせ</h2>
            <p className="text-gray-700 mb-4">
              {service.name}に関するご質問やお見積もりのご依頼は、お気軽にお問い合わせください。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {organization.email && (
                <a 
                  href={`mailto:${organization.email}?subject=${encodeURIComponent(`${service.name}について`)}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  メールでお問い合わせ
                </a>
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
              href={`/o/${organization.slug}/services`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              サービス一覧に戻る
            </Link>
            
            <Link 
              href={`/o/${organization.slug}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {organization.name} トップページへ
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}