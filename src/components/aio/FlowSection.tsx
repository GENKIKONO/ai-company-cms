'use client';

import { FileText, Cog, Rocket, ArrowRight, CheckCircle } from 'lucide-react';

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
    <section className="section bg-clean">
      <div className="container">
        {/* セクションヘッダー */}
        <div className="mb-12">
          <h2 className="text-h1 text-neutral-900 mb-6 text-center jp-text">
            {title.split('\n').map((line, index) => (
              <span key={index} className="block jp-text">{line}</span>
            ))}
          </h2>
          <p className="text-body-large text-neutral-600 text-center jp-text">
            {description.split('\n').map((line, index) => (
              <span key={index} className="block jp-text">{line}</span>
            ))}
          </p>
        </div>

        {/* フローステップ */}
        <div className="hig-space-stack-xl">
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              const IconComponent = iconComponents[step.step as keyof typeof iconComponents];
              
              return (
                <div key={step.step} className="card relative overflow-visible group p-6 sm:p-7">
                  {/* Step Badge - positioned outside to prevent clipping */}
                  <div className="absolute -top-4 -left-4 z-10 pointer-events-none">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${colors.step} text-white text-sm font-semibold ring-4 ring-white`}>
                      {step.step}
                    </span>
                  </div>
                  
                  {/* アイコン */}
                  <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-6 `}>
                    <IconComponent className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  
                  {/* タイトル・説明 */}
                  <h3 className="text-h3 text-neutral-900 mb-3 jp-text">{step.title}</h3>
                  <p className="text-body text-neutral-600 mb-6 jp-text">{step.description}</p>
                  
                  {/* 詳細リスト */}
                  <ul className="space-y-2.5">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 ${colors.accent} mt-0.5 flex-shrink-0`} />
                        <span className="text-body-small text-neutral-700 jp-text">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Before/After セクション */}
        <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-12">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-h2 text-neutral-900 mb-4 jp-text">
              {beforeAfter.title}
            </h3>
            <p className="text-body-large text-neutral-600 max-w-2xl mx-auto jp-text">
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
              <div className="mt-4 text-xs sm:text-sm text-red-600 text-center leading-5 flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m15 9-6 6"></path>
                  <path d="m9 9 6 6"></path>
                </svg>
                {beforeAfter.before.problem}
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
              <div className="mt-4 text-xs sm:text-sm text-green-600 text-center leading-5 flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                {beforeAfter.after.benefit}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}