import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { generateNextMetadata } from '@/lib/ogp';
import { generateAllJsonLd, toE164, OrganizationData, ServiceData, FAQData, CaseStudyData } from '@/lib/jsonld';
import OrganizationPublicPage from '@/components/OrganizationPublicPage';
import Script from 'next/script';

interface Props {
  params: { slug: string };
}

// メタデータ生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = supabaseServer();
  
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, description, slug, logo_url, url, industries, address_locality, address_region, founded')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!organization) {
    return {
      title: 'ページが見つかりません | LuxuCare',
      description: '指定された企業ページは存在しません。',
      robots: 'noindex, nofollow'
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://luxucare.jp';
  const pageUrl = `${baseUrl}/o/${organization.slug}`;
  
  // キーワード生成
  const keywords = [
    organization.name,
    ...(organization.industries || []),
    organization.address_locality,
    organization.address_region,
    '企業情報',
    'ビジネス',
    'LuxuCare'
  ].filter(Boolean);

  // OGP画像生成パラメータ
  const ogpParams = new URLSearchParams({
    title: organization.name,
    subtitle: organization.industries?.[0] || '企業情報',
    template: 'corporate',
    colorScheme: 'blue'
  });

  const ogpImageUrl = organization.logo_url || `${baseUrl}/api/ogp/generate?${ogpParams.toString()}`;

  return {
    title: `${organization.name} | LuxuCare`,
    description: organization.description.length > 155 
      ? organization.description.substring(0, 155) + '...' 
      : organization.description,
    keywords: keywords.join(', '),
    authors: [{ name: 'LuxuCare' }],
    creator: 'LuxuCare',
    publisher: 'LuxuCare',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${organization.name} | LuxuCare`,
      description: organization.description,
      url: pageUrl,
      siteName: 'LuxuCare',
      images: [
        {
          url: ogpImageUrl,
          width: 1200,
          height: 630,
          alt: `${organization.name}の企業情報`,
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${organization.name} | LuxuCare`,
      description: organization.description,
      images: [ogpImageUrl],
      creator: '@luxucare_jp',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// ページコンポーネント
export default async function OrganizationPage({ params }: Props) {
  const supabase = supabaseServer();
  
  // 企業情報を取得
  const { data: organization, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      legal_form,
      representative_name,
      founded,
      capital,
      employees,
      address_country,
      address_region,
      address_locality,
      street_address,
      postal_code,
      telephone,
      email,
      email_public,
      url,
      logo_url,
      same_as,
      industries,
      status,
      created_at,
      updated_at,
      partner_id,
      services!org_id(
        id,
        name,
        description,
        features,
        price_range,
        url,
        created_at
      ),
      case_studies!org_id(
        id,
        title,
        problem,
        solution,
        outcome,
        metrics,
        client_name,
        client_industry,
        is_anonymous,
        created_at
      ),
      faqs!org_id(
        id,
        question,
        answer,
        category,
        order_index,
        created_at
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !organization) {
    notFound();
  }

  // パートナー情報を取得
  let partner = null;
  if (organization.partner_id) {
    const { data: partnerData } = await supabase
      .from('partners')
      .select('id, name, brand_logo_url')
      .eq('id', organization.partner_id)
      .single();
    
    partner = partnerData;
  }

  // FAQをソート
  const sortedFaqs = organization.faqs?.sort((a: any, b: any) => 
    (a.order_index || 0) - (b.order_index || 0)
  ) || [];

  // JSON-LD構造化データを生成
  const organizationData: OrganizationData = {
    name: organization.name,
    url: organization.url || `https://luxucare.jp/o/${organization.slug}`,
    logoUrl: organization.logo_url || undefined,
    description: organization.description,
    founded: organization.founded || undefined,
    streetAddress: organization.street_address || undefined,
    addressLocality: organization.address_locality || '',
    addressRegion: organization.address_region || '',
    postalCode: organization.postal_code || undefined,
    telephoneE164: organization.telephone ? toE164(organization.telephone) : '',
    email: organization.email_public ? organization.email : undefined,
    areaServed: organization.industries || undefined,
    sameAs: organization.same_as || undefined
  };

  const servicesData: ServiceData[] = (organization.services || []).map(service => ({
    name: service.name,
    summary: service.description,
    features: service.features || undefined,
    category: undefined,
    priceNumeric: undefined,
    ctaUrl: service.url || undefined,
    org: {
      name: organization.name,
      url: organization.url || `https://luxucare.jp/o/${organization.slug}`
    }
  }));

  const faqsData: FAQData[] = sortedFaqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  }));

  const caseStudiesData: CaseStudyData[] = (organization.case_studies || []).map(caseStudy => ({
    title: caseStudy.title,
    clientType: caseStudy.client_industry || undefined,
    problem: caseStudy.problem || undefined,
    solution: caseStudy.solution || undefined,
    outcome: caseStudy.outcome || undefined,
    metrics: caseStudy.metrics || undefined,
    publishedAt: caseStudy.created_at || undefined,
    org: {
      name: organization.name
    }
  }));

  const jsonLdBlocks = generateAllJsonLd(organizationData, servicesData, faqsData, caseStudiesData);

  const pageData = {
    organization: {
      ...organization,
      services: organization.services || [],
      case_studies: organization.case_studies || [],
      faqs: sortedFaqs
    },
    partner
  };

  return (
    <>
      {/* JSON-LD構造化データ */}
      {jsonLdBlocks.map((jsonLd, index) => (
        <Script
          key={index}
          id={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      <OrganizationPublicPage data={pageData} />
    </>
  );
}

// 静的ページ生成のためのパス生成
export async function generateStaticParams() {
  const supabase = supabaseServer();
  
  const { data: organizations } = await supabase
    .from('organizations')
    .select('slug')
    .eq('status', 'published');

  if (!organizations) return [];

  return organizations.map((org) => ({
    slug: org.slug,
  }));
}