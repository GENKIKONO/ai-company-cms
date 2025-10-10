'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-wide">
            {title}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* FAQ カテゴリー */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* カテゴリータイトル */}
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-100">
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
                      className="bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors duration-200"
                    >
                      {/* 質問部分 */}
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between group"
                      >
                        <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-relaxed jp-faq-question">
                          {item.question}
                        </span>
                        <div className="flex-shrink-0 ml-4">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                          )}
                        </div>
                      </button>
                      
                      {/* 回答部分 */}
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <div className="pt-2 border-t border-gray-200">
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
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              その他のご質問がございましたら
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300"
            >
              お問い合わせフォーム
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}