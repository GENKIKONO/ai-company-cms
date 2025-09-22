import './globals.css'

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
          {children}
      </body>
    </html>
  )
}