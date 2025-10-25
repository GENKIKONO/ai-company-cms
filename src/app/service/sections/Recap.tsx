import Image from 'next/image';
import { serviceCopy } from '../copy';
import { HIGCard } from '@/components/ui/HIGCard';

export default function Recap() {
  return (
    <section className="hig-section bg-[var(--color-background-secondary)]">
      <div className="hig-container">
        <div className="text-center">
          <h2 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-xl)] hig-jp-heading">
            {serviceCopy.recap.title}
          </h2>
          <p className="hig-text-body text-[var(--color-text-secondary)] mb-[var(--space-xl)] max-w-4xl mx-auto hig-jp-body">
            {serviceCopy.recap.description}
          </p>
        </div>

        <div className="mt-[var(--space-2xl)] max-w-4xl mx-auto">
          <HIGCard variant="elevated" padding="lg" className="text-center">
            <Image
              src="/illustrations/zero-click-hero.svg"
              alt="AIの回答に企業が表示される未来像 - AI時代の企業情報発見の新しい形"
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