import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Solution() {
  return (
    <section className="section bg-white">
      <div className="container-mk">
        <div className="text-center mb-12">
          <h2 className="h2 mb-8">
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
                <p className="copy text-lg text-gray-700 flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="copy text-sm text-yellow-800">
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