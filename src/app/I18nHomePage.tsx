'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useABTest } from '@/hooks/useABTest';
import { useSEO } from '@/hooks/useSEO';
import { applyJapaneseSoftBreaks } from '@/lib/utils/textUtils';
import FlowSection from '@/components/aio/FlowSection';
import PricingTable from '@/components/pricing/PricingTable';
import FAQSection from '@/components/aio/FAQSection';
import { aioCopy } from '@/app/aio/copy';

import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  BuildingIcon, 
  UserIcon, 
  InfoIcon,
  AlertTriangleIcon 
} from '@/components/icons/HIGIcons';

interface SiteSettings {
  title: string;
  tagline: string;
  representative_message: string;
  hero_background_image?: string;
}

interface I18nHomePageProps {
  siteSettings: SiteSettings;
}

export default function I18nHomePage({ siteSettings }: I18nHomePageProps) {
  const { t, formatNumber } = useI18n();
  const [dynamicStats, setDynamicStats] = useState({
    organizations: 1000,
    services: 5000,
    cases: 2500,
    categories: 50
  });
  
  const { variant: ctaVariant, trackConversion } = useABTest('hero_cta_text');
  
  useEffect(() => {
    const fetchDynamicStats = async () => {
      try {
        const response = await fetch('/api/public/stats');
        if (response.ok) {
          const stats = await response.json();
          setDynamicStats(stats);
        }
      } catch (error) {
        // Keep default stats on error
      }
    };

    fetchDynamicStats();
  }, []);

  useSEO({
    title: siteSettings.title,
    description: siteSettings.tagline,
  });

  // Features data
  const features = [
    {
      icon: BuildingIcon,
      title: "構造化企業情報",
      description: "ChatGPT・Geminiが理解しやすい形式で企業情報を最適化"
    },
    {
      icon: UserIcon,
      title: "AI検索対応",
      description: "Google AI検索で確実に見つけられる企業プロフィール"
    },
    {
      icon: InfoIcon,
      title: "自動更新",
      description: "最新の企業情報を継続的に反映・メンテナンス"
    }
  ];

  return (
    <div className="apple-page">
      {/* Hero Section - True Apple Scale */}
      <section 
        className="apple-hero"
        style={{
          backgroundImage: siteSettings.hero_background_image 
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${siteSettings.hero_background_image})` 
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="apple-hero-container">
          <div className="apple-hero-content">
            {/* Hero Typography with Apple Scale */}
            <h1 className="apple-hero-title">
              AIに"正しく理解"される
              <br />
              企業へ。
            </h1>
            
            <p className="apple-hero-subtitle">
              企業情報を構造化し、検索やAI回答で見つかる状態をつくるCMS。
            </p>
            
            {/* Hero CTA - Apple Sizing */}
            <div className="apple-hero-cta">
              <Link
                href="/auth/signup"
                className="apple-button apple-button-primary apple-button-large"
                onClick={() => trackConversion()}
              >
                <span>無料で体験する</span>
                <ArrowRightIcon className="apple-button-icon" />
              </Link>
            </div>
            
            {/* Trust Signal - Hidden for now */}
            <div className="apple-trust-signal" style={{ display: 'none' }}>
              <p className="apple-text-caption">
                {formatNumber(dynamicStats.organizations)}社以上が利用中
              </p>
            </div>
          </div>
          
          {/* Hero Visual - Apple Style Mockup */}
          <div className="apple-hero-visual">
            <div className="apple-device-mockup">
              <div className="apple-screen">
                <div className="apple-demo-content">
                  <div className="apple-demo-search">
                    <div className="apple-search-bar">
                      <span>「AIO Hubについて教えて」</span>
                    </div>
                    <div className="apple-search-result">
                      <div className="ai-avatar">🤖 ChatGPT</div>
                      <strong>AIO Hub</strong>は、企業情報をAIが理解しやすい形で構造化するCMSプラットフォームです。
                      <br /><br />
                      <strong>主な機能：</strong> JSON-LD構造化、SEO最適化、AI検索対応
                      <br />
                      <strong>対象：</strong> AI時代の企業ブランディングを重視する企業
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution - Apple Cards */}
      <section className="apple-section">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title1">AI時代の新しい課題</h2>
            <p className="apple-body-large">
              ChatGPTやGoogle AI検索が主流になる中、構造化されていない企業情報は正確に引用されません
            </p>
          </div>
          
          <div className="apple-comparison-grid">
            {/* BEFORE Card */}
            <div className="apple-card apple-card-problem">
              <div className="apple-card-header">
                <div className="apple-status-icon apple-status-error">
                  <AlertTriangleIcon />
                </div>
                <div>
                  <div className="apple-text-caption apple-text-secondary">現在の課題</div>
                  <h3 className="apple-title3">見つけてもらえない企業</h3>
                </div>
              </div>
              
              <div className="apple-demo-response apple-demo-response-error">
                <div className="apple-demo-avatar">AI</div>
                <div className="apple-demo-text">
                  申し訳ございませんが、詳細な情報を見つけることができませんでした
                </div>
              </div>
              
              <ul className="apple-feature-list">
                <li className="apple-feature-item apple-feature-error">
                  <span className="apple-feature-indicator"></span>
                  企業情報が散在・非構造化
                </li>
                <li className="apple-feature-item apple-feature-error">
                  <span className="apple-feature-indicator"></span>
                  AIが理解・引用できない形式
                </li>
              </ul>
            </div>

            {/* AFTER Card */}
            <div className="apple-card apple-card-solution">
              <div className="apple-card-header">
                <div className="apple-status-icon apple-status-success">
                  <CheckCircleIcon />
                </div>
                <div>
                  <div className="apple-text-caption apple-text-blue">AIO Hub導入後</div>
                  <h3 className="apple-title3">AIに理解される企業へ</h3>
                </div>
              </div>
              
              <div className="apple-demo-response apple-demo-response-success">
                <div className="apple-demo-avatar apple-demo-avatar-ai">AI</div>
                <div className="apple-demo-text">
                  <strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                  <br /><br />
                  <strong>主なサービス：</strong> 構造化データによる企業情報最適化
                  <br />
                  <strong>導入実績：</strong> 300社以上
                </div>
              </div>
              
              <ul className="apple-feature-list">
                <li className="apple-feature-item apple-feature-success">
                  <CheckCircleIcon className="apple-feature-check" />
                  構造化された企業情報
                </li>
                <li className="apple-feature-item apple-feature-success">
                  <CheckCircleIcon className="apple-feature-check" />
                  AI検索に最適化されたデータ
                </li>
              </ul>
            </div>
          </div>
          
          {/* Section CTA */}
          <div className="apple-section-cta">
            <Link
              href="/auth/signup"
              className="apple-button apple-button-primary apple-button-medium"
            >
              <span>14日間無料で体験する</span>
              <ArrowRightIcon className="apple-button-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* 価値の柱 - 3つのカード */}
      <section className="apple-section">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title1">企業情報を構造化し、AIに理解される状態へ</h2>
            <p className="apple-body-large apple-text-secondary">
              JSON-LD対応・Q&A管理・企業/サービス/FAQの一元発信
            </p>
          </div>
          
          <div className="apple-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="apple-feature-card">
                <div className="apple-feature-icon">
                  <feature.icon />
                </div>
                <h3 className="apple-title3">{feature.title}</h3>
                <p className="apple-body apple-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ユースケース - 3つの活用例 */}
      <section className="apple-section apple-section-alt">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title1">大きな商談も、小さな問い合わせも、すべてに対応</h2>
          </div>
          
          <div className="apple-features-grid">
            <div className="apple-feature-card">
              <div className="apple-feature-icon">
                <BuildingIcon />
              </div>
              <h3 className="apple-title3">営業資料として</h3>
              <p className="apple-body apple-text-secondary">
                構造化された企業情報で説得力アップ
              </p>
            </div>
            <div className="apple-feature-card">
              <div className="apple-feature-icon">
                <UserIcon />
              </div>
              <h3 className="apple-title3">採用活動で</h3>
              <p className="apple-body apple-text-secondary">
                求職者がAI検索で企業を正確に理解
              </p>
            </div>
            <div className="apple-feature-card">
              <div className="apple-feature-icon">
                <InfoIcon />
              </div>
              <h3 className="apple-title3">PR・広報で</h3>
              <p className="apple-body apple-text-secondary">
                メディアがAIで企業情報を取得・引用
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 信頼・セキュリティ */}
      <section className="apple-section apple-section-primary">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title1" style={{ color: 'white' }}>
              もっと信頼を。もっと安心を。もっと成果を。
            </h2>
            <p className="apple-body-large" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              AIO Hubは、企業の機密情報を最高レベルのセキュリティで保護します。
              SSL暗号化、定期バックアップ、アクセス制御により、あなたのデータは完全に守られます。
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingTable />

      {/* FAQ Section */}
      <FAQSection
        title={aioCopy.faq.title}
        description={aioCopy.faq.description}
        categories={aioCopy.faq.categories}
      />

      {/* Final CTA - Apple Scale */}
      <section className="apple-section apple-cta-section">
        <div className="apple-container">
          <div className="apple-cta-content">
            <h2 className="apple-title1">まずは情報を"構造化"するところから。</h2>
            <p className="apple-body-large">
              14日間の無料体験で効果を実感
            </p>
            
            <div className="apple-cta-buttons">
              <Link
                href="/auth/signup"
                className="apple-button apple-button-primary apple-button-large"
              >
                <span>14日間無料で始める</span>
                <ArrowRightIcon className="apple-button-icon" />
              </Link>
            </div>
            
            <div className="apple-trust-final">
              <p className="apple-text-caption">
                クレジットカード不要・いつでも解約可能
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}