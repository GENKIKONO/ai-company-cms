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
    <section id="faq" className="apple-section">
      <div className="apple-container">
        {/* セクションヘッダー */}
        <div className="apple-section-header">
          <h2 className="apple-title1">
            {title}
          </h2>
          <p className="apple-body-large apple-text-secondary">
            {description}
          </p>
        </div>

        {/* FAQ カテゴリー */}
        <div className="apple-faq-categories">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="apple-faq-category">
              {/* カテゴリータイトル */}
              <h3 className="apple-faq-category-title">
                {category.title}
              </h3>
              
              {/* FAQ アイテム */}
              <div className="apple-faq-items">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.has(key);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="apple-faq-item"
                    >
                      {/* 質問部分 */}
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="apple-faq-question"
                      >
                        <span className="apple-faq-question-text">
                          {item.question}
                        </span>
                        <div className="apple-faq-icon">
                          {isOpen ? (
                            <ChevronUp className="apple-faq-chevron" />
                          ) : (
                            <ChevronDown className="apple-faq-chevron" />
                          )}
                        </div>
                      </button>
                      
                      {/* 回答部分 */}
                      {isOpen && (
                        <div className="apple-faq-answer">
                          <div className="apple-faq-answer-content">
                            <p className="apple-body apple-text-secondary">
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
        <div className="apple-faq-support">
          <div className="apple-faq-support-card">
            <h3 className="apple-title3">
              その他のご質問がございましたら
            </h3>
            <p className="apple-body-large apple-text-secondary">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <a
              href="/contact"
              className="apple-button apple-button-primary apple-button-medium"
            >
              お問い合わせフォーム
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}