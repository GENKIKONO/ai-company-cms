// OGP生成とメタデータ管理

export interface OGPMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}

export interface TwitterCardMetadata {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image?: string;
  site?: string;
  creator?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  viewport?: string;
}

// 企業用OGPメタデータ生成
export function generateOrganizationOGP(organization: {
  name: string;
  description: string;
  slug: string;
  logo_url?: string;
  url?: string;
  industries?: string[];
}): OGPMetadata | null {
  // Safety guard: prevent OGP generation when slug is undefined/empty
  if (!organization.slug || organization.slug.trim() === '') {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aiohub.jp';
  const pageUrl = `${baseUrl}/o/${organization.slug}`;
  
  // OGP画像の自動生成パラメータ
  const ogpParams = new URLSearchParams({
    title: organization.name,
    subtitle: organization.industries?.[0] || '企業情報',
    template: 'corporate',
    colorScheme: 'blue'
  });
  
  const ogpImageUrl = organization.logo_url || `${baseUrl}/api/ogp/generate?${ogpParams.toString()}`;
  
  return {
    title: `${organization.name} | AIO Hub`,
    description: organization.description.length > 155 
      ? organization.description.substring(0, 155) + '...' 
      : organization.description,
    image: ogpImageUrl,
    url: pageUrl,
    type: 'website',
    siteName: 'AIO Hub',
    locale: 'ja_JP'
  };
}

// Twitter Card メタデータ生成
export function generateTwitterCard(organization: {
  name: string;
  description: string;
  slug: string;
  logo_url?: string;
}): TwitterCardMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aiohub.example.com';
  
  return {
    card: 'summary_large_image',
    title: organization.name,
    description: organization.description,
    image: organization.logo_url || `${baseUrl}/api/ogp/generate?company=${encodeURIComponent(organization.name)}`,
    site: '@aiohub',
    creator: '@aiohub'
  };
}

// SEO メタデータ生成
export function generateSEOMetadata(organization: {
  name: string;
  description: string;
  slug: string;
  industries?: string[];
}): SEOMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aiohub.example.com';
  
  // キーワード生成
  const keywords = [
    organization.name,
    '企業情報',
    '会社概要',
    '企業',
    ...(organization.industries || [])
  ];

  return {
    title: `${organization.name} - 企業情報 | AIO Hub`,
    description: organization.description,
    keywords,
    canonical: `${baseUrl}/o/${organization.slug}`,
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1'
  };
}

// Next.js Metadata オブジェクト生成
export function generateNextMetadata(organization: {
  name: string;
  description: string;
  slug: string;
  logo_url?: string;
  url?: string;
  industries?: string[];
}) {
  const ogp = generateOrganizationOGP(organization);
  const twitter = generateTwitterCard(organization);
  const seo = generateSEOMetadata(organization);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords?.join(', '),
    authors: [{ name: 'AIO Hub' }],
    robots: seo.robots,
    viewport: seo.viewport,
    canonical: seo.canonical,
    
    openGraph: {
      title: ogp.title,
      description: ogp.description,
      url: ogp.url,
      siteName: ogp.siteName,
      images: ogp.image ? [
        {
          url: ogp.image,
          width: 1200,
          height: 630,
          alt: ogp.title
        }
      ] : [],
      locale: ogp.locale,
      type: ogp.type
    },
    
    twitter: {
      card: twitter.card,
      title: twitter.title,
      description: twitter.description,
      images: twitter.image ? [twitter.image] : [],
      creator: twitter.creator,
      site: twitter.site
    },
    
    // 構造化データ (JSON-LD)
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organization.name,
        description: organization.description,
        url: organization.url,
        logo: organization.logo_url,
        sameAs: [],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'JP'
        }
      })
    }
  };
}

// OGP画像生成オプション
export interface OGPImageOptions {
  companyName: string;
  description?: string;
  logoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  template?: 'default' | 'modern' | 'minimal';
}

// OGP画像生成API呼び出し
export async function generateOGPImage(options: OGPImageOptions): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/ogp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'OGP画像生成に失敗しました'
      };
    }

    const result = await response.json();
    return {
      success: true,
      imageUrl: result.image.dataUrl
    };

  } catch (error) {
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
}

// 画像最適化API呼び出し
export async function optimizeImage(file: File, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}): Promise<{
  success: boolean;
  result?: any;
  imageData?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetch('/api/images/optimize', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '画像最適化に失敗しました'
      };
    }

    const result = await response.json();
    return {
      success: true,
      result: result.result,
      imageData: result.imageData
    };

  } catch (error) {
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
}

// カラーパレット定義
export const OGP_COLOR_PALETTES = {
  default: {
    backgroundColor: '#1a365d',
    textColor: '#2d3748',
    accentColor: '#3182ce'
  },
  modern: {
    backgroundColor: '#2d3748',
    textColor: '#4a5568',
    accentColor: '#38b2ac'
  },
  minimal: {
    backgroundColor: '#f7fafc',
    textColor: '#2d3748',
    accentColor: '#4299e1'
  },
  corporate: {
    backgroundColor: '#1a202c',
    textColor: '#e2e8f0',
    accentColor: '#63b3ed'
  },
  warm: {
    backgroundColor: '#742a2a',
    textColor: '#fed7d7',
    accentColor: '#f56565'
  }
};

// プリセットテンプレート
export function getOGPTemplate(template: string = 'default') {
  return OGP_COLOR_PALETTES[template as keyof typeof OGP_COLOR_PALETTES] || OGP_COLOR_PALETTES.default;
}