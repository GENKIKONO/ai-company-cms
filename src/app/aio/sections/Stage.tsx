import { aioCopy } from '../copy';

export default function Stage() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            {aioCopy.stage.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            {aioCopy.stage.description}
          </p>
          
          {/* 図版 */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg overflow-hidden">
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-4">🤖📊✨</div>
                  <p className="text-lg font-medium">AI Information Optimization</p>
                  <p className="text-sm text-gray-500 mt-2">情報を構造化してAIが理解しやすい形に最適化</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}