import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Recap() {
  return (
    <section className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {serviceCopy.recap.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.recap.description}
          </p>
        </div>

        {/* [CLEANUP] remove placeholder diagram */}
        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/zero-click-hero.svg"
            alt="AIの回答に企業が表示される未来像 - AI時代の企業情報発見の新しい形"
            width={600}
            height={400}
            className="p-8"
          />
        </div>
      </div>
    </section>
  );
}