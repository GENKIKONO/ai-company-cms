import { serviceCopy } from '../copy';

export default function Characters() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
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
                <p className="text-lg text-gray-700 flex-1 leading-relaxed">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-video flex items-center justify-center p-12">
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-6">🏢👤🤖</div>
                <p className="text-xl font-medium mb-2">企業・ユーザー・AIO Hubの関係図</p>
                <p className="text-gray-500">3者間のデータ連携フロー</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}