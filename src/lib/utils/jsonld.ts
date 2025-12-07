// JSON-LD structured data generators for SEO
import type { Organization, Post, Service, CaseStudy, FAQ } from '@/types/legacy/database';;

// Organization JSON-LD
export function generateOrganizationJsonLd(organization: Organization) {
  // Safety guard: prevent generation when slug is undefined/empty
  if (!organization.slug || organization.slug.trim() === '') {
    return null;
  }

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `https://aiohub.jp/o/${organization.slug}`,
    "name": organization.name,
    "url": `https://aiohub.jp/o/${organization.slug}`,
    "sameAs": organization.same_as || []
  };

  if (organization.description) {
    jsonLd.description = organization.description;
  }

  if (organization.logo_url) {
    jsonLd.logo = {
      "@type": "ImageObject",
      "url": organization.logo_url
    };
  }

  if (organization.email_public && organization.email) {
    jsonLd.email = organization.email;
  }

  if (organization.telephone) {
    jsonLd.telephone = organization.telephone;
  }

  if (organization.established_at) {
    jsonLd.foundingDate = organization.established_at;
  }

  if (organization.url) {
    jsonLd.url = organization.url;
  }

  // Address
  if (organization.address_country || organization.address_region || 
      organization.address_locality || organization.address_street) {
    jsonLd.address = {
      "@type": "PostalAddress",
      "addressCountry": organization.address_country,
      "addressRegion": organization.address_region,
      "addressLocality": organization.address_locality,
      "streetAddress": organization.address_street,
      "postalCode": organization.address_postal_code
    };
  }

  return jsonLd;
}

// BlogPosting JSON-LD
export function generatePostJsonLd(post: Post, organization: Organization) {
  // Safety guard: prevent generation when slug is undefined/empty
  if (!organization.slug || organization.slug.trim() === '') {
    return null;
  }

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://aiohub.jp/o/${organization.slug}/posts/${post.id}`,
    "headline": post.title,
    "url": `https://aiohub.jp/o/${organization.slug}/posts/${post.id}`,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "@id": `https://aiohub.jp/o/${organization.slug}`,
      "name": organization.name
    },
    "publisher": {
      "@type": "Organization",
      "@id": `https://aiohub.jp/o/${organization.slug}`,
      "name": organization.name
    }
  };

  if (post.content_markdown) {
    jsonLd.articleBody = post.content_markdown;
  }

  if (organization.logo_url) {
    jsonLd.publisher.logo = {
      "@type": "ImageObject",
      "url": organization.logo_url
    };
  }

  return jsonLd;
}

// Service JSON-LD
export function generateServiceJsonLd(service: Service, organization: Organization) {
  // 強化されたJSON-LD生成関数を使用
  const { generateServiceJsonLd: enhancedServiceJsonLd } = require('@/lib/json-ld/service');
  return enhancedServiceJsonLd(service, organization);
}

// Case Study JSON-LD with @type=CaseStudy
export function generateCaseStudyJsonLd(caseStudy: CaseStudy, organization: Organization) {
  // 新しい@type=CaseStudy JSON-LD生成関数を使用
  const { generateCaseStudyJsonLd: newGenerateCaseStudyJsonLd } = require('@/lib/json-ld/case-study');
  return newGenerateCaseStudyJsonLd(caseStudy, organization);
}

// FAQ JSON-LD
export function generateFAQJsonLd(faqs: FAQ[], organization?: Organization) {
  // 強化されたFAQ JSON-LD生成関数を使用
  const { generateFAQPageJsonLd } = require('@/lib/json-ld/faq');
  return generateFAQPageJsonLd(faqs, organization);
}

// Combined organization page JSON-LD with all content
export function generateOrganizationPageJsonLd(
  organization: Organization,
  posts: Post[],
  services: Service[],
  caseStudies: CaseStudy[],
  faqs: FAQ[]
) {
  // Safety guard: prevent generation when slug is undefined/empty
  if (!organization.slug || organization.slug.trim() === '') {
    return [];
  }

  const jsonLdArray = [];

  // Main organization
  const orgJsonLd = generateOrganizationJsonLd(organization);
  if (orgJsonLd) {
    jsonLdArray.push(orgJsonLd);
  }

  // Website structure
  if (posts.length > 0 || services.length > 0 || caseStudies.length > 0) {
    const websiteJsonLd: any = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `https://aiohub.jp/o/${organization.slug}#website`,
      "url": `https://aiohub.jp/o/${organization.slug}`,
      "name": `${organization.name} - 企業情報`,
      "publisher": {
        "@type": "Organization",
        "@id": `https://aiohub.jp/o/${organization.slug}`,
        "name": organization.name
      }
    };

    jsonLdArray.push(websiteJsonLd);
  }

  // FAQ page if FAQs exist
  const faqJsonLd = generateFAQJsonLd(faqs);
  if (faqJsonLd) {
    jsonLdArray.push(faqJsonLd);
  }

  return jsonLdArray;
}
