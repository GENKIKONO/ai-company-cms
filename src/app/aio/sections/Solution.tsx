import { aioCopy } from '../copy';

export default function Solution() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {aioCopy.solution.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-6 mb-8">
            {aioCopy.solution.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-lg">
                    ✓
                  </span>
                </div>
                <p className="text-lg text-gray-700 flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-800">
              <strong>注：</strong> {aioCopy.solution.note}
            </p>
          </div>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="aspect-video bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">⚙️🔧📊</div>
              <p className="text-sm">AIO Hub が提供する自動整備機能</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}