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
    <section id="faq" className="section">
      <div className="container">
        {/* セクションヘッダー */}
        <div className="text-center mb-12">
          <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
            {title}
          </h2>
          <p className="text-body-large text-neutral-600 jp-text">
            {description}
          </p>
        </div>

        {/* FAQ カテゴリー */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* カテゴリータイトル */}
              <h3 className="text-h2 text-neutral-900 mb-6 pb-2 border-b-2 border-primary/20 jp-text">
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
                      className="card hover:border-primary/30 transition-colors duration-200"
                    >
                      {/* 質問部分 */}
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between group"
                      >
                        <span className="text-body font-semibold text-neutral-900 group-hover:text-primary transition-colors duration-200 jp-text">
                          {item.question}
                        </span>
                        <div className="flex-shrink-0 ml-4">
                          {isOpen ? (
                            <ChevronUp className="icon icon-sm text-neutral-400 group-hover:text-primary transition-colors duration-200" />
                          ) : (
                            <ChevronDown className="icon icon-sm text-neutral-400 group-hover:text-primary transition-colors duration-200" />
                          )}
                        </div>
                      </button>
                      
                      {/* 回答部分 */}
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <div className="pt-2 border-t border-neutral-200">
                            <p className="text-body text-neutral-700 jp-text">
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
        <div className="mt-12 text-center">
          <div className="card bg-subtle p-8">
            <h3 className="text-h3 text-neutral-900 mb-2 jp-text">
              その他のご質問がございましたら
            </h3>
            <p className="text-body-large text-neutral-600 mb-6 jp-text">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <a
              href="/contact"
              className="btn btn-primary"
            >
              お問い合わせフォーム
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}