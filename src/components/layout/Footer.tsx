import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="apple-footer">
      <div className="apple-container">
        <div className="apple-footer-content">
          {/* Main Footer Links */}
          <div className="apple-footer-links">
            <div className="apple-footer-section">
              <h3 className="apple-footer-title">製品</h3>
              <ul className="apple-footer-list">
                <li><Link href="/pricing" className="apple-footer-link">料金プラン</Link></li>
                <li><Link href="/hearing-service" className="apple-footer-link">導入支援サービス</Link></li>
                <li><Link href="/features" className="apple-footer-link">機能</Link></li>
              </ul>
            </div>

            <div className="apple-footer-section">
              <h3 className="apple-footer-title">企業</h3>
              <ul className="apple-footer-list">
                <li><Link href="/about" className="apple-footer-link">会社概要</Link></li>
                <li><Link href="/contact" className="apple-footer-link">お問い合わせ</Link></li>
                <li><Link href="/news" className="apple-footer-link">ニュース</Link></li>
              </ul>
            </div>

            <div className="apple-footer-section">
              <h3 className="apple-footer-title">サポート</h3>
              <ul className="apple-footer-list">
                <li><Link href="/help" className="apple-footer-link">ヘルプセンター</Link></li>
                <li><Link href="/docs" className="apple-footer-link">ドキュメント</Link></li>
                <li><Link href="/status" className="apple-footer-link">システム状況</Link></li>
              </ul>
            </div>

            <div className="apple-footer-section">
              <h3 className="apple-footer-title">法的情報</h3>
              <ul className="apple-footer-list">
                <li><Link href="/privacy" className="apple-footer-link">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="apple-footer-link">利用規約</Link></li>
                <li><Link href="/security" className="apple-footer-link">セキュリティ</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="apple-footer-bottom">
            <div className="apple-footer-brand">
              <div className="apple-footer-logo">
                <span className="apple-footer-brand-text">AIO Hub</span>
              </div>
              <p className="apple-footer-description">
                AI時代の企業情報プラットフォーム
              </p>
            </div>

            <div className="apple-footer-meta">
              <p className="apple-footer-copyright">
                © 2024 LuxuCare株式会社. All rights reserved.
              </p>
              <div className="apple-footer-social">
                <Link href="https://twitter.com/aiohub" className="apple-footer-social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
                <Link href="https://linkedin.com/company/aiohub" className="apple-footer-social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}