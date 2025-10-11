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
    <section className="py-24 md:py-32 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 ui-bottom-content">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* メインタイトル */}
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-wide jp-heading">
          {title.split('\n').map((line, index) => (
            <span key={index} className="block">
              {index === 1 ? (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {line}
                </span>
              ) : (
                line
              )}
            </span>
          ))}
        </h2>
        
        {/* 説明文 */}
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed jp-body">
          {description}
        </p>
        
        {/* 特徴リスト */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <span className="jp-cta">{primaryText}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 px-10 py-5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300"
          >
            <span className="btn-nowrap">{secondaryText}</span>
          </Link>
        </div>
        
        {/* 信頼性の証明 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Schema.org準拠保証</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>SSL暗号化通信</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>GDPR準拠</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}