// JSON-LD生成ユーティリティ（空キー省略対応）

export type OrganizationData = {
  name: string;
  url: string;
  logoUrl?: string;
  description: string;
  founded?: string;
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  telephoneE164: string;
  email?: string;
  areaServed?: string[];
  sameAs?: string[];
};

export type ServiceData = {
  name: string;
  summary: string;
  features?: string[];
  category?: string;
  priceNumeric?: number;
  ctaUrl?: string;
  org: {
    name: string;
    url: string;
  };
};

export type FAQData = {
  question: string;
  answer: string;
};

export type CaseStudyData = {
  title: string;
  clientType?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, string | number>;
  publishedAt?: string;
  org: {
    name: string;
  };
};

// 空値を除外するヘルパー関数
const omitEmpty = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.filter(item => item !== null && item !== undefined && item !== '');
  }
  
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            result[key] = omitEmpty(value);
          }
        } else if (typeof value === 'object') {
          const cleanedValue = omitEmpty(value);
          if (Object.keys(cleanedValue).length > 0) {
            result[key] = cleanedValue;
          }
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
  
  return obj;
};

// E.164電話番号変換
export const toE164 = (telephone: string): string => {
  const digits = telephone.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) return `+81${digits.slice(1)}`;
  if (digits.startsWith('81')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+81${digits}`;
};

// Organization JSON-LD生成
export const generateOrganizationJsonLd = (data: OrganizationData) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logoUrl,
    description: data.description,
    foundingDate: data.founded,
    inLanguage: 'ja',
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.streetAddress,
      addressLocality: data.addressLocality,
      addressRegion: data.addressRegion,
      postalCode: data.postalCode,
      addressCountry: 'JP'
    },
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: data.telephoneE164,
      email: data.email,
      areaServed: data.areaServed,
      availableLanguage: ['ja']
    }],
    sameAs: data.sameAs
  };

  return omitEmpty(jsonLd);
};

// Service JSON-LD生成
export const generateServiceJsonLd = (data: ServiceData) => {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    provider: { 
      '@type': 'Organization', 
      name: data.org.name, 
      url: data.org.url 
    },
    description: data.summary,
    category: data.category,
    hasOfferCatalog: data.features && data.features.length > 0 ? {
      '@type': 'OfferCatalog',
      name: `${data.name}の特徴`,
      itemListElement: data.features.map((feature, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: feature
        }
      }))
    } : undefined
  };

  // 価格がある場合のみoffers追加
  if (data.priceNumeric && data.priceNumeric > 0) {
    jsonLd.offers = {
      '@type': 'Offer',
      priceCurrency: 'JPY',
      price: data.priceNumeric.toString(),
      url: data.ctaUrl,
      availability: 'https://schema.org/InStock'
    };
  }

  return omitEmpty(jsonLd);
};

// FAQPage JSON-LD生成
export const generateFAQPageJsonLd = (faqs: FAQData[]) => {
  if (!faqs || faqs.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { 
        '@type': 'Answer', 
        text: faq.answer 
      }
    }))
  };

  return omitEmpty(jsonLd);
};

// CaseStudy JSON-LD生成
export const generateCaseStudyJsonLd = (data: CaseStudyData) => {
  const bodyParts = [
    data.problem ? `課題: ${data.problem}` : '',
    data.solution ? `解決策: ${data.solution}` : '',
    data.outcome ? `成果: ${data.outcome}` : ''
  ];

  // メトリクスがある場合は追加
  if (data.metrics && Object.keys(data.metrics).length > 0) {
    const metricsText = Object.entries(data.metrics)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    bodyParts.push(`数値指標: ${metricsText}`);
  }

  const articleBody = bodyParts.filter(Boolean).join('\n\n');

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'CaseStudy',
    headline: data.title,
    about: data.clientType,
    author: { 
      '@type': 'Organization', 
      name: data.org.name 
    },
    datePublished: data.publishedAt,
    articleBody: articleBody || undefined,
    inLanguage: 'ja'
  };

  // メトリクスを構造化データとして追加
  if (data.metrics && Object.keys(data.metrics).length > 0) {
    jsonLd.measurementTechnique = Object.keys(data.metrics);
    jsonLd.variableMeasured = Object.entries(data.metrics).map(([key, value]) => ({
      '@type': 'PropertyValue',
      name: key,
      value: value.toString()
    }));
  }

  return omitEmpty(jsonLd);
};

// 複数のJSON-LDをまとめて生成
export const generateAllJsonLd = (organization: OrganizationData, services?: ServiceData[], faqs?: FAQData[], caseStudies?: CaseStudyData[]) => {
  const jsonLdBlocks = [];

  // Organization
  jsonLdBlocks.push(generateOrganizationJsonLd(organization));

  // Services
  if (services && services.length > 0) {
    services.forEach(service => {
      jsonLdBlocks.push(generateServiceJsonLd(service));
    });
  }

  // FAQPage
  if (faqs && faqs.length > 0) {
    const faqJsonLd = generateFAQPageJsonLd(faqs);
    if (faqJsonLd) {
      jsonLdBlocks.push(faqJsonLd);
    }
  }

  // CaseStudies
  if (caseStudies && caseStudies.length > 0) {
    caseStudies.forEach(caseStudy => {
      jsonLdBlocks.push(generateCaseStudyJsonLd(caseStudy));
    });
  }

  return jsonLdBlocks.filter(Boolean);
};