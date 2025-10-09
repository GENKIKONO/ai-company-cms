import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Characters() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-wide">
            {aioCopy.characters.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8">
            {aioCopy.characters.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-indigo-600 font-bold text-lg">
                    {index + 1}
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
            src="/illustrations/aio-architecture.svg"
            alt="企業・プラットフォーム・AIの連携図 - 統合プラットフォームによる情報連携"
            ratio="16:9"
            caption="AIO Hubによる情報連携図"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}