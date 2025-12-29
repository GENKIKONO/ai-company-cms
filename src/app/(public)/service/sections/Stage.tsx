import Link from 'next/link';
import Image from 'next/image';
import { serviceCopy } from '../copy';
import { HIGButton } from '@/components/ui/HIGButton';
import { ArrowRightIcon } from '@/components/icons/HIGIcons';

export default function Stage() {
  return (
    <section className="hig-section bg-white">
      <div className="hig-container">
        {/* モバイル優先: カード型レイアウト */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-[var(--space-2xl)] lg:items-center">
          
          {/* メインコンテンツカード */}
          <div className="bg-white rounded-2xl border border-gray-100 p-[var(--space-xl)] mb-[var(--space-lg)] lg:mb-0 shadow-sm">
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-lg)] hig-jp-heading">
              {serviceCopy.stage.title}
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mb-[var(--space-xl)] hig-jp-body leading-relaxed">
              ユーザーはChatGPTやGeminiなどのAIに「調べてもらう」のが当たり前に。AIO HubはAIが引用できる構造の情報を整え、貴社を選択肢から外さないための基盤を提供します。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-[var(--space-md)]">
              <HIGButton variant="primary" size="lg" asChild>
                <Link href="/organizations">
                  無料で始める
                  <ArrowRightIcon size={20} />
                </Link>
              </HIGButton>
              <HIGButton variant="secondary" size="lg" asChild>
                <Link href="/pricing">料金を見る</Link>
              </HIGButton>
            </div>
          </div>

          {/* ビジュアルカード */}
          <div className="bg-[var(--aio-info-surface)] rounded-2xl border border-[var(--aio-info-border)] p-[var(--space-lg)] shadow-sm">
            <Image
              src="/illustrations/zero-click-hero.svg"
              alt="検索からAI回答へのシフト図"
              width={600}
              height={400}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}