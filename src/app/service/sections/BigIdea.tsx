import { serviceCopy } from '../copy';

export default function BigIdea() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="aspect-video bg-white border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">💡🔧🤖</div>
              <p className="text-sm">AIO Hub による企業データの AI 最適化プロセス</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}