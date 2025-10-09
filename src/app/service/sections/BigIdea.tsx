import { serviceCopy } from '../copy';

export default function BigIdea() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {serviceCopy.bigIdea.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.bigIdea.description}
          </p>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg overflow-hidden">
            <div className="aspect-video flex items-center justify-center p-12">
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-6">💡🔧🤖</div>
                <p className="text-xl font-medium mb-2">AIO Hub による企業データの AI 最適化プロセス</p>
                <p className="text-gray-500">情報を構造化してAI検索に最適化</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}