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
import { LockIcon, SaveIcon, ShieldIcon, ChartUpIcon } from '@/components/icons/SecurityIcons';
import SectionMedia, { HeroMedia, FeatureMedia, IconMedia } from '@/components/media/SectionMedia';
import { PrimaryCTA, SecondaryCTA } from '@/design-system';

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
      {/* 1. Hero Section（白） */}
      <section className="sec-white">
        <div className={`site-container hero-bg-overlay${siteSettings.hero_background_image ? ' hero-bg-gradient relative' : ''}`} 
             style={{
               backgroundImage: siteSettings.hero_background_image 
                 ? `url(${siteSettings.hero_background_image})` 
                 : undefined,
               padding: '80px clamp(16px, 4vw, 24px)'
             }}>
          <div className="content-center-800">
            {/* Hero Typography */}
            <h1 className="hero-title" style={{ 
              color: siteSettings.hero_background_image ? 'var(--bg-white)' : 'var(--text-primary)'
            }}>
              AIに"正しく理解"される
              <br />
              企業へ。
            </h1>
            
            <p className="hero-subtitle" style={{ 
              color: siteSettings.hero_background_image ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
            }}>
              企業情報を構造化し、検索やAI回答で見つかる状態をつくるCMS。
            </p>
            
            {/* チップ */}
            <div className="flex-center-gap-12 mb-40">
              <span className="tag">構造化データ</span>
              <span className="tag">AI検索最適化</span>
              <span className="tag">JSON-LD対応</span>
            </div>
            
            {/* CTA */}
            <div className="flex-center-gap-16">
              <PrimaryCTA
                href="/auth/signup"
                size="large"
                showArrow={true}
                onClick={() => trackConversion()}
              >
                14日間無料で試す
              </PrimaryCTA>
              <SecondaryCTA
                href="/contact"
                size="large"
              >
                専門ヒアリング相談
              </SecondaryCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 2. キー便益・導線（薄灰） */}
      <section className="sec-alt">
        <div className="site-container section-padding-y-80">
          <div className="text-center mb-64">
            <h2 className="text-h2-large">大きな商談も、小さな問い合わせも、すべてに対応</h2>
          </div>
          
          <div className="grid-auto-fit-300 mb-48">
            <div className="card-feature">
              <div className="mb-24">
                <div className="color-primary">
                  <BuildingIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-h3">営業資料として</h3>
              <p className="text-body">構造化された企業情報で説得力アップ</p>
            </div>
            <div className="card-feature">
              <div className="mb-24">
                <div className="color-primary">
                  <UserIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-h3">採用活動で</h3>
              <p className="text-body">求職者がAI検索で企業を正確に理解</p>
            </div>
            <div className="card-feature">
              <div className="mb-24">
                <div className="color-primary">
                  <InfoIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-h3">PR・広報で</h3>
              <p className="text-body">メディアがAIで企業情報を取得・引用</p>
            </div>
          </div>
          
          <div className="flex-center-gap-16">
            <SecondaryCTA href="/contact" size="medium">
              今すぐヒアリング申込み
            </SecondaryCTA>
            <SecondaryCTA href="#pricing" size="medium">
              料金プランを見る
            </SecondaryCTA>
          </div>
        </div>
      </section>

      {/* 画像スロット1: キー便益後 */}
      <section className="sec-white">
        <div className="site-container section-padding-y-40">
          <FeatureMedia 
            caption="導入企業様の構造化された企業プロフィール例"
            align="center"
            className="shadow-lg"
          />
        </div>
      </section>

      {/* 3. 仕組み/3ステップ（白） */}
      <section className="sec-white">
        <div className="site-container section-padding-y-80">
          <div className="text-center mb-64">
            <h2 className="text-h2-large">シンプルな3ステップでAI最適化を実現</h2>
            <p className="text-body-large">
              簡単な手続きで、企業情報が構造化され、AIで検索される状態に
            </p>
          </div>
          
          <div className="grid-steps">
            <div className="card-step-grey">
              <div className="step-number">1</div>
              <h3 className="text-h3">申し込み</h3>
              <ul className="list-feature">
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  企業名・業界・规模を入力
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  主要サービス・特徴を選択
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  14日間無料トライアル開始
                </li>
              </ul>
            </div>
            
            <div className="card-step-grey">
              <div className="step-number">2</div>
              <h3 className="text-h3">ヒアリング（60分）</h3>
              <ul className="list-feature">
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  現在の情報発信状況を確認
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  AI検索最適化の方向性を相談
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  カスタマイズプランを提案
                </li>
              </ul>
            </div>
            
            <div className="card-step-grey">
              <div className="step-number">3</div>
              <h3 className="text-h3">AI最適化・公開</h3>
              <ul className="list-feature">
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  JSON-LD構造化データ生成
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  AI検索エンジンに最適化
                </li>
                <li className="list-item-with-icon">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  企業情報ハブを即座公開
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 画像スロット2: 3ステップ後 - 削除予定 */}
      <section className="sec-white hidden">
        <div className="site-container section-padding-y-40">
          <HeroMedia 
            caption="3ステップでAI最適化された企業情報管理画面"
            align="center"
            className="shadow-xl"
          />
        </div>
      </section>

      {/* 4. 信頼・安心（青・強調帯） */}
      <section className="sec-primary">
        <div className="site-container section-padding-y-80">
          <div className="text-center mb-48">
            <h2 className="text-security-title">
              もっと信頼を。もっと安心を。もっと成果を。
            </h2>
            <p className="text-security-description">
              AIO Hubは、企業の機密情報を最高レベルのセキュリティで保護します。
            </p>
          </div>
          
          <div className="grid-auto-fit-250 text-center">
            <div>
              <div className="mb-16 flex justify-center">
                <LockIcon className="w-12 h-12" />
              </div>
              <h4 className="text-feature-title">SSL暗号化</h4>
              <p className="text-small text-feature-white">通信の完全暗号化</p>
            </div>
            <div>
              <div className="mb-16 flex justify-center">
                <SaveIcon className="w-12 h-12" />
              </div>
              <h4 className="text-feature-title">定期バックアップ</h4>
              <p className="text-small text-feature-white">データの安全な保管</p>
            </div>
            <div>
              <div className="mb-16 flex justify-center">
                <ShieldIcon className="w-12 h-12" />
              </div>
              <h4 className="text-feature-title">アクセス制御</h4>
              <p className="text-small text-feature-white">権限管理とログ監視</p>
            </div>
            <div>
              <div className="mb-16 flex justify-center">
                <ChartUpIcon className="w-12 h-12" />
              </div>
              <h4 className="text-feature-title">監査ログ</h4>
              <p className="text-small text-feature-white">全操作の記録・追跡</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 活用シーン（白） */}
      <section className="sec-white">
        <div className="site-container section-padding-y-80">
          <div className="text-center mb-64">
            <h2 className="text-h2-large">AI時代の新しい課題を解決</h2>
            <p className="text-body-large">
              ChatGPTやGoogle AI検索が主流になる中、構造化されていない企業情報は正確に引用されません
            </p>
          </div>
          
          <div className="grid-auto-fit-400">
            {/* BEFORE */}
            <div className="comparison-card-error">
              <div className="mb-24">
                <div className="color-error">
                  <AlertTriangleIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-comparison-title text-comparison-error">見つけてもらえない企業</h3>
              <div className="comparison-card" style={{ 
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div className="flex-items-center-mb-8">
                  <div className="icon-ai-badge icon-ai-error">AI</div>
                  <strong className="text-error">エラー</strong>
                </div>
                <p className="text-small">申し訳ございませんが、詳細な情報を見つけることができませんでした</p>
              </div>
              <ul className="text-small-list">
                <li className="list-error-item">• 企業情報が散在・非構造化</li>
                <li className="list-error-item">• AIが理解・引用できない形式</li>
              </ul>
            </div>
            
            {/* AFTER */}
            <div className="comparison-card-success">
              <div className="mb-24">
                <div className="color-success">
                  <CheckCircleIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-comparison-title text-comparison-primary">AIに理解される企業へ</h3>
              <div className="comparison-card" style={{ 
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div className="flex-items-center-mb-8">
                  <div className="icon-ai-badge icon-ai-primary">AI</div>
                  <strong className="color-primary">成功</strong>
                </div>
                <p className="text-small" style={{ color: '#374151' }}><strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。</p>
              </div>
              <ul className="text-small-list">
                <li className="list-success-item">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  構造化された企業情報
                </li>
                <li className="list-success-item">
                  <div className="icon-check-green">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  AI検索に最適化されたデータ
                </li>
              </ul>
            </div>
          </div>
          
          {/* 画像スロット3: Before/After比較内 */}
          <div className="text-center mt-48 mb-48">
            <FeatureMedia 
              caption="構造化前後での検索結果の違い（実際の比較画面）"
              align="center"
              className="shadow-lg"
            />
          </div>
          
          <div className="text-center mt-48">
            <PrimaryCTA
              href="/auth/signup"
              size="large"
              showArrow={true}
            >
              14日間無料で体験する
            </PrimaryCTA>
          </div>
        </div>
      </section>

      {/* 画像スロット4: 料金プラン前 */}
      <section className="sec-white">
        <div className="site-container section-padding-y-40">
          <IconMedia 
            caption="料金体系の概要"
            align="center"
            className="shadow-md"
          />
        </div>
      </section>

      {/* 6. 料金（薄灰） */}
      <section className="sec-alt" id="pricing">
        <div className="site-container section-padding-y-80">
          <PricingTable />
        </div>
      </section>

      {/* 7. FAQ + 最終CTA（白） */}
      <section className="sec-white">
        <div className="site-container section-padding-y-80">
          {/* その他の質問セクション */}
          <div className="cta-box" style={{ 
            marginBottom: '80px'
          }}>
            <h2 className="text-cta-title">
              その他のご質問がございましたら
            </h2>
            <p className="text-description">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <PrimaryCTA
              href="/contact"
              size="large"
              showArrow={true}
            >
              お問い合わせフォーム
            </PrimaryCTA>
          </div>
          
          <FAQSection
            title={aioCopy.faq.title}
            description={aioCopy.faq.description}
            categories={aioCopy.faq.categories}
          />
          
          {/* 最終CTA */}
          <div className="cta-box-large" style={{ 
            marginTop: '80px'
          }}>
            <h2 className="text-cta-large">まずは情報を"構造化"するところから。</h2>
            <p className="text-body-large" style={{ marginBottom: '40px' }}>
              14日間の無料体験で効果を実感
            </p>
            
            <div className="flex-center-gap-16 mb-32">
              <PrimaryCTA
                href="/auth/signup"
                size="large"
                showArrow={true}
              >
                14日間無料で始める
              </PrimaryCTA>
              <SecondaryCTA
                href="/contact"
                size="large"
              >
                専門ヒアリング相談
              </SecondaryCTA>
            </div>
            
            <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
              クレジットカード不要・いつでも解約可能
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}