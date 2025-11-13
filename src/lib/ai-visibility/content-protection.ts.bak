import crypto from 'crypto';
import { type Organization } from '@/types/database';

// Content Protection for AI Visibility
export interface ProtectedContent {
  signature: string;
  timestamp: string;
  origin: string;
  hash: string;
}

export interface SignedJsonLd {
  '@context': string;
  '@type': string;
  [key: string]: any;
  '_aiohub': ProtectedContent;
}

/**
 * Generate content signature for JSON-LD protection
 */
export function generateContentSignature(
  content: any,
  secretKey?: string
): ProtectedContent {
  const secret = secretKey || process.env.AI_VISIBILITY_SECRET || 'default-secret-key';
  const timestamp = new Date().toISOString();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
  
  // Create deterministic content string
  const contentString = JSON.stringify(content, Object.keys(content).sort());
  
  // Generate hash
  const hash = crypto
    .createHash('sha256')
    .update(contentString)
    .digest('hex')
    .substring(0, 16);
  
  // Generate signature
  const signatureData = `${contentString}:${timestamp}:${origin}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureData)
    .digest('hex')
    .substring(0, 32);
  
  return {
    signature,
    timestamp,
    origin,
    hash
  };
}

/**
 * Sign JSON-LD with protection metadata
 */
export function signJsonLd(jsonLd: any, secretKey?: string): SignedJsonLd {
  // Create a copy without protection metadata
  const cleanContent = { ...jsonLd };
  delete cleanContent._aiohub;
  
  // Generate protection signature
  const protection = generateContentSignature(cleanContent, secretKey);
  
  return {
    ...cleanContent,
    '_aiohub': protection
  };
}

/**
 * Verify JSON-LD signature
 */
export function verifyJsonLdSignature(
  signedJsonLd: SignedJsonLd,
  secretKey?: string
): { valid: boolean; error?: string } {
  try {
    if (!signedJsonLd._aiohub) {
      return { valid: false, error: 'No protection signature found' };
    }
    
    const { _aiohub, ...content } = signedJsonLd;
    const expectedProtection = generateContentSignature(content, secretKey);
    
    // Verify signature
    if (_aiohub.signature !== expectedProtection.signature) {
      return { valid: false, error: 'Signature mismatch' };
    }
    
    // Verify hash
    if (_aiohub.hash !== expectedProtection.hash) {
      return { valid: false, error: 'Content hash mismatch' };
    }
    
    // Check timestamp (optional: verify age)
    const signatureAge = Date.now() - new Date(_aiohub.timestamp).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (signatureAge > maxAge) {
      return { valid: false, error: 'Signature expired' };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Enhanced Organization JSON-LD with content protection
 */
export function createProtectedOrganizationJsonLd(
  organization: Organization,
  additionalData?: any
): SignedJsonLd {
  const baseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url || `${process.env.NEXT_PUBLIC_SITE_URL}/o/${organization.slug}`,
    logo: organization.logo_url,
    description: organization.description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: organization.address_country || 'JP',
      addressRegion: organization.address_region,
      addressLocality: organization.address_locality,
      streetAddress: organization.address_street,
      postalCode: organization.address_postal_code
    },
    sameAs: [
      organization.url,
      `${process.env.NEXT_PUBLIC_SITE_URL}/o/${organization.slug}`
    ].filter(Boolean),
    foundingDate: organization.established_at,
    industry: organization.industries,
    ...additionalData
  };
  
  return signJsonLd(baseJsonLd);
}

/**
 * Add origin tags to HTML content
 */
export function addOriginTags(html: string, url: string): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
  const timestamp = new Date().toISOString();
  
  // Add data attributes to main content areas
  const modifiedHtml = html
    .replace(
      /<main([^>]*)>/gi,
      `<main$1 data-origin="${origin}" data-source-url="${url}" data-indexed-at="${timestamp}">`
    )
    .replace(
      /<article([^>]*)>/gi,
      `<article$1 data-origin="${origin}" data-source-url="${url}">`
    )
    .replace(
      /<section([^>]*)>/gi,
      `<section$1 data-origin="${origin}">`
    );
  
  return modifiedHtml;
}

/**
 * Detect potential content copying patterns
 */
export function detectCopyingPatterns(
  userAgent: string,
  referer: string,
  requestFrequency: number,
  path: string
): {
  suspicious: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Check for suspicious user agents
  const suspiciousUAPatterns = [
    /python/i,
    /curl/i,
    /wget/i,
    /scraper/i,
    /bot/i,
    /crawler/i
  ];
  
  const isKnownGoodBot = /googlebot|bingbot|gptbot|ccbot|perplexitybot/i.test(userAgent);
  const isSuspiciousUA = suspiciousUAPatterns.some(pattern => pattern.test(userAgent)) && !isKnownGoodBot;
  
  if (isSuspiciousUA) {
    reasons.push('Suspicious user agent detected');
    riskLevel = 'medium';
  }
  
  // Check for missing referer on content pages
  if (!referer && path.includes('/o/')) {
    reasons.push('Missing referer on content page');
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Check request frequency
  if (requestFrequency > 10) {
    reasons.push('High request frequency detected');
    riskLevel = 'high';
  } else if (requestFrequency > 5) {
    reasons.push('Elevated request frequency');
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Check for bulk content access patterns
  if (path.includes('/o/') && !referer && isSuspiciousUA) {
    reasons.push('Potential bulk scraping pattern');
    riskLevel = 'high';
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
    riskLevel
  };
}

/**
 * Generate anti-scraping measures for content
 */
export function generateAntiScrapingMeasures(content: string, options?: {
  addWatermark?: boolean;
  addTrackingPixel?: boolean;
  addContentHash?: boolean;
}): string {
  let protectedContent = content;
  const opts = { addWatermark: true, addTrackingPixel: true, addContentHash: true, ...options };
  
  if (opts.addContentHash) {
    // Add invisible content hash as HTML comment
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    protectedContent = `<!-- Content-Hash: ${contentHash} -->\n${protectedContent}`;
  }
  
  if (opts.addWatermark) {
    // Add invisible watermark
    const watermark = `<!-- Generated by AIO Hub - ${new Date().toISOString()} -->`;
    protectedContent = `${watermark}\n${protectedContent}`;
  }
  
  if (opts.addTrackingPixel) {
    // Add tracking pixel for monitoring
    const trackingPixel = `<img src="/api/track?t=${Date.now()}" class="hidden" alt="" />`;
    protectedContent = protectedContent.replace(
      /<\/body>/i,
      `${trackingPixel}</body>`
    );
  }
  
  return protectedContent;
}

/**
 * Content integrity checker
 */
export function checkContentIntegrity(
  originalSignature: string,
  currentContent: any,
  secretKey?: string
): { intact: boolean; changes?: string[] } {
  const currentProtection = generateContentSignature(currentContent, secretKey);
  
  if (originalSignature === currentProtection.signature) {
    return { intact: true };
  }
  
  // If signatures don't match, analyze what changed
  const changes: string[] = [];
  
  // This is a simplified change detection
  // In practice, you'd want more sophisticated diff algorithms
  changes.push('Content has been modified since original signature');
  
  return { intact: false, changes };
}

/**
 * Rate limiting configuration for different bot types
 */
export const RATE_LIMITS = {
  search_engine: { requests: 20, window: 60 }, // 20 requests per minute
  ai_crawler: { requests: 10, window: 60 },    // 10 requests per minute
  scraper: { requests: 2, window: 60 },        // 2 requests per minute
  suspicious: { requests: 1, window: 60 },     // 1 request per minute
  browser: { requests: 30, window: 60 }        // 30 requests per minute
} as const;