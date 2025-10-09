import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Recap() {
  return (
    <section className="section bg-gray-50">
      <div className="container-mk">
        <div className="text-center">
          <h2 className="h2 mb-8">
            {serviceCopy.recap.title}
          </h2>
          <p className="copy text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
            {serviceCopy.recap.description}
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <VisualCard
            src="/illustrations/aio-architecture.svg"
            alt="AIの回答に企業が表示される未来像 - AI時代の企業情報発見の新しい形"
            ratio="16:9"
            caption="AIO HubによるAI時代の企業情報連携"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}