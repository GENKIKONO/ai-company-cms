import './globals.css'
import SafeAuthHeader from '@/components/header/SafeAuthHeader'
import { ToastProvider } from '@/components/ui/toast'
import { MenuProvider } from '@/components/ui/MenuProvider'
import FAB from '@/components/ui/FAB'
import BuildBanner from '@/components/BuildBanner'
import { env } from '@/lib/env'
import WebVitalsReporter from '@/components/performance/WebVitalsReporter'
import { I18nProvider } from '@/components/layout/I18nProvider'

// SSRで常に正しい認証UIが出るように
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'AIO Hub AI企業CMS',
  description: 'AI-powered enterprise CMS for company directory and service management',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja"> {/* 日本語専用運用 - 動的変更なし */}
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <I18nProvider initialLocale="ja">
          <ToastProvider>
            <MenuProvider>
              {/* Skip to main content link for accessibility */}
              <a href="#main-content" className="skip-link">
                メインコンテンツにスキップ
              </a>
              {env.SHOW_BUILD_BANNER && (
                <BuildBanner 
                  commit={process.env.VERCEL_GIT_COMMIT_SHA}
                  deployUrl={process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined}
                  environment={process.env.VERCEL_ENV || process.env.NODE_ENV}
                />
              )}
              <SafeAuthHeader />
              <main id="main-content">
                {children}
              </main>
              <FAB />
              <WebVitalsReporter />
            </MenuProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}