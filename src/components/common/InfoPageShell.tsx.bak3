// NOTE:
//  - variant="default": ドキュメント・機能紹介・ステータスなどのカード型
//  - variant="policy" : プライバシー・利用規約など条文を想定した読み物型
//  - 後でSupabaseからマークダウンを流し込む前提で作ってあります

import { ReactNode } from 'react';

interface InfoPageSection {
  title: string;
  description?: string;
  items?: Array<{
    title: string;
    body?: string;
  }>;
}

interface InfoPageShellProps {
  title: string;
  description?: string;
  sections?: InfoPageSection[];
  children?: ReactNode;
  variant?: 'default' | 'policy';
}

export default function InfoPageShell({
  title,
  description,
  sections,
  children,
  variant = 'default',
}: InfoPageShellProps) {
  const isPolicy = variant === 'policy';

  return (
    <div className="min-h-screen bg-white">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 section-y ${isPolicy ? 'max-w-3xl' : 'max-w-4xl'}`}>
        {/* Title and Lead */}
        <div className={isPolicy ? 'mb-8' : 'text-center mb-12'}>
          <h1 className="text-title1 text-gray-900 mb-4">{title}</h1>
          {description && (
            <p className={`text-body-large text-gray-600 ${isPolicy ? '' : 'max-w-3xl mx-auto'}`}>
              {description}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className={isPolicy ? 'space-y-12' : 'space-y-8'}>
          {sections?.map((section, index) => (
            <section key={index} className={isPolicy ? 'mb-8' : 'glass-card p-8'}>
              <h2 className={`text-title2 text-gray-900 mb-6 ${isPolicy ? 'border-b border-gray-200 pb-4' : ''}`}>
                {section.title}
              </h2>
              {section.description && (
                <p className={`text-body text-gray-700 leading-relaxed ${isPolicy ? 'mb-8' : 'mb-6'}`}>
                  {section.description}
                </p>
              )}
              {section.items && (
                <div className={isPolicy ? 'space-y-8' : 'space-y-4'}>
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className={isPolicy ? 'mb-6' : 'border-l-4 border-blue-200 pl-4'}>
                      <h3 className={`text-title3 text-gray-900 mb-3 ${isPolicy ? 'font-semibold' : ''}`}>
                        {item.title}
                      </h3>
                      {item.body && (
                        <p className={`text-body text-gray-700 leading-relaxed ${isPolicy ? 'mb-4' : ''}`}>
                          {item.body}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          {children}
        </div>

        {/* Contact Section */}
        <div className={`mt-12 pt-8 border-t border-gray-200 ${isPolicy ? '' : ''}`}>
          <div className={isPolicy ? 'text-center py-6' : 'glass-card p-6 text-center'}>
            <p className="text-body text-gray-600">
              ご質問やサポートが必要な場合は、
              <a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] mx-1">
                お問い合わせページ
              </a>
              からご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}