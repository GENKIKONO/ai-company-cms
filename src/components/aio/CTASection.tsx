'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

interface CTASectionProps {
  title: string;
  description: string;
  primaryText: string;
  primaryHref: string;
  secondaryText: string;
  secondaryHref: string;
  features: readonly string[];
}

export default function CTASection({
  title,
  description,
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
  features
}: CTASectionProps) {
  return (
    <section className="deco-wrap cta-safe-minh bg-gray-50 ui-bottom-content">
      <div className="container-article text-center content-above-deco">
        {/* メインタイトル */}
        <h2 className="text-heading-2 text-gray-900 mb-6 text-center measure-heading text-balance">
          {title.split('\n').map((line, index) => (
            <span key={index} className="block jp-phrase">
              {index === 1 ? (
                <span className="text-blue-600">
                  {line}
                </span>
              ) : (
                line
              )}
            </span>
          ))}
        </h2>
        
        {/* 説明文 */}
        <p className="copy measure-lead text-center text-gray-600 mb-8 mx-auto jp-phrase">
          {description}
        </p>
        
        {/* 特徴リスト */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="copy text-sm font-medium jp-phrase">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href={primaryHref}
            className="cta-unified cta-unified--primary gap-2"
          >
            <span className="cta-nowrap">{primaryText}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href={secondaryHref}
            className="cta-unified cta-unified--secondary gap-2"
          >
            <span className="cta-nowrap">{secondaryText}</span>
          </Link>
        </div>
        
        {/* 信頼性の証明 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="copy jp-phrase">Schema.org準拠保証</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="copy jp-phrase">SSL暗号化通信</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="copy jp-phrase">GDPR準拠</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}