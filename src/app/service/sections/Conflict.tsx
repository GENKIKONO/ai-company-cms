import { serviceCopy } from '../copy';
import { AlertTriangleIcon } from '@/components/icons/HIGIcons';

export default function Conflict() {
  return (
    <section className="section--alt">
      <div className="site-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            {serviceCopy.conflict.title}
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-8">
            {serviceCopy.conflict.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mt-1">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
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
                <div className="flex justify-center gap-4 mb-6">
                  <AlertTriangleIcon className="w-16 h-16 text-red-500" aria-label="構造化されていない情報" />
                </div>
                <p className="text-xl font-medium mb-2">構造化されていない情報がAIに無視される図</p>
                <p className="text-gray-500">従来の企業情報の課題点</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}