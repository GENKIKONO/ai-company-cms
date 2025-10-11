'use client';

import { Check, Star, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

interface PricingPlan {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly period: string;
  readonly icon: string;
  readonly popular: boolean;
  readonly features: readonly string[];
  readonly limitations: readonly string[];
  readonly color: string;
  readonly buttonText: string;
}

interface PricingSectionProps {
  title: string;
  description: string;
  plans: readonly PricingPlan[];
  notes: {
    readonly included: readonly string[];
    readonly payment: readonly string[];
  };
}

const iconComponents = {
  Star,
  Crown,
};

const getColorClasses = (color: string, popular: boolean = false) => {
  const colors = {
    blue: {
      bg: popular ? 'bg-blue-600' : 'bg-white',
      border: 'border-blue-200',
      text: popular ? 'text-white' : 'text-gray-900',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    purple: {
      bg: popular ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-white',
      border: 'border-purple-200',
      text: popular ? 'text-white' : 'text-gray-900',
      accent: 'text-purple-600',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
    }
  };
  return colors[color as keyof typeof colors];
};

export default function PricingSection({ title, description, plans, notes }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-gray-50">
      <div className="wide-container">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-wide">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* 料金プラン */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const colors = getColorClasses(plan.color, plan.popular);
            const IconComponent = iconComponents[plan.icon as keyof typeof iconComponents];
            
            return (
              <div key={plan.name} className="relative">
                {/* 人気バッジ */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium shadow-lg">
                      <Zap className="w-4 h-4" />
                      おすすめ
                    </span>
                  </div>
                )}
                
                <div className={`relative ${colors.bg} ${plan.popular ? '' : 'border-2 ' + colors.border} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
                  {/* プランヘッダー */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 ${plan.popular ? 'bg-white/20' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-8 h-8 ${plan.popular ? 'text-white' : colors.accent}`} />
                    </div>
                    <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>{plan.name}</h3>
                    <p className={`${plan.popular ? 'text-white/80' : 'text-gray-600'} mb-4 leading-relaxed`}>
                      {plan.description}
                    </p>
                    
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-4xl font-bold ${colors.text}`}>
                        {plan.price === '0' ? '無料' : `¥${plan.price}`}
                      </span>
                      <span className={`${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                        {plan.price !== '0' && '/'} {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* 機能リスト */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                        <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-700'} leading-relaxed`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start gap-3 opacity-70">
                        <div className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-gray-400'} mt-0.5 flex-shrink-0 text-center`}>×</div>
                        <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-gray-500'} leading-relaxed`}>
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTAボタン */}
                  <Link
                    href="/organizations"
                    className={`block w-full text-center px-6 py-4 ${colors.button} rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 追加情報 */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">料金に関する補足</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">含まれるもの</h4>
                <ul className="space-y-1">
                  {notes.included.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">お支払い・契約</h4>
                <ul className="space-y-1">
                  {notes.payment.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}