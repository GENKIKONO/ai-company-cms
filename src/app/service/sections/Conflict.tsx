import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Conflict() {
  return (
    <section className="section bg-red-50">
      <div className="container-mk">
        <div className="text-center mb-16">
          <h2 className="h2 mb-8">
            {serviceCopy.conflict.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8">
            {serviceCopy.conflict.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-red-600 font-bold text-xl">
                    ⚠
                  </span>
                </div>
                <p className="copy text-lg text-gray-700 flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/jsonld-automation.svg"
            alt="構造化されていない情報がAIに無視される図 - 従来の企業情報の課題点"
            ratio="16:9"
            caption="従来の非構造化データの課題"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}