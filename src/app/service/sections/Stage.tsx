import { serviceCopy } from '../copy';

export default function Stage() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {serviceCopy.stage.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.stage.description}
          </p>
        </div>
        
        {/* 図版プレースホルダー */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🔍➡️🤖</div>
              <p className="text-sm">検索からAI回答へのシフト図</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}