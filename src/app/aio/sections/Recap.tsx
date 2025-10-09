import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Recap() {
  return (
    <section className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-wide">
            {aioCopy.recap.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed tracking-normal">
            {aioCopy.recap.description}
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/aio-architecture.svg"
            alt="構造化され解消されるAI時代の情報問題 - AIO Hubプラットフォームで解決"
            ratio="16:9"
            caption="AIO Hubによる情報問題の解決"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}