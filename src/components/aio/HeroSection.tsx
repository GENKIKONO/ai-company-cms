import { ArrowRight, Database, Search, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getSetting } from '@/lib/settings';
import StatCard from '@/components/ui/StatCard';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  features: ReadonlyArray<{ readonly icon: string; readonly text: string }>;
  benefits: ReadonlyArray<{ readonly title: string; readonly description: string }>;
  primaryCta: { href: string; text: string };
  secondaryCta?: { href: string; text: string };
}

const iconComponents = {
  Database,
  Search,
  Zap,
};

export default async function HeroSection({
  title,
  subtitle,
  description,
  features,
  benefits,
  primaryCta,
  secondaryCta
}: HeroSectionProps) {
  const heroImageUrl = await getSetting('hero_image_url');
  const imageSrc = heroImageUrl && heroImageUrl.trim().length > 0 
    ? heroImageUrl 
    : '/hero/zero-click-shift.png';
  return (
    <section className="section-layer section-hero-pad surface-fade-btm deco-wrap hero-gap bg-gray-50">
      <div className="container-hero section-content content-above-deco">
        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            {/* バッジ */}
            <div className="inline-flex items-center gap-2 text-indigo-700/80 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span className="jp-phrase">{subtitle}</span>
            </div>
            
            {/* メインタイトル */}
            <h1 className="text-heading-1 text-gray-900 mb-6 text-left measure-heading text-balance">
              {title.split('\n').map((line, index) => (
                <span key={index} className="block jp-phrase">
                  {index === 1 ? (
                    <span className="text-indigo-600">
                      {line}
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
            
            {/* 説明文 */}
            <p className="copy measure-lead text-left text-[15px] sm:text-base text-gray-600 mb-8 jp-phrase">
              AIO Hubは、AIが理解・引用しやすい形に企業情報を最適化するCMS。
              フォーム入力だけで<strong>JSON‑LD自動生成</strong>と
              <strong>構造化公開</strong>を実現し、検索からAI回答までの導線で
              企業が"選ばれる"状態をつくります。
            </p>

            {/* 特徴ポイント */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 text-gray-700">
              {features.map((feature, index) => {
                const IconComponent = iconComponents[feature.icon as keyof typeof iconComponents];
                const colors = ['text-blue-500', 'text-purple-500', 'text-indigo-500'];
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${colors[index]}`} />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTAボタン */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link 
                href={primaryCta.href} 
                className="cta-nowrap inline-flex justify-center items-center rounded-lg bg-indigo-600 px-6 py-3 min-h-[44px] text-white font-medium hover:bg-indigo-700 transition-colors duration-200"
              >
                {primaryCta.text}
              </Link>
              {secondaryCta && (
                <Link 
                  href={secondaryCta.href} 
                  className="cta-nowrap inline-flex justify-center items-center rounded-lg border border-gray-300 px-6 py-3 min-h-[44px] text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="mt-10 md:mt-0">
            <div className="media-frame relative w-full rounded-xl bg-white ui-flat" style={{'--media-ar': '16/9'} as React.CSSProperties}>
              <Image
                src={imageSrc}
                alt="検索からAI直接回答へのシフト図（ゼロクリック時代の可視化）"
                fill
                className="media-contain"
                sizes="(max-width: 768px) 100vw, 640px"
                priority
              />
            </div>
            <p className="mt-3 text-center text-sm text-gray-500">
              検索結果からAI直接回答へ。構造化された情報が引用されやすい。
            </p>
          </div>
        </div>

        {/* 価値訴求カード */}
        <section className="section-gap">
          <h2 className="text-heading-2 text-gray-900 text-left mb-8 measure-heading text-balance">
            AIO Hubで実現する価値
          </h2>
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <StatCard
                key={index}
                value={benefit.title}
                title={benefit.description}
                className=""
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}