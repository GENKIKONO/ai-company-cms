import './globals.css'
import SafeAuthHeader from '@/components/header/SafeAuthHeader'
import { ToastProvider } from '@/components/ui/toast'
import BuildBanner from '@/components/BuildBanner'

// SSRで常に正しい認証UIが出るように
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'AIO Hub AI企業CMS',
  description: 'AI-powered enterprise CMS for company directory and service management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>
          <BuildBanner 
            commit={process.env.VERCEL_GIT_COMMIT_SHA}
            deployUrl={process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined}
            environment={process.env.VERCEL_ENV || process.env.NODE_ENV}
          />
          <SafeAuthHeader />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}