'use client';

import { X, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ComparisonSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-10">
      <SectionHeader 
        title="構造化前後の大きな違い"
        subtitle="ヒアリングによってあなたの企業情報がどのように変わるかをご覧ください"
        className="mb-16"
      />

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-8">
        {/* Before Card */}
        <div className="aio-surface relative border-2 border-gray-200 p-8 hover:shadow-xl transition-all duration-300" aria-label="構造化前">
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
        <div className="aio-surface relative border-2 border-[var(--aio-primary)] p-8 hover:shadow-xl transition-all duration-300" aria-label="構造化後">
          <div className="absolute -top-4 left-8">
            <div className="flex items-center gap-2 hig-bg-surface hig-text-primary px-4 py-2 rounded-full border border-[var(--aio-primary)]">
              <Check className="h-4 w-4" />
              <span className="font-bold">構造化後</span>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="p-4 hig-bg-surface rounded-xl border border-[var(--border-light)]">
              <div className="space-y-2">
                <div><strong className="hig-text-primary">対象業界:</strong> 製造業・小売業・サービス業</div>
                <div><strong className="hig-text-primary">主力サービス:</strong> ECサイト構築・在庫管理システム</div>
              </div>
            </div>
            <div className="p-4 hig-bg-surface rounded-xl border border-[var(--border-light)]">
              <div className="space-y-2">
                <div><strong className="hig-text-primary">導入実績:</strong> 中小企業への豊富な導入経験</div>
                <div><strong className="hig-text-primary">特徴:</strong> 短期間での効果実現を重視</div>
              </div>
            </div>
            <div className="p-4 hig-bg-surface rounded-xl border border-[var(--border-light)]">
              <div className="space-y-2">
                <div><strong className="hig-text-primary">差別化:</strong> ノーコード対応・24時間サポート</div>
                <div><strong className="hig-text-primary">価格:</strong> 月額5万円〜・初期費用無料</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-3 hig-text-primary">
            <Check className="h-5 w-5" />
            <span className="font-medium">具体的でAIが理解しやすい</span>
          </div>
          
          {/* 期待できる成果 */}
          <div className="mt-8 p-6 hig-bg-surface rounded-xl border border-[var(--aio-primary)]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 hig-text-primary" />
              <h4 className="font-bold hig-text-primary">期待できる成果</h4>
            </div>
            <ul className="space-y-2 text-sm hig-text-primary">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 hig-text-primary" />
                ChatGPT検索で上位表示
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 hig-text-primary" />
                Google AI Overviewで引用
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 hig-text-primary" />
                商談・採用の問い合わせ増加
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 hig-text-primary" />
                メディア取材の機会拡大
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}