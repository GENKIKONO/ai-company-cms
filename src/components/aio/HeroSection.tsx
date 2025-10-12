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
    <section className="section bg-subtle">
      <div className="container">
        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            {/* バッジ */}
            <div className="badge badge-primary mb-6">
              <Zap className="icon icon-sm" />
              <span className="jp-text">{subtitle}</span>
            </div>
            
            {/* メインタイトル */}
            <h1 className="text-display text-neutral-900 mb-6 text-balance jp-text">
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
            </h1>
            
            {/* 説明文 */}
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              AIO Hubは、AIが理解・引用しやすい形に企業情報を最適化するCMS。
              フォーム入力だけで<strong>JSON‑LD自動生成</strong>と
              <strong>構造化公開</strong>を実現し、検索からAI回答までの導線で
              企業が"選ばれる"状態をつくります。
            </p>

            {/* 特徴ポイント */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 text-neutral-700">
              {features.map((feature, index) => {
                const IconComponent = iconComponents[feature.icon as keyof typeof iconComponents];
                const colors = ['text-primary', 'text-primary', 'text-primary'];
                
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
                className="btn btn-primary btn-large"
              >
                {primaryCta.text}
              </Link>
              {secondaryCta && (
                <Link 
                  href={secondaryCta.href} 
                  className="btn btn-secondary btn-large"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="mt-10 md:mt-0">
            <div className="card relative w-full" style={{'aspectRatio': '16/9'} as React.CSSProperties}>
              <Image
                src={imageSrc}
                alt="検索からAI直接回答へのシフト図（ゼロクリック時代の可視化）"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 640px"
                priority
              />
            </div>
            <p className="mt-3 text-center text-body-small text-neutral-500 jp-text">
              検索結果からAI直接回答へ。構造化された情報が引用されやすい。
            </p>
          </div>
        </div>

        {/* 価値訴求カード */}
        <section className="section">
          <h2 className="text-h1 text-neutral-900 text-center mb-12 jp-text">
            AIO Hubで実現する価値
          </h2>
          <div className="grid grid-4">
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