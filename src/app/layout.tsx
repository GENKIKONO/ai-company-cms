import './globals.css'
import AuthHeader from '@/components/header/AuthHeader'

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
        <AuthHeader />
        {children}
      </body>
    </html>
  )
}