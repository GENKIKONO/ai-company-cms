import { serviceCopy } from '../copy';

export default function Recap() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {serviceCopy.recap.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {serviceCopy.recap.description}
          </p>
        </div>

        {/* 図版プレースホルダー */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎯🤖💼</div>
              <p className="text-sm">AIの回答に企業が表示される未来像</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}