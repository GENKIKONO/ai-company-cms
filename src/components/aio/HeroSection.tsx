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
    <section className="hig-section bg-[var(--color-background-secondary)]">
      <div className="hig-container">
        <div className="hig-grid hig-grid--2-cols gap-[var(--space-xl)] items-center">
          {/* Left Column - Content */}
          <div>
            {/* バッジ */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] rounded-full text-sm font-medium mb-[var(--space-lg)]">
              <Zap className="w-4 h-4" />
              <span className="hig-jp-text">{subtitle}</span>
            </div>
            
            {/* メインタイトル */}
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-lg)] hig-jp-heading">
              {title.split('\n').map((line, index) => (
                <span key={index} className="block hig-jp-text">
                  {index === 1 ? (
                    <span className="text-[var(--color-primary)]">
                      {line}
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
            
            {/* 説明文 */}
            <p className="hig-text-body text-[var(--color-text-secondary)] mb-[var(--space-xl)] hig-jp-body">
              AIO Hubは、AIが理解・引用しやすい形に企業情報を最適化するCMS。
              フォーム入力だけで<strong>JSON‑LD自動生成</strong>と
              <strong>構造化公開</strong>を実現し、検索からAI回答までの導線で
              企業が"選ばれる"状態をつくります。
            </p>

            {/* 特徴ポイント */}
            <div className="flex flex-col sm:flex-row gap-[var(--space-md)] mb-[var(--space-xl)] text-[var(--color-text-secondary)]">
              {features.map((feature, index) => {
                const IconComponent = iconComponents[feature.icon as keyof typeof iconComponents];
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-[var(--color-primary)]" />
                    <span className="hig-text-caption font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTAボタン */}
            <div className="flex flex-col sm:flex-row gap-[var(--space-md)]">
              <Link 
                href={primaryCta.href} 
                className="hig-button hig-button--primary"
              >
                {primaryCta.text}
              </Link>
              {secondaryCta && (
                <Link 
                  href={secondaryCta.href} 
                  className="hig-button hig-button--secondary"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="mt-[var(--space-xl)] md:mt-0">
            <div className="hig-card relative w-full" style={{'aspectRatio': '16/9'} as React.CSSProperties}>
              <Image
                src={imageSrc}
                alt="検索からAI直接回答へのシフト図（ゼロクリック時代の可視化）"
                fill
                className="object-cover rounded-[var(--radius-lg)]"
                sizes="(max-width: 768px) 100vw, 640px"
                priority
              />
            </div>
            <p className="mt-[var(--space-sm)] text-center hig-text-caption text-[var(--color-text-tertiary)] hig-jp-text">
              検索結果からAI直接回答へ。構造化された情報が引用されやすい。
            </p>
          </div>
        </div>

        {/* 価値訴求カード */}
        <section className="hig-section">
          <h2 className="hig-text-h1 text-[var(--color-text-primary)] text-center mb-[var(--space-xl)] hig-jp-heading">
            AIO Hubで実現する価値
          </h2>
          <div className="hig-grid hig-grid--4-cols">
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