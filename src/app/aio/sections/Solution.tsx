import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Solution() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-wide">
            {aioCopy.solution.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-6 mb-8">
            {aioCopy.solution.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-lg">
                    ✓
                  </span>
                </div>
                <p className="text-lg text-gray-700 flex-1 leading-relaxed tracking-normal">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-800 leading-relaxed tracking-normal">
              <strong>注：</strong> {aioCopy.solution.note}
            </p>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/jsonld-automation.svg"
            alt="AIO Hub が提供する自動整備機能 - 情報を自動で構造化しAI検索に最適化"
            ratio="16:9"
            caption="JSON-LD 自動生成システム"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}