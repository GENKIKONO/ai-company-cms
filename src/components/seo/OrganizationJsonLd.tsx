'use client';

import type { Organization } from '@/types/legacy/database';;
import { generateOrganizationJsonLdScript, isValidForJsonLd } from '@/lib/structured-data/organization';

interface OrganizationJsonLdProps {
  organization: Organization;
  includeGeo?: boolean;
  includeContactInfo?: boolean;
}

export default function OrganizationJsonLd({ 
  organization, 
  includeGeo = false, 
  includeContactInfo = true 
}: OrganizationJsonLdProps) {
  // Don't render if organization data is invalid
  if (!isValidForJsonLd(organization)) {
    return null;
  }

  const jsonLdScript = generateOrganizationJsonLdScript(organization, {
    includeGeo,
    includeContactInfo
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript }}
    />
  );
}