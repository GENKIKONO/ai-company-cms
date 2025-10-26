'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Production optimization: Only track in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vitals:', metric);
    }
  });

  return null;
}

export default WebVitalsReporter;