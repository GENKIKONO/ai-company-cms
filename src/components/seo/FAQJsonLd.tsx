'use client';

import type { QAEntry } from '@/types/domain/qa-system';
import type { Organization } from '@/types/legacy/database';;
import { generateFAQJsonLdScript, isValidForFAQJsonLd } from '@/lib/structured-data/faq';

interface FAQJsonLdProps {
  qaEntries: QAEntry[];
  organization?: Organization;
  maxItems?: number;
  includePrivate?: boolean;
}

export default function FAQJsonLd({ 
  qaEntries, 
  organization,
  maxItems = 50,
  includePrivate = false
}: FAQJsonLdProps) {
  // Don't render if Q&A entries are invalid for FAQ JSON-LD
  if (!isValidForFAQJsonLd(qaEntries)) {
    return null;
  }

  const jsonLdScript = generateFAQJsonLdScript(qaEntries, organization, {
    maxItems,
    includePrivate
  });

  // Don't render if no valid JSON-LD generated
  if (!jsonLdScript) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript }}
    />
  );
}