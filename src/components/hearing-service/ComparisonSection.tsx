'use client';

import { X, Check, AlertTriangle, Sparkles } from 'lucide-react';

export default function ComparisonSection() {
  return (
    <section id="comparison" className="section-spacing">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            構造化前後の
            <span className="text-[var(--bg-primary)]">
              大きな違い
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ヒアリングによってあなたの企業情報がどのように変わるかをご覧ください
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Before Card */}
          <div className="aio-surface relative border-2 border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="absolute -top-4 left-8">
              <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full border border-gray-200">
                <X className="h-4 w-4" />
                <span className="font-bold">構造化前</span>
              </div>
            </div>
            
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-700 italic">
                  "弊社は総合的なITソリューションを提供しています..."
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-700 italic">
                  "様々な業界のお客様にご利用いただいております..."
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-700 italic">
                  "高品質なサービスで満足度向上を実現..."
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-3 text-gray-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">抽象的で検索されにくい</span>
            </div>
          </div>

          {/* After Card */}
          <div className="aio-surface relative border-2 border-blue-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="absolute -top-4 left-8">
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
                <Check className="h-4 w-4" />
                <span className="font-bold">構造化後</span>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="space-y-2">
                  <div><strong className="text-blue-800">対象業界:</strong> 製造業・小売業・サービス業</div>
                  <div><strong className="text-blue-800">主力サービス:</strong> ECサイト構築・在庫管理システム</div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="space-y-2">
                  <div><strong className="text-blue-800">導入実績:</strong> 中小企業への豊富な導入経験</div>
                  <div><strong className="text-blue-800">特徴:</strong> 短期間での効果実現を重視</div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="space-y-2">
                  <div><strong className="text-blue-800">差別化:</strong> ノーコード対応・24時間サポート</div>
                  <div><strong className="text-blue-800">価格:</strong> 月額5万円〜・初期費用無料</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-3 text-blue-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">具体的でAIが理解しやすい</span>
            </div>
            
            {/* 期待できる成果 */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-blue-800">期待できる成果</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  ChatGPT検索で上位表示
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  Google AI Overviewで引用
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  商談・採用の問い合わせ増加
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  メディア取材の機会拡大
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}