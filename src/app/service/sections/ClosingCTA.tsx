import Link from 'next/link';
import { serviceCopy } from '../copy';

export default function ClosingCTA() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {serviceCopy.closingCTA.title}
          </h2>
          
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            AI時代に対応した企業情報管理で、検索性・発見性を劇的に向上させましょう
          </p>

          {/* メインCTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link
              href={serviceCopy.closingCTA.primaryHref}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-white to-blue-50 text-gray-900 rounded-xl font-bold text-lg hover:from-blue-50 hover:to-white transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
            >
              <span>{serviceCopy.closingCTA.primaryText}</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            
            <Link
              href={serviceCopy.closingCTA.secondaryHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              {serviceCopy.closingCTA.secondaryText}
            </Link>
          </div>

          {/* 追加情報 */}
          <div className="text-center">
            <p className="text-blue-200 text-sm mb-4">
              ✓ 無料で始められます　✓ 設定サポート付き　✓ いつでもキャンセル可能
            </p>
            <p className="text-blue-300 text-xs">
              ※ 企業ディレクトリ登録・サービス管理機能をすべて無料でご利用いただけます
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}