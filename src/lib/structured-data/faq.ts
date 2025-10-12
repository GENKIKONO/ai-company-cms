import { type QAEntry, type QAEntryWithCategory, type Organization } from '@/types/database';

export interface FAQStructuredData {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

interface GenerateFAQJsonLdOptions {
  baseUrl?: string;
  maxItems?: number;
  includePrivate?: boolean;
}

/**
 * Generate FAQ JSON-LD structured data from Q&A entries
 * @param qaEntries Array of Q&A entries
 * @param organization Organization data (optional)
 * @param options Generation options
 * @returns FAQ structured data object
 */
export function generateFAQJsonLd(
  qaEntries: QAEntryWithCategory[],
  organization?: Organization,
  options: GenerateFAQJsonLdOptions = {}
): FAQStructuredData | null {
  const {
    maxItems = 50,
    includePrivate = false
  } = options;

  // Filter entries based on visibility and status
  const validEntries = qaEntries.filter(entry => 
    entry.status === 'published' && 
    (includePrivate || entry.visibility === 'public') &&
    entry.question?.trim() && 
    entry.answer?.trim()
  );

  if (validEntries.length === 0) {
    return null;
  }

  // Limit the number of entries to avoid overly large JSON-LD
  const limitedEntries = validEntries.slice(0, maxItems);

  const structuredData: FAQStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: limitedEntries.map(entry => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer
      }
    }))
  };

  return structuredData;
}

/**
 * Generate FAQ JSON-LD script tag content
 * @param qaEntries Array of Q&A entries
 * @param organization Organization data (optional)
 * @param options Generation options
 * @returns JSON-LD as string for script tag
 */
export function generateFAQJsonLdScript(
  qaEntries: QAEntryWithCategory[],
  organization?: Organization,
  options: GenerateFAQJsonLdOptions = {}
): string | null {
  const jsonLd = generateFAQJsonLd(qaEntries, organization, options);
  
  if (!jsonLd) {
    return null;
  }

  return JSON.stringify(jsonLd, null, 2);
}

/**
 * Validate if Q&A entries have minimum required data for FAQ JSON-LD
 * @param qaEntries Array of Q&A entries
 * @returns Boolean indicating if valid
 */
export function isValidForFAQJsonLd(qaEntries: QAEntryWithCategory[]): boolean {
  const validEntries = qaEntries.filter(entry => 
    entry.status === 'published' && 
    entry.visibility === 'public' &&
    entry.question?.trim() && 
    entry.answer?.trim()
  );

  return validEntries.length > 0;
}

/**
 * Clean and prepare Q&A content for JSON-LD
 * @param content Raw content string
 * @returns Cleaned content suitable for JSON-LD
 */
export function cleanContentForJsonLd(content: string): string {
  return content
    .replace(/\n+/g, ' ') // Replace line breaks with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Group Q&A entries by category for structured organization
 * @param qaEntries Array of Q&A entries with category data
 * @returns Object grouped by category
 */
export function groupQAByCategory(qaEntries: QAEntryWithCategory[]): Record<string, QAEntryWithCategory[]> {
  return qaEntries.reduce((groups, entry) => {
    const categoryName = entry.qa_categories?.name || 'その他';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(entry);
    return groups;
  }, {} as Record<string, QAEntryWithCategory[]>);
}

/**
 * Create organization-specific FAQ URL
 * @param organizationSlug Organization slug
 * @param baseUrl Base URL
 * @returns FAQ page URL
 */
export function createFAQUrl(organizationSlug: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp'): string {
  return `${baseUrl}/o/${organizationSlug}/faq`;
}