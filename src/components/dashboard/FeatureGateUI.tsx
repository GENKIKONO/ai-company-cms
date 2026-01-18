'use client';

/**
 * FeatureGateUI - 機能制限時の統一UIコンポーネント
 *
 * 目的:
 * - プラン制限で機能が利用できない時の親切なUI表示
 * - 機能の価値を伝え、アップグレードを促す
 * - 全ページで統一されたUXを提供
 *
 * デザイン原則:
 * - 「動かない、遅い、使いづらい、不親切、不誠実は悪」
 * - 世界商用レベルのUXを目指す
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardFooter } from '@/components/dashboard/ui';
import { Lock, Sparkles, ArrowRight, Check, Zap } from 'lucide-react';
import type { FeatureGateInfo, PlanBenefit } from '@/types/feature-metadata';
import { PLAN_BENEFITS } from '@/types/feature-metadata';
import type { PlanType } from '@/config/plans';
import { ROUTES } from '@/lib/routes';

// =====================================================
// Props
// =====================================================

export interface FeatureGateUIProps {
  /** ゲート情報（/api/dashboard/init から取得） */
  gateInfo: {
    key: string;
    available: boolean;
    metadata: {
      displayName: string;
      description: string;
      category: string;
      controlType: string;
      availableFrom: string;
      icon?: string;
    };
    currentPlan: string;
    currentPlanName: string;
    upgradePlan?: string;
    upgradePlanName?: string;
    upgradePlanPrice?: number;
    quota?: {
      used: number;
      limit: number;
      unlimited: boolean;
      resetDate?: string;
      period?: string;
    };
  };
  /** 表示バリエーション */
  variant?: 'full' | 'compact' | 'inline';
  /** 追加のCSS クラス */
  className?: string;
  /** ダッシュボードへ戻るリンクを表示するか */
  showBackLink?: boolean;
}

// =====================================================
// アイコンマッピング
// =====================================================

function getFeatureIcon(iconName?: string): React.ReactNode {
  // lucide アイコン名からコンポーネントを取得
  // 動的インポートは複雑になるため、主要なアイコンのみマッピング
  const iconMap: Record<string, React.ReactNode> = {
    Brain: <Sparkles className="w-8 h-8" />,
    Mic: <Zap className="w-8 h-8" />,
    Eye: <Sparkles className="w-8 h-8" />,
    Briefcase: <Sparkles className="w-8 h-8" />,
    FileText: <Sparkles className="w-8 h-8" />,
    Award: <Sparkles className="w-8 h-8" />,
    HelpCircle: <Sparkles className="w-8 h-8" />,
    Newspaper: <Sparkles className="w-8 h-8" />,
    Code: <Sparkles className="w-8 h-8" />,
    Activity: <Sparkles className="w-8 h-8" />,
    BadgeCheck: <Sparkles className="w-8 h-8" />,
    Users: <Sparkles className="w-8 h-8" />,
  };

  return iconName && iconMap[iconName] ? iconMap[iconName] : <Sparkles className="w-8 h-8" />;
}

// =====================================================
// Full版 - ページ全体を置換
// =====================================================

function FeatureGateUIFull({
  gateInfo,
  className,
  showBackLink = true,
}: FeatureGateUIProps) {
  const { metadata, currentPlanName, upgradePlan, upgradePlanName, upgradePlanPrice } = gateInfo;

  // アップグレード先の特典を取得
  const benefits = upgradePlan
    ? PLAN_BENEFITS[upgradePlan as PlanType] || []
    : [];

  // 対象機能を強調
  const highlightedBenefits = benefits.map((b) => ({
    ...b,
    isTargetFeature: b.text.includes(metadata.displayName) || b.isTargetFeature,
  }));

  // 対象機能を先頭に
  const sortedBenefits = [
    ...highlightedBenefits.filter((b) => b.isTargetFeature),
    ...highlightedBenefits.filter((b) => !b.isTargetFeature),
  ].slice(0, 6); // 最大6件表示

  return (
    <div className={cn('min-h-[60vh] flex items-center justify-center p-6', className)}>
      <div className="max-w-xl w-full">
        <DashboardCard variant="elevated" padding="lg">
          {/* ヘッダー */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--aio-primary)]/10 text-[var(--aio-primary)] mb-4">
              {getFeatureIcon(metadata.icon)}
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              {metadata.displayName}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {metadata.description}
            </p>
          </div>

          {/* プラン制限メッセージ */}
          <div className="bg-[var(--aio-muted)] rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[var(--aio-primary)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[var(--aio-primary)]">
                  この機能は {metadata.availableFrom === 'pro' ? 'Pro' : metadata.availableFrom === 'business' ? 'Business' : metadata.availableFrom.charAt(0).toUpperCase() + metadata.availableFrom.slice(1)} プラン以上でご利用いただけます
                </p>
                <p className="text-sm text-[var(--aio-primary)] mt-1">
                  現在のプラン: <span className="font-semibold">{currentPlanName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* アップグレード特典 */}
          {upgradePlan && sortedBenefits.length > 0 && (
            <div className="border border-[var(--aio-primary)]/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[var(--aio-primary)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {upgradePlanName} プランにアップグレードすると...
                </h3>
              </div>
              <ul className="space-y-2">
                {sortedBenefits.map((benefit, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      benefit.isTargetFeature
                        ? 'text-[var(--aio-primary)] font-medium'
                        : 'text-[var(--color-text-secondary)]'
                    )}
                  >
                    <Check
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        benefit.isTargetFeature
                          ? 'text-[var(--aio-primary)]'
                          : 'text-[var(--aio-success)]'
                      )}
                    />
                    {benefit.text}
                    {benefit.comparison && (
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        ({benefit.comparison})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {upgradePlanPrice && (
                <p className="mt-4 pt-3 border-t border-[var(--dashboard-card-border)] text-center text-sm text-[var(--color-text-secondary)]">
                  月額 <span className="text-lg font-bold text-[var(--aio-primary)]">¥{upgradePlanPrice.toLocaleString()}</span>
                  <span className="text-[var(--color-text-tertiary)]">（税込）</span>
                  で全機能解放
                </p>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <DashboardCardFooter justify="center" className="flex-col gap-3">
            <Link href={ROUTES.dashboardSettingsPlan} className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                今すぐ {upgradePlanName || 'Pro'} プランへアップグレード
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div className="flex gap-3 w-full">
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  全プランを比較する
                </Button>
              </Link>
              {showBackLink && (
                <Link href={ROUTES.dashboard} className="flex-1">
                  <Button variant="ghost" size="md" className="w-full">
                    ダッシュボードに戻る
                  </Button>
                </Link>
              )}
            </div>
          </DashboardCardFooter>
        </DashboardCard>
      </div>
    </div>
  );
}

// =====================================================
// Compact版 - カード内に表示
// =====================================================

function FeatureGateUICompact({
  gateInfo,
  className,
}: FeatureGateUIProps) {
  const { metadata, upgradePlanName, upgradePlanPrice } = gateInfo;

  return (
    <div
      className={cn(
        'bg-[var(--aio-muted)] rounded-lg p-4 border border-[var(--aio-primary)]/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--aio-primary)]/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-[var(--aio-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--color-text-primary)]">
            {metadata.displayName}
          </h4>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {metadata.availableFrom === 'pro' ? 'Pro' : metadata.availableFrom === 'business' ? 'Business' : metadata.availableFrom.charAt(0).toUpperCase() + metadata.availableFrom.slice(1)} プラン以上で利用可能
          </p>
          {upgradePlanPrice && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {upgradePlanName}: ¥{upgradePlanPrice.toLocaleString()}/月
            </p>
          )}
        </div>
        <Link href={ROUTES.dashboardSettingsPlan}>
          <Button variant="primary" size="sm">
            アップグレード
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =====================================================
// Inline版 - ボタン横に小さく表示
// =====================================================

function FeatureGateUIInline({
  gateInfo,
  className,
}: FeatureGateUIProps) {
  const { metadata, upgradePlanName } = gateInfo;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Lock className="w-4 h-4 text-[var(--color-text-tertiary)]" />
      <span className="text-sm text-[var(--color-text-tertiary)]">
        {metadata.displayName}は{upgradePlanName || 'Pro'}プラン以上で利用可能
      </span>
      <Link
        href={ROUTES.dashboardSettingsPlan}
        className="text-sm text-[var(--aio-primary)] hover:underline"
      >
        アップグレード →
      </Link>
    </div>
  );
}

// =====================================================
// メインコンポーネント
// =====================================================

export function FeatureGateUI({
  gateInfo,
  variant = 'full',
  className,
  showBackLink = true,
}: FeatureGateUIProps) {
  // 利用可能な場合は何も表示しない
  if (gateInfo.available) {
    return null;
  }

  switch (variant) {
    case 'compact':
      return <FeatureGateUICompact gateInfo={gateInfo} className={className} />;
    case 'inline':
      return <FeatureGateUIInline gateInfo={gateInfo} className={className} />;
    case 'full':
    default:
      return (
        <FeatureGateUIFull
          gateInfo={gateInfo}
          className={className}
          showBackLink={showBackLink}
        />
      );
  }
}

export default FeatureGateUI;
