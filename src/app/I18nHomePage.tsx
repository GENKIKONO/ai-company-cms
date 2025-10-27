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
      {/* 1. Hero Section（白） */}
      <section className="section section--white">
        <div className="site-container" style={{
          backgroundImage: siteSettings.hero_background_image 
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${siteSettings.hero_background_image})` 
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '16px',
          padding: '80px clamp(16px, 4vw, 24px)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            {/* Hero Typography */}
            <h1 style={{ 
              fontSize: 'clamp(32px, 5vw, 64px)', 
              fontWeight: '700', 
              lineHeight: '1.1', 
              marginBottom: '24px',
              color: siteSettings.hero_background_image ? '#FFFFFF' : 'var(--text-primary)'
            }}>
              AIに"正しく理解"される
              <br />
              企業へ。
            </h1>
            
            <p style={{ 
              fontSize: '20px', 
              lineHeight: '1.5', 
              marginBottom: '32px',
              color: siteSettings.hero_background_image ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
            }}>
              企業情報を構造化し、検索やAI回答で見つかる状態をつくるCMS。
            </p>
            
            {/* チップ */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
              <span style={{ padding: '8px 16px', backgroundColor: 'rgba(10, 132, 255, 0.1)', color: 'var(--bg-primary)', borderRadius: '20px', fontSize: '14px' }}>構造化データ</span>
              <span style={{ padding: '8px 16px', backgroundColor: 'rgba(10, 132, 255, 0.1)', color: 'var(--bg-primary)', borderRadius: '20px', fontSize: '14px' }}>AI検索最適化</span>
              <span style={{ padding: '8px 16px', backgroundColor: 'rgba(10, 132, 255, 0.1)', color: 'var(--bg-primary)', borderRadius: '20px', fontSize: '14px' }}>JSON-LD対応</span>
            </div>
            
            {/* CTA */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/auth/signup"
                className="apple-button apple-button-primary apple-button-large"
                onClick={() => trackConversion()}
              >
                <span>14日間無料で試す</span>
                <ArrowRightIcon className="apple-button-icon" />
              </Link>
              <Link
                href="/contact"
                className="apple-button apple-button-secondary apple-button-large"
              >
                <span>専門ヒアリング相談</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. キー便益・導線（薄灰） */}
      <section className="section section--alt">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>大きな商談も、小さな問い合わせも、すべてに対応</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: 'var(--bg-primary)' }}>
                  <BuildingIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>営業資料として</h3>
              <p style={{ fontSize: '17px', lineHeight: '1.5' }}>構造化された企業情報で説得力アップ</p>
            </div>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: 'var(--bg-primary)' }}>
                  <UserIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>採用活動で</h3>
              <p style={{ fontSize: '17px', lineHeight: '1.5' }}>求職者がAI検索で企業を正確に理解</p>
            </div>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: 'var(--bg-primary)' }}>
                  <InfoIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>PR・広報で</h3>
              <p style={{ fontSize: '17px', lineHeight: '1.5' }}>メディアがAIで企業情報を取得・引用</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="apple-button apple-button-secondary apple-button-medium">
              <span>今すぐヒアリング申込み</span>
            </Link>
            <Link href="#pricing" className="apple-button apple-button-secondary apple-button-medium">
              <span>料金プランを見る</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 仕組み/3ステップ（白） */}
      <section className="section section--white">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>シンプルな3ステップでAI最適化を実現</h2>
            <p style={{ fontSize: '20px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              簡単な手続きで、企業情報が構造化され、AIで検索される状態に
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                fontSize: '36px',
                fontWeight: '700',
                color: 'white',
                fontVariantNumeric: 'lining-nums tabular-nums'
              }}>1</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>申し込み</h3>
              <ul style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '17px' }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  企業名・業界・规模を入力
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  主要サービス・特徴を選択
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  14日間無料トライアル開始
                </li>
              </ul>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                fontSize: '36px',
                fontWeight: '700',
                color: 'white',
                fontVariantNumeric: 'lining-nums tabular-nums'
              }}>2</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>ヒアリング（60分）</h3>
              <ul style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '17px' }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  現在の情報発信状況を確認
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  AI検索最適化の方向性を相談
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  カスタマイズプランを提案
                </li>
              </ul>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                fontSize: '36px',
                fontWeight: '700',
                color: 'white',
                fontVariantNumeric: 'lining-nums tabular-nums'
              }}>3</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>AI最適化・公開</h3>
              <ul style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '17px' }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  JSON-LD構造化データ生成
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  AI検索エンジンに最適化
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#34C759', marginRight: '8px', display: 'inline-flex' }}>
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  企業情報ハブを即座公開
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 信頼・安心（青・強調帯） */}
      <section className="section section--primary">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>
              もっと信頼を。もっと安心を。もっと成果を。
            </h2>
            <p style={{ fontSize: '20px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)' }}>
              AIO Hubは、企業の機密情報を最高レベルのセキュリティで保護します。
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>SSL暗号化</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>通信の完全暗号化</p>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>💾</div>
              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>定期バックアップ</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>データの安全な保管</p>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚫</div>
              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>アクセス制御</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>権限管理とログ監視</p>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📈</div>
              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>監査ログ</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>全操作の記録・追跡</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 活用シーン（白） */}
      <section className="section section--white">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>AI時代の新しい課題を解決</h2>
            <p style={{ fontSize: '20px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              ChatGPTやGoogle AI検索が主流になる中、構造化されていない企業情報は正確に引用されません
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px' }}>
            {/* BEFORE */}
            <div style={{ 
              backgroundColor: '#FEF2F2', 
              border: '1px solid #FECACA', 
              borderRadius: '16px', 
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#EF4444' }}>
                  <AlertTriangleIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#DC2626' }}>見つけてもらえない企業</h3>
              <div style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '24px', height: '24px', backgroundColor: '#EF4444', borderRadius: '50%', marginRight: '8px', fontSize: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AI</div>
                  <strong style={{ color: '#EF4444' }}>エラー</strong>
                </div>
                <p style={{ fontSize: '15px', color: '#6B7280' }}>申し訳ございませんが、詳細な情報を見つけることができませんでした</p>
              </div>
              <ul style={{ textAlign: 'left', fontSize: '15px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '8px', color: '#EF4444' }}>• 企業情報が散在・非構造化</li>
                <li style={{ marginBottom: '8px', color: '#EF4444' }}>• AIが理解・引用できない形式</li>
              </ul>
            </div>
            
            {/* AFTER */}
            <div style={{ 
              backgroundColor: '#F0F9FF', 
              border: '1px solid #BAE6FD', 
              borderRadius: '16px', 
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#10B981' }}>
                  <CheckCircleIcon className="w-12 h-12" />
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--bg-primary)' }}>AIに理解される企業へ</h3>
              <div style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%', marginRight: '8px', fontSize: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AI</div>
                  <strong style={{ color: 'var(--bg-primary)' }}>成功</strong>
                </div>
                <p style={{ fontSize: '15px', color: '#374151' }}><strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。</p>
              </div>
              <ul style={{ textAlign: 'left', fontSize: '15px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '8px', color: '#10B981', display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: '8px', display: 'inline-flex', color: '#10B981' }}>
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  構造化された企業情報
                </li>
                <li style={{ marginBottom: '8px', color: '#10B981', display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: '8px', display: 'inline-flex', color: '#10B981' }}>
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  AI検索に最適化されたデータ
                </li>
              </ul>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link
              href="/auth/signup"
              className="apple-button apple-button-primary apple-button-large"
            >
              <span>14日間無料で体験する</span>
              <ArrowRightIcon className="apple-button-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 料金（薄灰） */}
      <section className="section section--alt" id="pricing">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <PricingTable />
        </div>
      </section>

      {/* 7. FAQ + 最終CTA（白） */}
      <section className="section section--white">
        <div className="site-container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <FAQSection
            title={aioCopy.faq.title}
            description={aioCopy.faq.description}
            categories={aioCopy.faq.categories}
          />
          
          {/* 最終CTA */}
          <div style={{ textAlign: 'center', marginTop: '80px', padding: '64px 32px', backgroundColor: '#F9FAFB', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px' }}>まずは情報を"構造化"するところから。</h2>
            <p style={{ fontSize: '20px', lineHeight: '1.5', marginBottom: '40px', color: 'var(--text-secondary)' }}>
              14日間の無料体験で効果を実感
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
              <Link
                href="/auth/signup"
                className="apple-button apple-button-primary apple-button-large"
              >
                <span>14日間無料で始める</span>
                <ArrowRightIcon className="apple-button-icon" />
              </Link>
              <Link
                href="/contact"
                className="apple-button apple-button-secondary apple-button-large"
              >
                <span>専門ヒアリング相談</span>
              </Link>
            </div>
            
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              クレジットカード不要・いつでも解約可能
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}