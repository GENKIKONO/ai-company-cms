import { type Organization } from '@/types/database';

export interface OrganizationStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  address?: {
    '@type': string;
    addressCountry: string;
    addressRegion?: string;
    addressLocality?: string;
    streetAddress?: string;
    postalCode?: string;
  };
  geo?: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  contactPoint?: {
    '@type': string;
    telephone?: string;
    email?: string;
  };
  sameAs?: string[];
  foundingDate?: string;
  numberOfEmployees?: number;
  industry?: string[];
}

interface GenerateJsonLdOptions {
  includeGeo?: boolean;
  includeContactInfo?: boolean;
  baseUrl?: string;
}

/**
 * Generate Organization JSON-LD structured data
 * @param organization Organization data
 * @param options Generation options
 * @returns Structured data object
 */
export function generateOrganizationJsonLd(
  organization: Organization, 
  options: GenerateJsonLdOptions = {}
): OrganizationStructuredData {
  const {
    includeGeo = false,
    includeContactInfo = true,
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp'
  } = options;

  const structuredData: OrganizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name
  };

  // URL
  if (organization.url) {
    structuredData.url = organization.url;
  } else if (organization.slug) {
    structuredData.url = `${baseUrl}/o/${organization.slug}`;
  }

  // Logo
  if (organization.logo_url) {
    structuredData.logo = organization.logo_url;
  }

  // Description
  if (organization.description) {
    structuredData.description = organization.description;
  }

  // Address information
  const hasAddressInfo = organization.address_country || 
                        organization.address_region || 
                        organization.address_locality || 
                        organization.address_street || 
                        organization.address_postal_code;

  if (hasAddressInfo) {
    structuredData.address = {
      '@type': 'PostalAddress',
      addressCountry: organization.address_country || 'JP'
    };

    if (organization.address_region) {
      structuredData.address.addressRegion = organization.address_region;
    }

    if (organization.address_locality) {
      structuredData.address.addressLocality = organization.address_locality;
    }

    if (organization.address_street) {
      structuredData.address.streetAddress = organization.address_street;
    }

    if (organization.address_postal_code) {
      structuredData.address.postalCode = organization.address_postal_code;
    }
  }

  // Geo coordinates (only if high accuracy and explicitly enabled)
  if (includeGeo && organization.lat && organization.lng) {
    structuredData.geo = {
      '@type': 'GeoCoordinates',
      latitude: organization.lat,
      longitude: organization.lng
    };
  }

  // Contact information
  if (includeContactInfo && (organization.telephone || organization.email)) {
    structuredData.contactPoint = {
      '@type': 'ContactPoint'
    };

    if (organization.telephone) {
      structuredData.contactPoint.telephone = organization.telephone;
    }

    if (organization.email && organization.email_public) {
      structuredData.contactPoint.email = organization.email;
    }
  }

  // Same as (social media links, etc.)
  const sameAsUrls: string[] = [];
  
  // Add same_as URLs from organization data
  if (organization.same_as && organization.same_as.length > 0) {
    sameAsUrls.push(...organization.same_as.filter(url => url.trim() !== ''));
  }
  
  // Add organization's official website URL if different from AIO Hub page
  if (organization.url && organization.url.trim() !== '') {
    const officialUrl = organization.url.trim();
    const hubUrl = `${baseUrl}/o/${organization.slug}`;
    if (officialUrl !== hubUrl && !sameAsUrls.includes(officialUrl)) {
      sameAsUrls.push(officialUrl);
    }
  }
  
  // Add AIO Hub page URL as sameAs
  if (organization.slug) {
    const hubUrl = `${baseUrl}/o/${organization.slug}`;
    if (!sameAsUrls.includes(hubUrl)) {
      sameAsUrls.push(hubUrl);
    }
  }
  
  if (sameAsUrls.length > 0) {
    structuredData.sameAs = sameAsUrls;
  }

  // Founding date
  if (organization.established_at) {
    structuredData.foundingDate = organization.established_at;
  }

  // Number of employees
  if (organization.employees) {
    structuredData.numberOfEmployees = organization.employees;
  }

  // Industries
  if (organization.industries && organization.industries.length > 0) {
    structuredData.industry = organization.industries;
  }

  return structuredData;
}

/**
 * Generate JSON-LD script tag content
 * @param organization Organization data
 * @param options Generation options
 * @returns JSON-LD as string for script tag
 */
export function generateOrganizationJsonLdScript(
  organization: Organization, 
  options: GenerateJsonLdOptions = {}
): string {
  const jsonLd = generateOrganizationJsonLd(organization, options);
  return JSON.stringify(jsonLd, null, 2);
}

/**
 * Create full address string from organization data
 * @param organization Organization data
 * @returns Formatted full address
 */
export function createFullAddress(organization: Organization): string {
  const parts = [
    organization.address_region,
    organization.address_locality,
    organization.address_street
  ].filter(part => part && part.trim() !== '');

  return parts.join('');
}

/**
 * Validate if organization has minimum required data for JSON-LD
 * @param organization Organization data
 * @returns Boolean indicating if valid
 */
export function isValidForJsonLd(organization: Organization): boolean {
  return !!(organization.name && organization.name.trim() !== '');
}