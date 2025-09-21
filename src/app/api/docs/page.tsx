import { Metadata } from 'next';
import ApiDocumentation from '@/components/api/ApiDocumentation';

export const metadata: Metadata = {
  title: 'API Documentation - LuxuCare',
  description: 'Complete API documentation for the LuxuCare enterprise CMS platform',
  keywords: ['API', 'documentation', 'REST', 'GraphQL', 'SDK', 'enterprise', 'CMS'],
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ApiDocumentation />
    </div>
  );
}