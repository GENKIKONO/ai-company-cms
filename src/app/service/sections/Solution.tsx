import { serviceCopy } from '../copy';

export default function Solution() {
  return (
    <section className="section">
      <div className="site-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {serviceCopy.solution.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8 mb-12">
            {serviceCopy.solution.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mt-1">
                  <span className="text-indigo-600 font-bold text-xl">
                    ✓
                  </span>
                </div>
                <p className="text-lg text-gray-700 flex-1 leading-relaxed">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8">
            <p className="text-indigo-800 leading-relaxed">
              <strong>注：</strong> {serviceCopy.solution.note}
            </p>
          </div>
        </div>

        {/* 図版 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-video flex items-center justify-center p-12">
              <div className="text-center text-gray-600">
                <div className="flex justify-center gap-4 mb-6">
                  <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118C6.004 2.42 4.043 1 1.998 1 1.998 1 1.998 1 2 1h2c0 .83.414 1.632 1.083 2zm2.084-1.5C7.5 6.5 8.5 5.5 9.5 5.5s2 1 2 2.5-1 2.5-2 2.5-2-1-2-2.5zm7.916 3.5c-.83 0-1.414-.83-1.414-2s.584-2 1.414-2 1.414.83 1.414 2-.584 2-1.414 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xl font-medium mb-2">フォーム入力から公開ページ生成</p>
                <p className="text-gray-500">簡単操作で企業情報をAI最適化形式で公開</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}