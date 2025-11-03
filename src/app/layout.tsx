import './globals.css'
import '@/design-system' // 新しいデザインシステム読み込み
import Link from 'next/link'
import SafeAuthHeader from '@/components/header/SafeAuthHeader'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from 'sonner'
import BuildBanner from '@/components/BuildBanner'
import { env } from '@/lib/env'
// WebVitalsReporter removed for production optimization
import { I18nProvider } from '@/components/layout/I18nProvider'
import MobileNavMinimal from '@/components/navigation/MobileNavMinimal'

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
            {/* レスポンシブヘッダー - モバイル時は非表示 */}
            <header className="hidden lg:block w-full bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                      AIO Hub AI企業CMS
                    </Link>
                    <nav className="ml-6 hidden md:flex space-x-6">
                      <Link href="/pricing" className="text-gray-500 hover:text-gray-700 text-sm">料金プラン</Link>
                      <Link href="/organizations" className="text-gray-500 hover:text-gray-700 text-sm">企業ディレクトリ</Link>
                      <Link href="/hearing-service" className="text-gray-500 hover:text-gray-700 text-sm">ヒアリング代行</Link>
                    </nav>
                  </div>
                  <div className="hidden md:flex items-center space-x-4">
                    <Link href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      ログイン
                    </Link>
                  </div>
                </div>
              </div>
            </header>
            <main id="main-content">
              {children}
            </main>
            <Footer />
            <Toaster />
            {/* WebVitalsReporter removed for production optimization */}
          </ToastProvider>
        </I18nProvider>
        {/* Mobile FAB & Drawer (minimal, lg未満のみ) */}
        <div suppressHydrationWarning>
          <MobileNavMinimal />
        </div>
      </body>
    </html>
  )
}