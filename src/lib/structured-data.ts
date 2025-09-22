import { Organization } from '@/types';

interface OrganizationStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  address?: {
    '@type': string;
    addressCountry?: string;
    addressRegion?: string;
    addressLocality?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  contactPoint?: {
    '@type': string;
    email?: string;
    telephone?: string;
  };
  foundingDate?: string;
  numberOfEmployees?: number;
  industry?: string[];
  sameAs?: string[];
}

interface WebSiteStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

interface DirectoryStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
  itemListElement?: Array<{
    '@type': string;
    position: number;
    item: OrganizationStructuredData;
  }>;
}

export class StructuredDataGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://aiohub.ai') {
    this.baseUrl = baseUrl;
  }

  generateOrganizationData(organization: Organization, locale: string = 'ja'): OrganizationStructuredData {
    const data: OrganizationStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organization.name,
    };

    if (organization.description) {
      data.description = organization.description;
    }

    if (organization.url) {
      data.url = organization.url;
    }

    if (organization.logo_url) {
      data.logo = organization.logo_url;
    }

    // Address information
    if (organization.address_country || organization.address_region || 
        organization.address_locality || organization.address_postal_code || 
        organization.address_street) {
      data.address = {
        '@type': 'PostalAddress',
      };

      if (organization.address_country) {
        data.address.addressCountry = organization.address_country;
      }
      if (organization.address_region) {
        data.address.addressRegion = organization.address_region;
      }
      if (organization.address_locality) {
        data.address.addressLocality = organization.address_locality;
      }
      if (organization.address_postal_code) {
        data.address.postalCode = organization.address_postal_code;
      }
      if (organization.address_street) {
        data.address.streetAddress = organization.address_street;
      }
    }

    // Contact information
    if (organization.email || organization.telephone) {
      data.contactPoint = {
        '@type': 'ContactPoint',
      };

      if (organization.email) {
        data.contactPoint.email = organization.email;
      }
      if (organization.telephone) {
        data.contactPoint.telephone = organization.telephone;
      }
    }

    // Additional data
    if (organization.founded) {
      data.foundingDate = organization.founded;
    }

    if (organization.employees) {
      data.numberOfEmployees = organization.employees;
    }

    if (organization.industries && organization.industries.length > 0) {
      data.industry = organization.industries;
    }

    // Add organization page URL as sameAs
    const orgPageUrl = `${this.baseUrl}/${locale}/o/${organization.slug}`;
    data.sameAs = [orgPageUrl];

    if (organization.url) {
      data.sameAs.push(organization.url);
    }

    return data;
  }

  generateWebSiteData(locale: string = 'ja'): WebSiteStructuredData {
    const siteNames = {
      ja: 'AIO Hub - AI企業ディレクトリ',
      en: 'AIO Hub - AI Enterprise Directory',
      zh: 'AIO Hub - AI企业目录',
      ko: 'AIO Hub - AI 기업 디렉토리',
      es: 'AIO Hub - Directorio de Empresas AI',
      fr: 'AIO Hub - Répertoire d\'entreprises IA',
      de: 'AIO Hub - KI-Unternehmensverzeichnis',
    };

    const siteDescriptions = {
      ja: '世界中の先進的なAI・テック企業を発見できる包括的なディレクトリサービス',
      en: 'Comprehensive directory service to discover advanced AI and tech companies worldwide',
      zh: '发现全球先进AI和科技公司的综合目录服务',
      ko: '전 세계 첨단 AI 및 기술 회사를 발견할 수 있는 포괄적인 디렉토리 서비스',
      es: 'Servicio de directorio integral para descubrir empresas avanzadas de IA y tecnología en todo el mundo',
      fr: 'Service d\'annuaire complet pour découvrir les entreprises d\'IA et de technologie avancées dans le monde entier',
      de: 'Umfassender Verzeichnisdienst zur Entdeckung fortschrittlicher KI- und Tech-Unternehmen weltweit',
    };

    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteNames[locale as keyof typeof siteNames] || siteNames.ja,
      description: siteDescriptions[locale as keyof typeof siteDescriptions] || siteDescriptions.ja,
      url: `${this.baseUrl}/${locale}`,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/${locale}/directory?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  generateBreadcrumbData(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: breadcrumb.url,
      })),
    };
  }

  generateDirectoryData(
    organizations: Organization[],
    totalCount: number,
    locale: string = 'ja'
  ): DirectoryStructuredData {
    const directoryNames = {
      ja: '企業ディレクトリ',
      en: 'Company Directory',
      zh: '公司目录',
      ko: '회사 디렉토리',
      es: 'Directorio de Empresas',
      fr: 'Répertoire d\'entreprises',
      de: 'Unternehmensverzeichnis',
    };

    const directoryDescriptions = {
      ja: 'AI・テック企業の包括的なディレクトリ',
      en: 'Comprehensive directory of AI and tech companies',
      zh: 'AI和技术公司的综合目录',
      ko: 'AI 및 기술 회사의 포괄적인 디렉토리',
      es: 'Directorio integral de empresas de IA y tecnología',
      fr: 'Répertoire complet des entreprises d\'IA et de technologie',
      de: 'Umfassendes Verzeichnis von KI- und Technologieunternehmen',
    };

    const data: DirectoryStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: directoryNames[locale as keyof typeof directoryNames] || directoryNames.ja,
      description: directoryDescriptions[locale as keyof typeof directoryDescriptions] || directoryDescriptions.ja,
      url: `${this.baseUrl}/${locale}/directory`,
      numberOfItems: totalCount,
    };

    // Add up to 10 organizations to the structured data
    if (organizations.length > 0) {
      data.itemListElement = organizations.slice(0, 10).map((org, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: this.generateOrganizationData(org, locale),
      }));
    }

    return data;
  }

  generateCollectionPageData(
    title: string,
    description: string,
    url: string,
    organizations: Organization[],
    locale: string = 'ja'
  ): DirectoryStructuredData {
    const data: DirectoryStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: description,
      url: url,
      numberOfItems: organizations.length,
    };

    if (organizations.length > 0) {
      data.itemListElement = organizations.map((org, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: this.generateOrganizationData(org, locale),
      }));
    }

    return data;
  }

  // Helper method to generate JSON-LD script tag
  generateJsonLdScript(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  // Method to combine multiple structured data objects
  combineStructuredData(dataObjects: any[]): string {
    if (dataObjects.length === 1) {
      return this.generateJsonLdScript(dataObjects[0]);
    }

    return this.generateJsonLdScript(dataObjects);
  }
}

// Export singleton instance
export const structuredDataGenerator = new StructuredDataGenerator();

// Export utility functions
export function generateOrganizationJsonLd(organization: Organization, locale?: string): string {
  return structuredDataGenerator.generateJsonLdScript(
    structuredDataGenerator.generateOrganizationData(organization, locale)
  );
}

export function generateWebSiteJsonLd(locale?: string): string {
  return structuredDataGenerator.generateJsonLdScript(
    structuredDataGenerator.generateWebSiteData(locale)
  );
}

export function generateDirectoryJsonLd(
  organizations: Organization[],
  totalCount: number,
  locale?: string
): string {
  return structuredDataGenerator.generateJsonLdScript(
    structuredDataGenerator.generateDirectoryData(organizations, totalCount, locale)
  );
}

export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; url: string }>): string {
  return structuredDataGenerator.generateJsonLdScript(
    structuredDataGenerator.generateBreadcrumbData(breadcrumbs)
  );
}