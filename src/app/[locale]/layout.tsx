import '../globals.css'
import Script from 'next/script'
import { AuthProvider } from '@/hooks/useAuth'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { errorMonitoring } from '@/lib/error-monitoring'

import { seoI18n } from '@/lib/seo-i18n';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const metadata = seoI18n.generateMetadata(locale as Locale, 'home');
  const structuredData = seoI18n.generateStructuredData(locale as Locale, 'website');
  
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    alternates: {
      canonical: metadata.canonical,
      languages: metadata.alternateUrls,
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <head>
        {/* Plausible Analytics */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src={`${process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io'}/js/script.js`}
          />
        )}
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <div className="min-h-screen">
              <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher currentLocale={locale as Locale} />
              </div>
              {children}
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
        
        {/* Analytics & Performance monitoring */}
        <Script id="analytics-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              // Initialize analytics
              if (${process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'}) {
                // Session tracking
                if (window.plausible) {
                  const sessionData = {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    screen_resolution: screen.width + 'x' + screen.height,
                    viewport_size: window.innerWidth + 'x' + window.innerHeight,
                    device_type: /tablet|ipad|playbook|silk/i.test(navigator.userAgent) ? 'tablet' : 
                                /mobile|iphone|ipod|android|blackberry|opera|mini|windows\\sce|palm|smartphone|iemobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                  };
                  
                  window.plausible('Session Info', { props: sessionData });
                }
              }
              
              // Web Vitals tracking
              import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
                function sendToAnalytics(metric) {
                  // Send to Plausible
                  if (window.plausible) {
                    window.plausible(metric.name, { 
                      props: { 
                        value: Math.round(metric.value).toString(),
                        id: metric.id,
                        delta: metric.delta?.toString() || '0'
                      } 
                    });
                  }
                  
                  // Log performance issues
                  if (metric.name === 'LCP' && metric.value > 2500) {
                    console.warn('Poor LCP performance:', metric.value + 'ms');
                  }
                  if (metric.name === 'FID' && metric.value > 100) {
                    console.warn('Poor FID performance:', metric.value + 'ms');
                  }
                  if (metric.name === 'CLS' && metric.value > 0.1) {
                    console.warn('Poor CLS performance:', metric.value);
                  }
                }
                
                onLCP(sendToAnalytics);
                onFID(sendToAnalytics);
                onCLS(sendToAnalytics);
                onFCP(sendToAnalytics);
                onTTFB(sendToAnalytics);
              });
              
              // Error tracking
              window.addEventListener('error', function(event) {
                if (window.plausible) {
                  window.plausible('Error', {
                    props: {
                      error_message: event.message,
                      error_filename: event.filename || '',
                      error_line: event.lineno?.toString() || '0',
                      page: window.location.pathname
                    }
                  });
                }
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                if (window.plausible) {
                  window.plausible('Error', {
                    props: {
                      error_message: event.reason?.toString() || 'Unknown promise rejection',
                      error_type: 'unhandled_promise',
                      page: window.location.pathname
                    }
                  });
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}