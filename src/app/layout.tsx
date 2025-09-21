import './globals.css'

export const metadata = {
  title: 'LuxuCare API',
  description: 'API documentation and authentication pages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}