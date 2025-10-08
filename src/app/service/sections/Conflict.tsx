import { serviceCopy } from '../copy';

export default function Conflict() {
  return (
    <section className="py-16 md:py-20 bg-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {serviceCopy.conflict.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-6">
            {serviceCopy.conflict.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-red-600 font-semibold text-lg">
                    ⚠
                  </span>
                </div>
                <p className="text-lg text-gray-700 flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="aspect-video bg-white border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📄❌🤖</div>
              <p className="text-sm">構造化されていない情報がAIに無視される図</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}