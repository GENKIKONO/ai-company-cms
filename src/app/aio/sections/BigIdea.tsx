import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function BigIdea() {
  return (
    <section className="section bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container-mk">
        <div className="text-center mb-16">
          <h2 className="h2 mb-8">
            {aioCopy.bigIdea.title}
          </h2>
          <p className="copy text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
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