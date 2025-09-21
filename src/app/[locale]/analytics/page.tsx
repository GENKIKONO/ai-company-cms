import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Advanced Analytics - LuxuCare',
  description: 'Advanced analytics with machine learning insights for enterprise data',
  keywords: ['analytics', 'machine learning', 'insights', 'dashboard', 'enterprise'],
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsDashboard />
    </div>
  );
}