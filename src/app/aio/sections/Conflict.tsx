import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Conflict() {
  return (
    <section className="py-24 md:py-32 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-wide">
            {aioCopy.conflict.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8">
            {aioCopy.conflict.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-green-600 font-bold text-xl">
                    ✓
                  </span>
                </div>
                <p className="text-lg text-gray-700 flex-1 leading-relaxed tracking-normal">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/jsonld-automation.svg"
            alt="情報があってもAIに届かない問題 - 企業情報のサイロ化と発見性の低下"
            ratio="16:9"
            caption="今のAI時代の情報流通課題"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}