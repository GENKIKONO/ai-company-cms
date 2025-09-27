import './globals.css'
import SafeAuthHeader from '@/components/header/SafeAuthHeader'

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
  const buildInfo = `commit:${process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'} / deploy:${process.env.VERCEL_DEPLOYMENT_ID ?? 'dev'}`;
  
  return (
    <html lang="ja">
      <body>
        <SafeAuthHeader />
        
        {/* ビルド情報バッジ - 本番とソースの乖離可視化用 */}
        <div 
          data-testid="build-badge"
          className="fixed top-2 right-2 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-mono rounded shadow-lg opacity-75 hover:opacity-100 transition-opacity"
          style={{ fontSize: '10px', lineHeight: '12px' }}
        >
          {buildInfo}
        </div>
        
        {children}
      </body>
    </html>
  )
}