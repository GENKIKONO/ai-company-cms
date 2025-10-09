import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function BigIdea() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        {/* [CLEANUP] remove placeholder diagram */}
        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/jsonld-automation.svg"
            alt="AIO Hub による企業データの AI 最適化プロセス - 情報を構造化してAI検索に最適化"
            width={600}
            height={400}
            className="p-8"
          />
        </div>
      </div>
    </section>
  );
}