import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function BigIdea() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-wide">
            {aioCopy.bigIdea.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed tracking-normal">
            {aioCopy.bigIdea.description}
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/aio-architecture.svg"
            alt="AIO Hubによるドメインパワー強化効果 - 統合プラットフォームによる検索ランキング向上"
            ratio="16:9"
            caption="AIO Hubのプラットフォームアーキテクチャ"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}