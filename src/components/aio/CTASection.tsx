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
    <section className="section bg-subtle">
      <div className="container text-center">
        {/* メインタイトル */}
        <h2 className="text-h1 text-neutral-900 mb-6 text-balance jp-text">
          {title.split('\n').map((line, index) => (
            <span key={index} className="block jp-text">
              {index === 1 ? (
                <span className="text-primary">
                  {line}
                </span>
              ) : (
                line
              )}
            </span>
          ))}
        </h2>
        
        {/* 説明文 */}
        <p className="text-body-large text-neutral-600 mb-8 mx-auto jp-text">
          {description}
        </p>
        
        {/* 特徴リスト */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-neutral-700">
              <Check className="icon icon-sm text-success-600 flex-shrink-0" />
              <span className="text-body-small font-medium jp-text">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href={primaryHref}
            className="btn btn-primary btn-large"
          >
            {primaryText}
            <ArrowRight className="icon icon-sm" />
          </Link>
          
          <Link
            href={secondaryHref}
            className="btn btn-secondary btn-large">
          >
            {secondaryText}
          </Link>
        </div>
        
        {/* 信頼性の証明 */}
        <div className="card max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-body-small text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="jp-text">Schema.org準拠保証</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="jp-text">SSL暗号化通信</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="jp-text">GDPR準拠</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}