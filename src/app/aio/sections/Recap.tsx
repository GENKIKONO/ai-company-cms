import { aioCopy } from '../copy';

export default function Recap() {
  return (
    <section className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {aioCopy.recap.title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            {aioCopy.recap.description}
          </p>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-video flex items-center justify-center p-12">
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-6">🏗️🤖💡</div>
                <p className="text-xl font-medium mb-2">構造から解消されるAI時代の情報問題</p>
                <p className="text-gray-500">企業ディレクトリプラットフォームで解決</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}