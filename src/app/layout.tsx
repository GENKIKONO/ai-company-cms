import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata = {
  title: 'LuxuCare AI企業CMS',
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}