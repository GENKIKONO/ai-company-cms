import './globals.css'
import '@/design-system' // 新しいデザインシステム読み込み
import SafeAuthHeader from '@/components/header/SafeAuthHeader'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/toast'
import BuildBanner from '@/components/BuildBanner'
import { env } from '@/lib/env'
// WebVitalsReporter removed for production optimization
import { I18nProvider } from '@/components/layout/I18nProvider'
import { MobileNav } from '@/components/MobileNav'

// SSRで常に正しい認証UIが出るように
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'AIO Hub AI企業CMS',
  description: 'AI-powered enterprise CMS for company directory and service management',
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
            <Footer />
            {/* WebVitalsReporter removed for production optimization */}
          </ToastProvider>
        </I18nProvider>
        {/* Mobile Navigation - Outside containment context */}
        <MobileNav />
      </body>
    </html>
  )
}