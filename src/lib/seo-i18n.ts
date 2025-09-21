'use client';

import { type Locale, locales, localeNames } from '@/i18n';

export interface LocalizedMetadata {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: {
    title: string;
    description: string;
    url?: string;
    siteName?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    locale: string;
    type?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
  };
  alternateUrls?: Record<Locale, string>;
  canonical?: string;
}

export interface OrganizationSEO {
  name: string;
  description: string;
  website?: string;
  logo?: string;
  industry?: string;
  address?: string;
  foundedYear?: number;
  employeeCount?: string;
  services?: string[];
  technologies?: string[];
}

class SEOInternationalizationService {
  generateMetadata(
    locale: Locale,
    pageType: 'home' | 'directory' | 'organization' | 'search' | 'dashboard',
    data?: any
  ): LocalizedMetadata {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxucare.example.com';
    
    switch (pageType) {
      case 'home':
        return this.generateHomeMetadata(locale, baseUrl);
      case 'directory':
        return this.generateDirectoryMetadata(locale, baseUrl);
      case 'organization':
        return this.generateOrganizationMetadata(locale, baseUrl, data);
      case 'search':
        return this.generateSearchMetadata(locale, baseUrl, data);
      case 'dashboard':
        return this.generateDashboardMetadata(locale, baseUrl);
      default:
        return this.generateDefaultMetadata(locale, baseUrl);
    }
  }

  private generateHomeMetadata(locale: Locale, baseUrl: string): LocalizedMetadata {
    const titles: Record<Locale, string> = {
      ja: 'LuxuCare - AI対応企業情報管理システム',
      en: 'LuxuCare - AI-Powered Enterprise Information System',
      zh: 'LuxuCare - AI驱动的企业信息管理系统',
      ko: 'LuxuCare - AI 기반 기업 정보 관리 시스템',
      es: 'LuxuCare - Sistema de Gestión Empresarial con IA',
      fr: 'LuxuCare - Système de Gestion d\'Entreprise alimenté par l\'IA',
      de: 'LuxuCare - KI-gestütztes Unternehmens-Informationssystem',
    };

    const descriptions: Record<Locale, string> = {
      ja: 'JSON-LD構造化データ対応、SEO最適化された企業情報CMSです。AIを活用したテキスト抽出機能で、効率的なコンテンツ作成を支援します。',
      en: 'SEO-optimized enterprise CMS with JSON-LD structured data support. AI-powered text extraction for efficient content creation.',
      zh: '支持JSON-LD结构化数据的SEO优化企业CMS。AI驱动的文本提取功能，实现高效内容创作。',
      ko: 'JSON-LD 구조화 데이터를 지원하는 SEO 최적화된 기업 CMS입니다. AI 기반 텍스트 추출로 효율적인 콘텐츠 제작을 지원합니다.',
      es: 'CMS empresarial optimizado para SEO con soporte de datos estructurados JSON-LD. Extracción de texto impulsada por IA para creación eficiente de contenido.',
      fr: 'CMS d\'entreprise optimisé SEO avec support de données structurées JSON-LD. Extraction de texte alimentée par l\'IA pour une création de contenu efficace.',
      de: 'SEO-optimiertes Unternehmens-CMS mit JSON-LD strukturierten Daten. KI-gestützte Textextraktion für effiziente Inhaltserstellung.',
    };

    return {
      title: titles[locale],
      description: descriptions[locale],
      keywords: ['AI', 'CMS', 'SEO', 'JSON-LD', 'enterprise', 'business', 'management'],
      openGraph: {
        title: titles[locale],
        description: descriptions[locale],
        url: `${baseUrl}/${locale}`,
        siteName: 'LuxuCare',
        images: [{
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: titles[locale],
        }],
        locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: titles[locale],
        description: descriptions[locale],
        images: [`${baseUrl}/og-image.png`],
      },
      alternateUrls: this.generateAlternateUrls(baseUrl, ''),
      canonical: `${baseUrl}/${locale}`,
    };
  }

  private generateDirectoryMetadata(locale: Locale, baseUrl: string): LocalizedMetadata {
    const titles: Record<Locale, string> = {
      ja: '企業ディレクトリ - LuxuCare',
      en: 'Business Directory - LuxuCare',
      zh: '企业目录 - LuxuCare',
      ko: '기업 디렉토리 - LuxuCare',
      es: 'Directorio de Empresas - LuxuCare',
      fr: 'Répertoire d\'Entreprises - LuxuCare',
      de: 'Unternehmensverzeichnis - LuxuCare',
    };

    const descriptions: Record<Locale, string> = {
      ja: '世界中の企業情報を検索・発見できる包括的なビジネスディレクトリ。業界、地域、技術スタックで絞り込み検索が可能です。',
      en: 'Comprehensive business directory to search and discover companies worldwide. Filter by industry, region, and technology stack.',
      zh: '全面的企业目录，可搜索和发现全球公司。按行业、地区和技术栈筛选。',
      ko: '전 세계 기업 정보를 검색하고 발견할 수 있는 종합 비즈니스 디렉토리. 업계, 지역, 기술 스택별 필터링 가능.',
      es: 'Directorio empresarial integral para buscar y descubrir empresas en todo el mundo. Filtrar por industria, región y stack tecnológico.',
      fr: 'Répertoire d\'entreprises complet pour rechercher et découvrir des entreprises dans le monde entier. Filtrer par industrie, région et stack technologique.',
      de: 'Umfassendes Unternehmensverzeichnis zum Suchen und Entdecken von Unternehmen weltweit. Nach Branche, Region und Technologie-Stack filtern.',
    };

    return {
      title: titles[locale],
      description: descriptions[locale],
      keywords: ['business', 'directory', 'companies', 'enterprise', 'search', 'filter'],
      openGraph: {
        title: titles[locale],
        description: descriptions[locale],
        url: `${baseUrl}/${locale}/directory`,
        siteName: 'LuxuCare',
        images: [{
          url: `${baseUrl}/og-directory.png`,
          width: 1200,
          height: 630,
          alt: titles[locale],
        }],
        locale,
        type: 'website',
      },
      alternateUrls: this.generateAlternateUrls(baseUrl, '/directory'),
      canonical: `${baseUrl}/${locale}/directory`,
    };
  }

  private generateOrganizationMetadata(locale: Locale, baseUrl: string, org?: OrganizationSEO): LocalizedMetadata {
    if (!org) {
      return this.generateDefaultMetadata(locale, baseUrl);
    }

    const title = `${org.name} - LuxuCare`;
    const description = org.description || `Discover ${org.name} - ${org.industry || 'Business'} company information, services, and insights.`;

    return {
      title,
      description,
      keywords: [
        org.name,
        ...(org.industry ? [org.industry] : []),
        ...(org.services || []),
        ...(org.technologies || []),
        'company',
        'business',
        'enterprise',
      ],
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${locale}/organizations/${org.name}`,
        siteName: 'LuxuCare',
        images: [{
          url: org.logo || `${baseUrl}/default-org-image.png`,
          width: 1200,
          height: 630,
          alt: `${org.name} Logo`,
        }],
        locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [org.logo || `${baseUrl}/default-org-image.png`],
      },
      alternateUrls: this.generateAlternateUrls(baseUrl, `/organizations/${org.name}`),
      canonical: `${baseUrl}/${locale}/organizations/${org.name}`,
    };
  }

  private generateSearchMetadata(locale: Locale, baseUrl: string, searchData?: { query?: string; filters?: any }): LocalizedMetadata {
    const baseTitle = locale === 'ja' ? '高度検索' : 'Advanced Search';
    const title = searchData?.query 
      ? `"${searchData.query}" の検索結果 - LuxuCare`
      : `${baseTitle} - LuxuCare`;

    const description = searchData?.query
      ? `Search results for "${searchData.query}" in our comprehensive business directory.`
      : 'Advanced search for companies with powerful filtering options by industry, region, technology stack, and more.';

    return {
      title,
      description,
      keywords: ['search', 'filter', 'companies', 'business', 'directory', 'advanced'],
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${locale}/search`,
        siteName: 'LuxuCare',
        locale,
        type: 'website',
      },
      alternateUrls: this.generateAlternateUrls(baseUrl, '/search'),
      canonical: `${baseUrl}/${locale}/search`,
    };
  }

  private generateDashboardMetadata(locale: Locale, baseUrl: string): LocalizedMetadata {
    const titles: Record<Locale, string> = {
      ja: 'ダッシュボード - LuxuCare',
      en: 'Dashboard - LuxuCare',
      zh: '仪表板 - LuxuCare',
      ko: '대시보드 - LuxuCare',
      es: 'Panel - LuxuCare',
      fr: 'Tableau de bord - LuxuCare',
      de: 'Dashboard - LuxuCare',
    };

    return {
      title: titles[locale],
      description: 'Management dashboard for LuxuCare platform',
      canonical: `${baseUrl}/${locale}/dashboard`,
    };
  }

  private generateDefaultMetadata(locale: Locale, baseUrl: string): LocalizedMetadata {
    return {
      title: 'LuxuCare',
      description: 'AI-powered enterprise information management system',
      canonical: `${baseUrl}/${locale}`,
    };
  }

  private generateAlternateUrls(baseUrl: string, path: string): Record<Locale, string> {
    const alternates: Record<Locale, string> = {} as Record<Locale, string>;
    
    locales.forEach(locale => {
      alternates[locale] = `${baseUrl}/${locale}${path}`;
    });

    return alternates;
  }

  generateStructuredData(
    locale: Locale,
    pageType: 'organization' | 'website' | 'breadcrumb',
    data?: any
  ): Record<string, any> {
    switch (pageType) {
      case 'organization':
        return this.generateOrganizationStructuredData(data);
      case 'website':
        return this.generateWebsiteStructuredData(locale);
      case 'breadcrumb':
        return this.generateBreadcrumbStructuredData(data);
      default:
        return {};
    }
  }

  private generateOrganizationStructuredData(org: OrganizationSEO): Record<string, any> {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      description: org.description,
    };

    if (org.website) {
      structuredData.url = org.website;
    }

    if (org.logo) {
      structuredData.logo = org.logo;
    }

    if (org.address) {
      structuredData.address = {
        '@type': 'PostalAddress',
        addressLocality: org.address,
      };
    }

    if (org.foundedYear) {
      structuredData.foundingDate = org.foundedYear.toString();
    }

    if (org.industry) {
      structuredData.knowsAbout = org.industry;
    }

    if (org.services && org.services.length > 0) {
      structuredData.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: org.services.map((service, index) => ({
          '@type': 'Offer',
          name: service,
          position: index + 1,
        })),
      };
    }

    return structuredData;
  }

  private generateWebsiteStructuredData(locale: Locale): Record<string, any> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxucare.example.com';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LuxuCare',
      description: 'AI-powered enterprise information management system',
      url: baseUrl,
      inLanguage: locale,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/${locale}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  private generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  generateHrefLangTags(baseUrl: string, path: string): Array<{ hrefLang: string; href: string }> {
    const hrefLangTags: Array<{ hrefLang: string; href: string }> = [];

    // Add x-default
    hrefLangTags.push({
      hrefLang: 'x-default',
      href: `${baseUrl}/ja${path}`, // Default to Japanese
    });

    // Add each locale
    locales.forEach(locale => {
      hrefLangTags.push({
        hrefLang: locale,
        href: `${baseUrl}/${locale}${path}`,
      });
    });

    return hrefLangTags;
  }

  generateSitemapUrls(baseUrl: string): Array<{ url: string; lastmod: string; changefreq: string; priority: string; alternates: Record<string, string> }> {
    const now = new Date().toISOString().split('T')[0];
    const urls: Array<any> = [];

    // Homepage
    const homeAlternates: Record<string, string> = {};
    locales.forEach(locale => {
      homeAlternates[locale] = `${baseUrl}/${locale}`;
    });

    urls.push({
      url: `${baseUrl}/ja`, // Default URL
      lastmod: now,
      changefreq: 'daily',
      priority: '1.0',
      alternates: homeAlternates,
    });

    // Directory pages
    const directoryAlternates: Record<string, string> = {};
    locales.forEach(locale => {
      directoryAlternates[locale] = `${baseUrl}/${locale}/directory`;
    });

    urls.push({
      url: `${baseUrl}/ja/directory`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.8',
      alternates: directoryAlternates,
    });

    // Search pages
    const searchAlternates: Record<string, string> = {};
    locales.forEach(locale => {
      searchAlternates[locale] = `${baseUrl}/${locale}/search`;
    });

    urls.push({
      url: `${baseUrl}/ja/search`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.7',
      alternates: searchAlternates,
    });

    return urls;
  }
}

export const seoI18n = new SEOInternationalizationService();