/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, PRICING_CONFIG } from '@/lib/pricing';
import { HIGButton } from '@/components/ui/HIGButton';
import { PLAN_LABELS, formatPriceLabel } from '@/config/planLabels';
import { PrimaryCTA } from '@/components/ui/UnifiedCTA';

// Dynamic class mapping for Tailwind purge safety
const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-cyan-600",      // Starter - 水色系
  green: "text-blue-600",     // Pro - 青系
  purple: "text-slate-800",   // Business - 黒系
  indigo: "text-indigo-600",
  gray: "text-slate-600",
};

interface PlanFeature {
  text: string;
  included: boolean;
  subtext?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  icon: typeof Star;
  popular?: boolean;
  inheritedFeatures?: string;
  features: PlanFeature[];
  ctaText: string;
  ctaHref: string;
  color: string;
  comingSoon?: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: PLAN_LABELS.starter,
    description: 'AI最適化CMS体験',
    price: '¥2,980',
    badge: '14日間無料',
    icon: Star,
    popular: false,
    features: [
      { text: 'ロゴ・企業情報を構造化公開（JSON‑LD）', included: true },
      { text: 'サービス登録：5件まで', included: true },
      { text: 'Q&A項目：10件まで', included: true },
      { text: 'Hub内構造化＋自社サイト埋め込み', included: true },
      { text: 'SEO最適化・構造化データ自動生成', included: true },
      { text: 'メールサポート', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'blue'
  },
  {
    id: 'pro',
    name: PLAN_LABELS.pro,
    description: 'AI Visibility・成長分析',
    price: '¥8,000',
    icon: Zap,
    popular: true,
    inheritedFeatures: 'Starterプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：20件まで', included: true },
      { text: 'Q&A項目：50件まで', included: true },
      { text: '営業資料添付（最大10個）', included: true },
      { text: 'AI Visibility分析レポート', included: true },
      { text: '外部リンク表示機能', included: true },
      { text: 'カテゴリタグ検索対応', included: true },
      { text: '優先サポート', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'green'
  },
  {
    id: 'business',
    name: PLAN_LABELS.business,
    description: '分析＋ブランド特化',
    price: '¥15,000',
    icon: Crown,
    popular: false,
    inheritedFeatures: 'Proプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：無制限', included: true },
      { text: 'Q&A項目：無制限', included: true },
      { text: '営業資料添付（無制限）', included: true },
      { text: 'Verified法人バッジ', included: true },
      { text: 'AI解析レポート（拡張版）', included: true },
      { text: 'ブランド分析・競合監視', included: true },
      { text: 'カスタム機能開発相談', included: true },
      { text: '専任サポート・個別相談', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'purple'
  }
];

export default function PricingTable() {
  return (
    <>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>
            シンプルで明確な料金体系
          </h2>
          <p style={{ fontSize: '20px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
            無料から始めて、必要になったら拡張。最小の入力で、Schema.org準拠の企業情報構造化を実現します。
          </p>
        </div>

        {/* Mobile: Vertical Stack */}
        <div className="lg:hidden">
          <div className="apple-pricing-mobile">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`apple-pricing-card ${
                  plan.popular
                    ? 'apple-pricing-card-popular'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="apple-pricing-badge">
                    <span className="apple-pricing-badge-text">
                      人気
                    </span>
                  </div>
                )}

                <div className="apple-pricing-header">
                  <div className="apple-pricing-icon">
                    <plan.icon className={`${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                  </div>
                  <h3 className="apple-title3">{plan.name}</h3>
                  <p className="apple-body apple-text-secondary">{plan.description}</p>
                  
                  <div className="apple-pricing-price">
                    {plan.originalPrice && (
                      <span className="apple-pricing-original">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="apple-pricing-current">
                      {plan.price}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="apple-pricing-period">（税別）/月</span>
                    )}
                  </div>
                </div>

                <ul className="apple-pricing-features">
                  {plan.inheritedFeatures && (
                    <li className="apple-pricing-inherited">
                      <span className="apple-pricing-inherited-text">
                        {plan.inheritedFeatures}
                      </span>
                    </li>
                  )}
                  {plan.features.map((feature, index) => (
                    <li key={index} className="apple-pricing-feature">
                      <Check
                        className={`apple-pricing-check ${
                          feature.included ? 'apple-pricing-check-included' : 'apple-pricing-check-disabled'
                        }`}
                      />
                      <div className="apple-pricing-feature-content">
                        <span
                          className={`apple-pricing-feature-text ${
                            feature.included ? '' : 'apple-pricing-feature-disabled'
                          }`}
                        >
                          {feature.text}
                        </span>
                        {feature.subtext && (
                          <div className="apple-pricing-feature-subtext">
                            {feature.subtext}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="apple-pricing-cta">
                  <PrimaryCTA
                    href={plan.ctaHref}
                    size="medium"
                  >
                    {plan.ctaText}
                  </PrimaryCTA>
                </div>

                {plan.comingSoon && (
                  <div className="apple-pricing-coming-soon">
                    {plan.comingSoon.map((note, index) => (
                      <p key={index} className="apple-text-caption apple-text-secondary">{note}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="apple-pricing-desktop">
          <div className="apple-pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`apple-pricing-card ${
                plan.popular
                  ? 'apple-pricing-card-popular'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="apple-pricing-badge">
                  <span className="apple-pricing-badge-text">
                    人気
                  </span>
                </div>
              )}

              <div className="apple-pricing-header">
                <div className="apple-pricing-icon">
                  <plan.icon className={`${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                </div>
                <h3 className="apple-title3">{plan.name}</h3>
                <p className="apple-body apple-text-secondary">{plan.description}</p>
                
                <div className="apple-pricing-price">
                  {plan.originalPrice && (
                    <span className="apple-pricing-original">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="apple-pricing-current">
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="apple-pricing-period">（税別）/月</span>
                  )}
                </div>
              </div>

              <ul className="apple-pricing-features">
                {plan.inheritedFeatures && (
                  <li className="apple-pricing-inherited">
                    <span className="apple-pricing-inherited-text">
                      {plan.inheritedFeatures}
                    </span>
                  </li>
                )}
                {plan.features.map((feature, index) => (
                  <li key={index} className="apple-pricing-feature">
                    <Check
                      className={`apple-pricing-check ${
                        feature.included ? 'apple-pricing-check-included' : 'apple-pricing-check-disabled'
                      }`}
                    />
                    <div className="apple-pricing-feature-content">
                      <span
                        className={`apple-pricing-feature-text ${
                          feature.included ? '' : 'apple-pricing-feature-disabled'
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="apple-pricing-feature-subtext">
                          {feature.subtext}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="apple-pricing-cta">
                <PrimaryCTA
                  href={plan.ctaHref}
                  size="medium"
                >
                  {plan.ctaText}
                </PrimaryCTA>
              </div>

              {plan.comingSoon && (
                <div className="apple-pricing-coming-soon">
                  {plan.comingSoon.map((note, index) => (
                    <p key={index} className="apple-text-caption apple-text-secondary">{note}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
        
        {/* Enterprise consultation note */}
        <div className="apple-pricing-footer">
          <p className="apple-body apple-text-secondary">
            Enterpriseプランの詳細な機能や導入サポートについては、お気軽にお問い合わせください
          </p>

          <p className="apple-text-caption apple-text-secondary">
            ※価格は税別。詳細機能についてはお問い合わせください。<br/>
            お支払いはクレジットカード・銀行振込に対応。いつでもプラン変更・解約可能です。
          </p>
        </div>
    </>
  );
}