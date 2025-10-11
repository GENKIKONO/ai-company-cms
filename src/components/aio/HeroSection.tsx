import { ArrowRight, Database, Search, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getSetting } from '@/lib/settings';
import HorizontalScroller from '@/components/ui/HorizontalScroller';
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
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="ui-axis-main px-6 sm:px-8 lg:px-10">
        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            {/* バッジ */}
            <div className="inline-flex items-center gap-2 text-indigo-700/80 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>{subtitle}</span>
            </div>
            
            {/* メインタイトル */}
            <h1 className="ui-h1 text-gray-900 tracking-tight mb-6">
              {title.split('\n').map((line, index) => (
                <span key={index} className="block">
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
            <p className="ui-measure-lead ui-text-left text-[15px] sm:text-base leading-7 sm:leading-8 text-gray-600 mb-8">
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
                className="inline-flex justify-center items-center rounded-lg bg-indigo-600 px-6 py-3 min-h-[44px] text-white font-medium hover:bg-indigo-700 transition-colors duration-200"
              >
                {primaryCta.text}
              </Link>
              {secondaryCta && (
                <Link 
                  href={secondaryCta.href} 
                  className="inline-flex justify-center items-center rounded-lg border border-gray-300 px-6 py-3 min-h-[44px] text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="mt-10 md:mt-0">
            <div className="relative w-full aspect-video rounded-xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              <Image
                src={imageSrc}
                alt="検索からAI直接回答へのシフト図（ゼロクリック時代の可視化）"
                fill
                className="object-contain md:object-cover"
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
        <section className="mt-16 sm:mt-20 lg:mt-24">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-8 tracking-tight">
            AIO Hubで実現する価値
          </h2>
          <HorizontalScroller ariaLabel="AIO Hubの主なメリット" className="sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <StatCard
                key={index}
                value={benefit.title}
                title={benefit.description}
                className="snap-center min-w-[85%] sm:min-w-0"
              />
            ))}
          </HorizontalScroller>
        </section>
      </div>
    </section>
  );
}