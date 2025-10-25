import Image from 'next/image';
import { serviceCopy } from '../copy';
import { HIGCard } from '@/components/ui/HIGCard';

export default function BigIdea() {
  return (
    <section className="hig-section bg-[var(--color-background-secondary)]">
      <div className="hig-container">
        <div className="text-center mb-[var(--space-2xl)]">
          <h2 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-xl)] hig-jp-heading">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="hig-text-body text-[var(--color-text-secondary)] max-w-4xl mx-auto hig-jp-body">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        <div className="mt-[var(--space-2xl)] max-w-4xl mx-auto">
          <HIGCard variant="elevated" padding="lg" className="text-center">
            <Image
              src="/illustrations/jsonld-automation.svg"
              alt="AIO Hub による企業データの AI 最適化プロセス - 情報を構造化してAI検索に最適化"
              width={600}
              height={400}
              className="mx-auto"
            />
          </HIGCard>
        </div>
      </div>
    </section>
  );
}