import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Solution() {
  return (
    <section className="section bg-white">
      <div className="container-mk">
        <div className="text-center mb-16">
          <h2 className="h2 mb-8">
            {serviceCopy.solution.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8 mb-12">
            {serviceCopy.solution.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-indigo-600 font-bold text-xl">
                    ✓
                  </span>
                </div>
                <p className="copy text-lg text-gray-700 flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8">
            <p className="copy text-indigo-800">
              <strong>注：</strong> {serviceCopy.solution.note}
            </p>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/aio-architecture.svg"
            alt="AIO Architecture - 企業情報と AI サービスを最適化接続する統合プラットフォーム"
            ratio="16:9"
            caption="AIO アーキテクチャ"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}