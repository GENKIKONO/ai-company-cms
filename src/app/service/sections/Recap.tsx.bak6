import Image from 'next/image';
import { serviceCopy } from '../copy';
import { HIGCard } from '@/components/ui/HIGCard';

export default function Recap() {
  return (
    <section className="hig-section bg-white">
      <div className="hig-container">
        {/* メインカード */}
        <div className="bg-green-50 rounded-2xl border border-green-100 p-[var(--space-xl)] mb-[var(--space-xl)] shadow-sm">
          <div className="text-center mb-[var(--space-xl)]">
            <h2 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-lg)] hig-jp-heading">
              {serviceCopy.recap.title}
            </h2>
            <p className="hig-text-body text-[var(--color-text-secondary)] max-w-3xl mx-auto hig-jp-body leading-relaxed">
              {serviceCopy.recap.description}
            </p>
          </div>

          {/* ビジュアルエリア */}
          <div className="bg-white rounded-xl p-[var(--space-lg)] shadow-inner">
            <Image
              src="/illustrations/zero-click-hero.svg"
              alt="AIの回答に企業が表示される未来像 - AI時代の企業情報発見の新しい形"
              width={700}
              height={450}
              className="w-full h-auto rounded-lg mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}