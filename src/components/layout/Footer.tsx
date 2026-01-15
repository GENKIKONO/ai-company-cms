import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Main Footer Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">製品</h3>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">料金プラン</Link></li>
              <li><Link href="/hearing-service" className="text-gray-300 hover:text-white transition-colors">導入支援サービス</Link></li>
              <li><Link href="/features" className="text-gray-300 hover:text-white transition-colors">機能</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">企業</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">会社概要</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">お問い合わせ</Link></li>
              <li><Link href="/news" className="text-gray-300 hover:text-white transition-colors">ニュース</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">サポート</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors">ヘルプセンター</Link></li>
              <li><Link href="/docs" className="text-gray-300 hover:text-white transition-colors">ドキュメント</Link></li>
              <li><Link href="/status" className="text-gray-300 hover:text-white transition-colors">システム状況</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">法的情報</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/security" className="text-gray-300 hover:text-white transition-colors">セキュリティ</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold">AIOHub</span>
              <span className="text-gray-400">AI時代の企業情報プラットフォーム</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <p className="text-gray-400 text-sm">
              © 2024 LuxuCare株式会社. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com/aiohub" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="https://linkedin.com/company/aiohub" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}