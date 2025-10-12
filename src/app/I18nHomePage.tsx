'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Building2, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useABTest } from '@/hooks/useABTest';
import { useSEO } from '@/hooks/useSEO';
import { applyJapaneseSoftBreaks } from '@/lib/utils/textUtils';
import FlowSection from '@/components/aio/FlowSection';
import PricingTable from '@/components/pricing/PricingTable';
import FAQSection from '@/components/aio/FAQSection';
import { aioCopy } from '@/app/aio/copy';

interface SiteSettings {
  title: string;
  tagline: string;
  representative_message: string;
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
        console.error('Failed to fetch dynamic stats:', error);
      }
    };
    
    fetchDynamicStats();
    setTimeout(() => {
      applyJapaneseSoftBreaks();
    }, 100);
  }, []);

  useSEO({
    title: t('pages.home.title'),
    description: t('pages.home.description'),
    canonical: 'https://aiohub.jp/',
    keywords: ['AI', 'CMS', '企業管理', 'DX', 'デジタル変革'],
    type: 'website',
  });

  const handleCtaClick = () => {
    trackConversion();
  };

  const features = [
    {
      icon: Building2,
      title: "AI引用最適化",
      description: "企業情報を構造化データとして整備し、AIが理解・引用しやすい形に自動変換"
    },
    {
      icon: Zap,
      title: "ドメインパワー共有",
      description: "信頼性の高いプラットフォームに情報を集約することで、検索・AI回答での露出を向上"
    },
    {
      icon: Users,
      title: "アクセス流入促進",
      description: "構造化された企業情報から自社サイトやSNSへの質の高い流入を創出"
    }
  ];

  const stats = [
    { label: "登録企業", value: formatNumber(dynamicStats.organizations), unit: "社" },
    { label: "管理サービス", value: formatNumber(dynamicStats.services), unit: "件" },
    { label: "導入事例", value: formatNumber(dynamicStats.cases), unit: "件" },
  ];

  return (
    <div className="min-h-screen bg-clean">
      <main>
        {/* Hero Section */}
        <section className="section">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-display text-neutral-900 mb-6 text-balance jp-text">
                  AI企業CMS
                  <span className="text-primary block">AIO Hub</span>
                </h1>
                <p className="text-body-large text-neutral-600 mb-8 jp-text">
                  <strong>ゼロクリック時代</strong>にAIが理解・引用しやすい企業情報を構築。検索結果からAI回答まで、企業が"選ばれる"プラットフォームです。
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link 
                    href="/auth/signup" 
                    onClick={handleCtaClick}
                    className="btn btn-primary btn-large"
                  >
                    無料で始める
                    <ArrowRight className="icon icon-sm" />
                  </Link>
                  <Link 
                    href="/organizations" 
                    className="btn btn-secondary btn-large"
                  >
                    企業ディレクトリを見る
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-3 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-h2 text-primary mb-2">{stat.value}</div>
                      <div className="text-body-small text-neutral-600 jp-text">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="space-y-6">
                    <div className="badge badge-primary">
                      <Zap className="icon icon-sm" />
                      ゼロクリック対応
                    </div>
                    <h3 className="text-h3 text-neutral-900 jp-text">
                      AIに選ばれる企業情報を構築
                    </h3>
                    <ul className="feature-list">
                      <li className="feature-item">
                        <CheckCircle className="feature-icon" />
                        <span className="text-body jp-text">構造化データ自動生成</span>
                      </li>
                      <li className="feature-item">
                        <CheckCircle className="feature-icon" />
                        <span className="text-body jp-text">AI引用最適化</span>
                      </li>
                      <li className="feature-item">
                        <CheckCircle className="feature-icon" />
                        <span className="text-body jp-text">流入促進とSEO強化</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section bg-subtle">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
                ゼロクリック時代の企業戦略
              </h2>
              <p className="text-body-large text-neutral-600 jp-text">
                AIが情報を直接回答する時代に、企業が"選ばれる"ための仕組みを提供
              </p>
            </div>

            <div className="grid grid-3">
              {features.map((feature, index) => (
                <div key={index} className="card text-center">
                  <feature.icon className="icon icon-lg text-primary mx-auto mb-4" />
                  <h3 className="text-h3 text-neutral-900 mb-4 jp-text">
                    {feature.title}
                  </h3>
                  <p className="text-body text-neutral-600 jp-text">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section">
          <div className="container-narrow text-center">
            <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
              ゼロクリック時代に取り残されませんか？
            </h2>
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              AIが企業を"選ぶ"時代。構造化された情報で検索・AI回答での露出を確保し、新たな流入機会を創出しましょう。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="btn btn-primary btn-large"
              >
                無料で始める
                <ArrowRight className="icon icon-sm" />
              </Link>
              <Link 
                href="/hearing-service"
                className="btn btn-secondary btn-large"
              >
                ヒアリング代行サービス
              </Link>
            </div>

            <div className="mt-8 text-body-small text-neutral-500 jp-text">
              無料トライアル • クレジットカード不要
            </div>
          </div>
        </section>

        {/* Flow Section - ゼロクリック時代の課題と解決策 */}
        <FlowSection
          title={aioCopy.flow.title}
          description={aioCopy.flow.description}
          steps={aioCopy.flow.steps}
          beforeAfter={aioCopy.flow.beforeAfter}
        />

        {/* Pricing Section - 料金プラン */}
        <PricingTable />

        {/* FAQ Section - よくある質問 */}
        <FAQSection
          title={aioCopy.faq.title}
          description={aioCopy.faq.description}
          categories={aioCopy.faq.categories}
        />

        {/* Final CTA Section */}
        <section className="section bg-subtle">
          <div className="container-narrow text-center">
            <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
              今すぐゼロクリック時代に備えましょう
            </h2>
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              無料プランでAIO Hubの価値を体験し、AI時代の企業情報戦略を始めてください。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="btn btn-primary btn-large"
              >
                無料で始める
                <ArrowRight className="icon icon-sm" />
              </Link>
              <Link 
                href="/hearing-service"
                className="btn btn-secondary btn-large"
              >
                ヒアリング代行サービス
              </Link>
            </div>

            <div className="mt-8 text-body-small text-neutral-500 jp-text">
              永続無料プラン • クレジットカード不要 • 今すぐ開始
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="section bg-neutral-900 text-white">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-h3 mb-4 jp-text">AIO Hub</h3>
                <p className="text-body text-neutral-300 jp-text">
                  AI技術を活用した企業情報の統合管理プラットフォーム
                </p>
              </div>
              <div>
                <h4 className="text-body font-semibold mb-4 jp-text">リンク</h4>
                <ul className="space-y-2">
                  <li><Link href="/organizations" className="text-neutral-300 hover:text-white">企業ディレクトリ</Link></li>
                  <li><Link href="/search" className="text-neutral-300 hover:text-white">検索</Link></li>
                  <li><Link href="/dashboard" className="text-neutral-300 hover:text-white">ダッシュボード</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-body font-semibold mb-4 jp-text">サポート</h4>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-neutral-300 hover:text-white">ヘルプ</Link></li>
                  <li><Link href="/contact" className="text-neutral-300 hover:text-white">お問い合わせ</Link></li>
                  <li><Link href="/terms" className="text-neutral-300 hover:text-white">利用規約</Link></li>
                  <li><Link href="/privacy" className="text-neutral-300 hover:text-white">プライバシー</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-700 mt-8 pt-8 text-center">
              <p className="text-body-small text-neutral-400 jp-text">
                © 2024 AIO Hub. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}