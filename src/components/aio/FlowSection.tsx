'use client';

import { FileText, Cog, Rocket, ArrowRight, CheckCircle } from 'lucide-react';
import HorizontalScroller from '@/components/ui/HorizontalScroller';

interface FlowStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly details: readonly string[];
  readonly color: string;
}

interface BeforeAfter {
  readonly title: string;
  readonly description: string;
  readonly before: {
    readonly title: string;
    readonly items: readonly string[];
    readonly problem: string;
  };
  readonly after: {
    readonly title: string;
    readonly items: readonly string[];
    readonly benefit: string;
  };
}

interface FlowSectionProps {
  title: string;
  description: string;
  steps: readonly FlowStep[];
  beforeAfter: BeforeAfter;
}

const iconComponents = {
  1: FileText,
  2: Cog,
  3: Rocket,
};

const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      step: 'bg-blue-600',
      accent: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      step: 'bg-purple-600',
      accent: 'text-purple-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      step: 'bg-indigo-600',
      accent: 'text-indigo-600'
    }
  };
  return colors[color as keyof typeof colors];
};

export default function FlowSection({ title, description, steps, beforeAfter }: FlowSectionProps) {
  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            {title.split('\n').map((line, index) => (
              <span key={index} className="block">{line}</span>
            ))}
          </h2>
          <p className="text-[15px] sm:text-base leading-7 sm:leading-8 text-gray-600 max-w-3xl mx-auto">
            {description.split('\n').map((line, index) => (
              <span key={index} className="block">{line}</span>
            ))}
          </p>
        </div>

        {/* フローステップ */}
        <div className="mb-16 sm:mb-20">
          <HorizontalScroller ariaLabel="AIOの実現ステップ" className="lg:grid-cols-3">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              const IconComponent = iconComponents[step.step as keyof typeof iconComponents];
              
              return (
                <div key={step.step} className="snap-start min-w-[300px] sm:min-w-0 relative">
                  <div className={`relative bg-white border-2 ${colors.border} rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group h-full`}>
                    {/* ステップ番号 */}
                    <div className={`absolute -top-3 left-4 w-6 h-6 sm:w-8 sm:h-8 ${colors.step} text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm`}>
                      {step.step}
                    </div>
                    
                    {/* アイコン */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-4 sm:mb-6 motion-reduce:transition-none group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`} />
                    </div>
                    
                    {/* タイトル・説明 */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                    <p className="text-[15px] sm:text-base text-gray-600 mb-4 sm:mb-6 leading-6 sm:leading-7">{step.description}</p>
                    
                    {/* 詳細リスト */}
                    <ul className="space-y-2 sm:space-y-2.5">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <CheckCircle className={`w-4 h-4 ${colors.accent} mt-0.5 flex-shrink-0`} />
                          <span className="text-[13px] sm:text-sm text-gray-700 leading-5">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </HorizontalScroller>
        </div>

        {/* Before/After セクション */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-12">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {beforeAfter.title}
            </h3>
            <p className="text-[15px] sm:text-base leading-7 sm:leading-8 text-gray-600 max-w-2xl mx-auto">
              {beforeAfter.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Before */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-red-200">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {beforeAfter.before.title}
                </span>
              </div>
              <div className="space-y-3">
                {beforeAfter.before.items.map((item, index) => (
                  <div key={index} className="bg-gray-100 rounded p-3 font-mono text-xs sm:text-sm leading-5">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs sm:text-sm text-red-600 text-center leading-5">
                ❌ {beforeAfter.before.problem}
              </div>
            </div>

            {/* After */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-200">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {beforeAfter.after.title}
                </span>
              </div>
              <div className="space-y-3">
                {beforeAfter.after.items.map((item, index) => (
                  <div key={index} className="bg-blue-50 rounded p-3 border-l-4 border-blue-400 font-mono text-xs sm:text-sm leading-5">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs sm:text-sm text-green-600 text-center leading-5">
                ✅ {beforeAfter.after.benefit}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}