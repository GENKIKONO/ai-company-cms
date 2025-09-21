'use client';

import { Suspense } from 'react';
import TranslationDashboard from '@/components/TranslationDashboard';
import { useTranslations } from 'next-intl';

export default function TranslationsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense 
          fallback={
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          }
        >
          <TranslationDashboard />
        </Suspense>
      </div>
    </div>
  );
}