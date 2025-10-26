'use client';

import Link from 'next/link';
import { Check, MessageSquare, Target, Building2, Sparkles } from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  badge?: string;
  icon: typeof MessageSquare;
  popular?: boolean;
  features: PlanFeature[];
  ctaText: string;
  ctaHref: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'ライトヒアリング',
    description: '基本構造化',
    price: '30,000円',
    unit: '（税別）',
    icon: MessageSquare,
    popular: false,
    features: [
      { text: 'ヒアリング実施（30分）', included: true },
      { text: '企業の基本情報を短時間でAI最適化', included: true },
      { text: 'JSON-LD形式での納品', included: true },
      { text: '最短2日での納品', included: true },
      { text: 'Q&A項目追加', included: false },
      { text: '継続サポート', included: false }
    ],
    ctaText: 'このプランで依頼する',
    ctaHref: '/contact?plan=starter'
  },
  {
    id: 'business',
    name: 'アドバンスヒアリング',
    description: '戦略構造化',
    price: '70,000円',
    unit: '（税別）',
    badge: '人気',
    icon: Target,
    popular: true,
    features: [
      { text: 'ライトプランの全内容', included: true },
      { text: 'ヒアリング実施（60分）', included: true },
      { text: '採用・PR・B2B向けQ&A拡充で深度ある情報構造', included: true, highlight: true },
      { text: '市場反応に基づく調整', included: true },
      { text: 'AI検索表現の継続改善', included: true, highlight: true },
      { text: 'メール・チャットサポート', included: true }
    ],
    ctaText: 'このプランで依頼する',
    ctaHref: '/contact?plan=business'
  },
  {
    id: 'enterprise',
    name: 'フルヒアリング',
    description: '包括構造化＋運用設計',
    price: '120,000円',
    unit: '（税別）',
    icon: Building2,
    popular: false,
    features: [
      { text: 'アドバンスプランの全内容', included: true },
      { text: 'ヒアリング実施（90分）', included: true },
      { text: 'AI引用を前提とした完全構造化プロフィール', included: true, highlight: true },
      { text: '競合分析・ポジショニング設計', included: true },
      { text: 'AI戦略コンサルティング', included: true, highlight: true },
      { text: '専任担当者によるサポート', included: true }
    ],
    ctaText: '見積もり依頼',
    ctaHref: '/contact?service=enterprise'
  }
];

export default function ApplePricingPlans() {
  return (
    <section className="apple-section">
      <div className="apple-container">
        <div className="apple-section-header">
          <h2 className="apple-title1">シンプルで明確な料金体系</h2>
          <p className="apple-body-large apple-text-secondary">
            対話を通じて企業価値を第三者視点で整理し、AIに理解されやすい構造データとして言語化します。
          </p>
        </div>

        {/* Mobile: 縦積み */}
        <div className="apple-pricing-mobile">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className={`apple-pricing-card ${plan.popular ? 'apple-pricing-card-popular' : ''}`}>
              {plan.badge && (
                <div className="apple-pricing-badge">
                  <span className="apple-pricing-badge-text">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="apple-pricing-header">
                <div className="apple-pricing-icon">
                  <plan.icon />
                </div>
                <h3 className="apple-title3">{plan.name}</h3>
                <p className="apple-body apple-text-secondary">{plan.description}</p>
                <div className="apple-pricing-price">
                  <span className="apple-pricing-current">{plan.price}</span>
                  <span className="apple-pricing-period">{plan.unit}</span>
                </div>
              </div>

              <div className="apple-pricing-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="apple-pricing-feature">
                    <Check className={`apple-pricing-check ${feature.included ? 'apple-pricing-check-included' : 'apple-pricing-check-disabled'}`} />
                    <div className="apple-pricing-feature-content">
                      <span className={`apple-pricing-feature-text ${feature.included ? '' : 'apple-pricing-feature-disabled'}`}>
                        {feature.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="apple-pricing-cta">
                <Link
                  href={plan.ctaHref}
                  className={`apple-button ${plan.popular ? 'apple-button-primary' : 'apple-button-secondary'} apple-button-large`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 3カラムグリッド */}
        <div className="apple-pricing-desktop">
          <div className="apple-pricing-grid">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.id} className={`apple-pricing-card ${plan.popular ? 'apple-pricing-card-popular' : ''}`}>
                {plan.badge && (
                  <div className="apple-pricing-badge">
                    <span className="apple-pricing-badge-text">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="apple-pricing-header">
                  <div className="apple-pricing-icon">
                    <plan.icon />
                  </div>
                  <h3 className="apple-title3">{plan.name}</h3>
                  <p className="apple-body apple-text-secondary">{plan.description}</p>
                  <div className="apple-pricing-price">
                    <span className="apple-pricing-current">{plan.price}</span>
                    <span className="apple-pricing-period">{plan.unit}</span>
                  </div>
                </div>

                <div className="apple-pricing-features">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="apple-pricing-feature">
                      <Check className={`apple-pricing-check ${feature.included ? 'apple-pricing-check-included' : 'apple-pricing-check-disabled'}`} />
                      <div className="apple-pricing-feature-content">
                        <span className={`apple-pricing-feature-text ${feature.included ? '' : 'apple-pricing-feature-disabled'}`}>
                          {feature.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="apple-pricing-cta">
                  <Link
                    href={plan.ctaHref}
                    className={`apple-button ${plan.popular ? 'apple-button-primary' : 'apple-button-secondary'} apple-button-large`}
                  >
                    {plan.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="apple-pricing-footer">
          <p className="apple-body apple-text-secondary">
            すべてのプランに14日間の満足保証が含まれています
          </p>
          <p className="apple-caption apple-text-secondary">
            お困りの際は、<Link href="/contact" className="apple-link">お気軽にお問い合わせください</Link>。
          </p>
        </div>
      </div>
    </section>
  );
}