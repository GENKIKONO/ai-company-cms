// JSON-LD structured data generators for SEO
import type { Organization, Post, Service, CaseStudy, FAQ } from '@/types/database';

// Organization JSON-LD
export function generateOrganizationJsonLd(organization: Organization) {
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

  if (organization.founded) {
    jsonLd.foundingDate = organization.founded;
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
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://aiohub.jp/o/${organization.slug}/services/${service.id}`,
    "name": service.name,
    "provider": {
      "@type": "Organization",
      "@id": `https://aiohub.jp/o/${organization.slug}`,
      "name": organization.name
    }
  };

  if (service.description) {
    jsonLd.description = service.description;
  }

  if (service.category) {
    jsonLd.category = service.category;
  }

  if (service.price) {
    jsonLd.offers = {
      "@type": "Offer",
      "price": service.price,
      "priceCurrency": "JPY"
    };
  }

  return jsonLd;
}

// Case Study as Article JSON-LD
export function generateCaseStudyJsonLd(caseStudy: CaseStudy, organization: Organization) {
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://aiohub.jp/o/${organization.slug}/case-studies/${caseStudy.id}`,
    "headline": caseStudy.title,
    "url": `https://aiohub.jp/o/${organization.slug}/case-studies/${caseStudy.id}`,
    "datePublished": caseStudy.created_at,
    "dateModified": caseStudy.updated_at,
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

  if (caseStudy.problem) {
    jsonLd.description = caseStudy.problem;
  }

  if (caseStudy.tags) {
    jsonLd.keywords = caseStudy.tags.join(', ');
  }

  if (organization.logo_url) {
    jsonLd.publisher.logo = {
      "@type": "ImageObject",
      "url": organization.logo_url
    };
  }

  return jsonLd;
}

// FAQ JSON-LD
export function generateFAQJsonLd(faqs: FAQ[]) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Combined organization page JSON-LD with all content
export function generateOrganizationPageJsonLd(
  organization: Organization,
  posts: Post[],
  services: Service[],
  caseStudies: CaseStudy[],
  faqs: FAQ[]
) {
  const jsonLdArray = [];

  // Main organization
  jsonLdArray.push(generateOrganizationJsonLd(organization));

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
