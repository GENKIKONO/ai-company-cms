'use client';

/**
 * UpgradeCTA - アップグレード促進コンポーネント
 *
 * 目的:
 * - 非常に積極的なアップグレード誘導
 * - 価格 + 特典一覧 + 「今すぐアップグレード」
 * - コンテキストに応じた表示バリエーション
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, Check, Sparkles, Crown } from 'lucide-react';
import { PLAN_BENEFITS, type PlanBenefit } from '@/types/feature-metadata';
import { PLAN_NAMES, PLAN_PRICES, type PlanType } from '@/config/plans';
import { ROUTES } from '@/lib/routes';

// =====================================================
// Props
// =====================================================

export interface UpgradeCTAProps {
  /** アップグレード先プラン */
  targetPlan: PlanType;
  /** 現在のプラン */
  currentPlan: PlanType;
  /** 対象機能名（強調表示用） */
  featureName?: string;
  /** 表示バリエーション */
  variant?: 'button' | 'card' | 'banner';
  /** 追加のCSS クラス */
  className?: string;
}

// =====================================================
// Button版 - シンプルなボタン
// =====================================================

function UpgradeCTAButton({
  targetPlan,
  className,
}: UpgradeCTAProps) {
  const planName = PLAN_NAMES[targetPlan];

  return (
    <Link href={ROUTES.dashboardSettingsPlan} className={className}>
      <Button variant="primary" size="md">
        <Zap className="w-4 h-4 mr-2" />
        {planName}プランへアップグレード
      </Button>
    </Link>
  );
}

// =====================================================
// Card版 - 特典付きカード
// =====================================================

function UpgradeCTACard({
  targetPlan,
  featureName,
  className,
}: UpgradeCTAProps) {
  const planName = PLAN_NAMES[targetPlan];
  const planPrice = PLAN_PRICES[targetPlan];
  const benefits = PLAN_BENEFITS[targetPlan] || [];

  // 対象機能を強調
  const sortedBenefits = featureName
    ? [
        ...benefits.filter((b) => b.text.includes(featureName)),
        ...benefits.filter((b) => !b.text.includes(featureName)),
      ].slice(0, 5)
    : benefits.slice(0, 5);

  return (
    <div
      className={cn(
        'border border-[var(--aio-primary)]/30 rounded-xl p-5 bg-gradient-to-br from-[var(--aio-muted)] to-white',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-[var(--aio-primary)]" />
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {planName} プランにアップグレード
        </h3>
      </div>

      <ul className="space-y-2 mb-4">
        {sortedBenefits.map((benefit, index) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 text-sm',
              featureName && benefit.text.includes(featureName)
                ? 'text-[var(--aio-primary)] font-medium'
                : 'text-[var(--color-text-secondary)]'
            )}
          >
            <Check className="w-4 h-4 text-[var(--aio-success)] flex-shrink-0" />
            {benefit.text}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--dashboard-card-border)]">
        <div>
          <span className="text-2xl font-bold text-[var(--aio-primary)]">
            ¥{planPrice.toLocaleString()}
          </span>
          <span className="text-sm text-[var(--color-text-tertiary)]">/月（税込）</span>
        </div>
        <Link href={ROUTES.dashboardSettingsPlan}>
          <Button variant="primary" size="md">
            今すぐアップグレード
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =====================================================
// Banner版 - 横長バナー
// =====================================================

function UpgradeCTABanner({
  targetPlan,
  featureName,
  className,
}: UpgradeCTAProps) {
  const planName = PLAN_NAMES[targetPlan];
  const planPrice = PLAN_PRICES[targetPlan];

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-[var(--aio-primary)] to-[var(--aio-primary)]/80',
        'rounded-lg p-4 text-white',
        className
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <p className="font-semibold">
              {featureName ? `${featureName}を解放しよう` : `${planName}プランにアップグレード`}
            </p>
            <p className="text-sm opacity-90">
              月額 ¥{planPrice.toLocaleString()} で全機能が使えます
            </p>
          </div>
        </div>
        <Link href={ROUTES.dashboardSettingsPlan}>
          <Button
            variant="ghost"
            size="md"
            className="bg-white text-[var(--aio-primary)] hover:bg-white/90"
          >
            <Zap className="w-4 h-4 mr-1" />
            今すぐアップグレード
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =====================================================
// メインコンポーネント
// =====================================================

export function UpgradeCTA({
  targetPlan,
  currentPlan,
  featureName,
  variant = 'button',
  className,
}: UpgradeCTAProps) {
  // 既にターゲットプラン以上の場合は表示しない
  const planHierarchy: PlanType[] = ['trial', 'starter', 'pro', 'business', 'enterprise'];
  const currentLevel = planHierarchy.indexOf(currentPlan);
  const targetLevel = planHierarchy.indexOf(targetPlan);

  if (currentLevel >= targetLevel) {
    return null;
  }

  switch (variant) {
    case 'card':
      return (
        <UpgradeCTACard
          targetPlan={targetPlan}
          currentPlan={currentPlan}
          featureName={featureName}
          className={className}
        />
      );
    case 'banner':
      return (
        <UpgradeCTABanner
          targetPlan={targetPlan}
          currentPlan={currentPlan}
          featureName={featureName}
          className={className}
        />
      );
    case 'button':
    default:
      return (
        <UpgradeCTAButton
          targetPlan={targetPlan}
          currentPlan={currentPlan}
          className={className}
        />
      );
  }
}

export default UpgradeCTA;
