import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function BigIdea() {
  return (
    <section className="section bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container-mk">
        <div className="text-center mb-16">
          <h2 className="h2 mb-8">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="copy text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/jsonld-automation.svg"
            alt="JSON-LD 自動生成システム - 企業情報を AI が理解できる構造化データに自動変換"
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