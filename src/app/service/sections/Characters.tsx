import { serviceCopy } from '../copy';
import VisualCard from '../../../components/marketing/VisualCard';

export default function Characters() {
  return (
    <section className="section bg-white">
      <div className="container-mk">
        <div className="text-center mb-16">
          <h2 className="h2 mb-8">
            {serviceCopy.characters.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8">
            {serviceCopy.characters.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-indigo-600 font-bold text-lg">
                    {index + 1}
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
            src="/illustrations/aio-architecture.svg"
            alt="企業・ユーザー・AIO Hub の関係図 - 3者間のデータ連携フロー"
            ratio="16:9"
            caption="企業・ユーザー・AIO Hubの関係図"
            contain={true}
            width={800}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}