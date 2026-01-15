import Image from 'next/image';
import { serviceCopy } from '../copy';
import { HIGCard } from '@/components/ui/HIGCard';

export default function BigIdea() {
  return (
    <section className="hig-section bg-gray-50">
      <div className="hig-container">
        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl border border-gray-100 p-[var(--space-xl)] mb-[var(--space-xl)] shadow-sm text-center">
          <h2 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-lg)] hig-jp-heading">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="hig-text-body text-[var(--color-text-secondary)] max-w-3xl mx-auto hig-jp-body leading-relaxed">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        {/* ビジュアルカード */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-purple-50 rounded-2xl border border-purple-100 p-[var(--space-xl)] shadow-sm">
            <Image
              src="/illustrations/jsonld-automation.svg"
              alt="AIOHub による企業データの AI 最適化プロセス - 情報を構造化してAI検索に最適化"
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