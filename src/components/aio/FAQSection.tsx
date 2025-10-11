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
    <section id="faq" className="section-gap bg-white">
      <div className="container-article">
        {/* セクションヘッダー */}
        <div className="section-gap">
          <h2 className="headline text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">
            <span className="block jp-phrase">{title}</span>
          </h2>
          <p className="copy measure-lead text-center text-gray-600 mx-auto jp-phrase">
            {description}
          </p>
        </div>

        {/* FAQ カテゴリー */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* カテゴリータイトル */}
              <h3 className="headline text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-100 jp-phrase">
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
                        <span className="headline text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 jp-phrase">
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
                            <p className="copy measure-body text-gray-700 jp-phrase">
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
        <div className="section-gap text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
            <h3 className="headline text-lg sm:text-xl font-bold text-gray-900 mb-2 jp-phrase">
              その他のご質問がございましたら
            </h3>
            <p className="copy measure-lead text-gray-600 mb-4 mx-auto jp-phrase">
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