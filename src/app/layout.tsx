import './globals.css'
import SafeAuthHeader from '@/components/header/SafeAuthHeader'
import { ToastProvider } from '@/components/ui/toast'
import BuildBanner from '@/components/BuildBanner'
import { env } from '@/lib/env'
import WebVitalsReporter from '@/components/performance/WebVitalsReporter'
import { I18nProvider } from '@/components/layout/I18nProvider'

// SSRで常に正しい認証UIが出るように
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'AIO Hub | AI情報最適化CMS',
  description: 'AIO Hub は企業情報をAIが理解しやすい形に最適化するプラットフォーム。JSON-LD自動生成で、ChatGPTやGeminiの回答に企業が引用されやすくなります。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <I18nProvider initialLocale="ja">
          <ToastProvider>
            {env.SHOW_BUILD_BANNER && (
              <BuildBanner 
                commit={process.env.VERCEL_GIT_COMMIT_SHA}
                deployUrl={process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined}
                environment={process.env.VERCEL_ENV || process.env.NODE_ENV}
              />
            )}
            <SafeAuthHeader />
            {children}
            <WebVitalsReporter />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}