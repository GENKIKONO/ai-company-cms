'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  readonly question: string;
  readonly answer: string;
}

interface FAQCategory {
  readonly title: string;
  readonly items: readonly FAQItem[];
}

interface FAQSectionProps {
  title: string;
  description: string;
  categories: readonly FAQCategory[];
}

export default function FAQSection({ title, description, categories }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    const newOpenItems = new Set(openItems);
    
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <section id="faq" className="mb-20">
      <div className="max-w-4xl mx-auto">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* FAQ カテゴリー */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-6">
              {/* カテゴリータイトル */}
              <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                {category.title}
              </h3>
              
              {/* FAQ アイテム */}
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.has(key);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="aio-surface border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* 質問部分 */}
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                      >
                        <span className="text-lg font-semibold text-gray-900 pr-4">
                          {item.question}
                        </span>
                        <div className="flex-shrink-0 w-6 h-6 text-[var(--aio-primary)]">
                          {isOpen ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6" />
                          )}
                        </div>
                      </button>
                      
                      {/* 回答部分 */}
                      {isOpen && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-6">
                            <p className="text-gray-700 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* 追加サポート */}
        <div className="mt-12 lg:mt-16">
          <div className="aio-surface p-8 lg:p-12 text-center border border-gray-200 rounded-2xl">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              その他のご質問がございましたら
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              お問い合わせフォーム
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}