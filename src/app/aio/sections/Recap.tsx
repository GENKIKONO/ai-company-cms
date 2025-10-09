import { aioCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Recap() {
  return (
    <section className="section bg-gray-50">
      <div className="container-mk">
        <div className="text-center">
          <h2 className="h2 mb-8">
            {aioCopy.recap.title}
          </h2>
          <p className="copy text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
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