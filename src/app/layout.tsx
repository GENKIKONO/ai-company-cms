import type { Metadata } from "next";
import "./globals.css";
import MobileNavMinimal from "@/components/navigation/MobileNavMinimal";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AIO Hub",
  description: "AIに正しく理解されるためのCMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <header className="hidden lg:block w-full bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">AIO Hub</Link>
              </div>
              <nav className="hidden lg:flex space-x-8">
                <a href="/pricing" className="text-gray-700 hover:text-gray-900">料金プラン</a>
                <a href="/organizations" className="text-gray-700 hover:text-gray-900">企業ディレクトリ</a>
                <a href="/hearing-service" className="text-gray-700 hover:text-gray-900">ヒアリング代行</a>
              </nav>
              <div className="flex items-center">
                <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">ログイン</a>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-dvh pb-12">{children}</main>
        <Footer />
        <MobileNavMinimal />
      </body>
    </html>
  );
}