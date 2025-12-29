// 動的セクションレンダリングコンポーネント
import React from 'react';
import { CMSSection, getSectionContent } from '@/lib/cms';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface DynamicSectionProps {
  section: CMSSection;
}

// ヒーローセクション
const HeroSection: React.FC<{ section: CMSSection }> = ({ section }) => {
  const title = getSectionContent<string>(section, 'title', '');
  const subtitle = getSectionContent(section, 'subtitle', '');
  const ctaText = getSectionContent(section, 'cta_text', '開始する');
  const ctaUrl = getSectionContent(section, 'cta_url', '/register');
  const textAlign = getSectionContent(section, 'text_align', 'center');

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative container mx-auto px-6 py-24 lg:py-32">
        <div className={`max-w-4xl ${textAlign === 'center' ? 'mx-auto text-center' : ''}`}>
          {title && (
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              {title.split('\\n').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line}
                  {i < title.split('\\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
          )}
          {subtitle && (
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
              {subtitle}
            </p>
          )}
          {ctaUrl && (
            <div className="flex gap-4 justify-center">
              <Link 
                href={ctaUrl}
                className="inline-block bg-white text-[var(--aio-primary)] hover:bg-[var(--aio-info-surface)] text-lg px-8 py-4 rounded-md font-medium transition-colors"
              >
                {ctaText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// 機能一覧セクション
const FeatureListSection: React.FC<{ section: CMSSection }> = ({ section }) => {
  const items = getSectionContent(section, 'items', []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        {section.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {section.title}
            </h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: any, index: number) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                {item.icon && (
                  <div className="text-4xl mb-4">{item.icon}</div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// テキストブロックセクション
const TextBlockSection: React.FC<{ section: CMSSection }> = ({ section }) => {
  const content = getSectionContent(section, 'content', '');
  const backgroundColor = getSectionContent<string>(section, 'background_color', 'white');

  return (
    <section className={`py-16 ${backgroundColor === 'gray' ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="container mx-auto px-6">
        {section.title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {section.title}
            </h2>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          <div 
            className="prose prose-lg mx-auto text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </section>
  );
};

// 料金表セクション
const PricingTableSection: React.FC<{ section: CMSSection }> = ({ section }) => {
  const plans = getSectionContent(section, 'plans', []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {section.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {section.title}
            </h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan: any, index: number) => (
            <Card 
              key={index} 
              className={`relative text-center hover:shadow-xl transition-all ${
                plan.highlighted ? 'ring-2 ring-[var(--aio-info)] transform scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  おすすめ
                </Badge>
              )}
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-blue-600">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {(plan.features || []).map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-center justify-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)]'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {plan.cta_text || '開始する'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// メインの動的セクションコンポーネント
export const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  // セクションタイプに基づいて適切なコンポーネントをレンダリング
  switch (section.section_type) {
    case 'hero':
      return <HeroSection section={section} />;
    case 'feature_list':
      return <FeatureListSection section={section} />;
    case 'text_block':
      return <TextBlockSection section={section} />;
    case 'pricing_table':
      return <PricingTableSection section={section} />;
    default:
      // 未知のセクションタイプの場合のフォールバック
      return (
        <section className="py-8 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="container mx-auto px-6">
            <div className="text-yellow-800">
              <h3 className="font-medium">未知のセクションタイプ: {section.section_type}</h3>
              <p className="text-sm mt-2">
                このセクションタイプのレンダリングは実装されていません。
              </p>
              {section.title && (
                <p className="text-sm mt-1">セクションタイトル: {section.title}</p>
              )}
            </div>
          </div>
        </section>
      );
  }
};