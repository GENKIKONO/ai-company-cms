'use client';

/**
 * QuotaWarning - クォータ警告コンポーネント
 *
 * 目的:
 * - クォータ残量が少ない時のインライン警告
 * - 上限到達時の明確なメッセージ表示
 * - アップグレード誘導
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap, XCircle, TrendingUp } from 'lucide-react';
import { PLAN_NAMES, type PlanType } from '@/config/plans';
import { ROUTES } from '@/lib/routes';

// =====================================================
// Props
// =====================================================

export interface QuotaWarningProps {
  /** 機能表示名 */
  featureName: string;
  /** 使用済み数 */
  used: number;
  /** 上限数 */
  limit: number;
  /** 無制限かどうか */
  unlimited?: boolean;
  /** 次のリセット日（ISO8601） */
  resetDate?: string;
  /** 現在のプラン */
  currentPlan?: PlanType;
  /** アップグレード先プラン */
  upgradePlan?: PlanType;
  /** アップグレード後の上限（オプション） */
  upgradeLimit?: number | 'unlimited';
  /** 表示バリエーション */
  variant?: 'inline' | 'banner' | 'alert';
  /** 残り何％以下で警告表示するか（デフォルト: 20%） */
  warningThreshold?: number;
  /** 追加のCSS クラス */
  className?: string;
}

// =====================================================
// ヘルパー関数
// =====================================================

function formatResetDate(dateString?: string): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch {
    return null;
  }
}

function getQuotaStatus(
  used: number,
  limit: number,
  unlimited: boolean,
  warningThreshold: number
): 'ok' | 'warning' | 'critical' | 'exceeded' {
  if (unlimited) return 'ok';
  if (limit <= 0) return 'exceeded'; // 機能無効
  if (used >= limit) return 'exceeded';
  const remaining = limit - used;
  const remainingPercent = (remaining / limit) * 100;
  if (remainingPercent <= warningThreshold / 2) return 'critical';
  if (remainingPercent <= warningThreshold) return 'warning';
  return 'ok';
}

// =====================================================
// Inline版 - 小さなインライン表示
// =====================================================

function QuotaWarningInline({
  featureName,
  used,
  limit,
  unlimited = false,
  upgradePlan,
  upgradeLimit,
  className,
  warningThreshold = 20,
}: QuotaWarningProps) {
  const status = getQuotaStatus(used, limit, unlimited, warningThreshold);

  // 正常時は表示しない
  if (status === 'ok') {
    return null;
  }

  const upgradePlanName = upgradePlan ? PLAN_NAMES[upgradePlan] : 'Pro';

  if (status === 'exceeded') {
    return (
      <div className={cn('flex items-center gap-2 text-[var(--aio-danger)]', className)}>
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {featureName}: 上限に達しました ({used}/{limit})
        </span>
        <Link
          href={ROUTES.dashboardSettingsPlan}
          className="text-sm text-[var(--aio-primary)] hover:underline ml-1"
        >
          アップグレード →
        </Link>
      </div>
    );
  }

  const remaining = limit - used;
  const statusColor = status === 'critical' ? 'text-[var(--aio-danger)]' : 'text-[var(--aio-pending)]';
  const Icon = status === 'critical' ? AlertTriangle : TrendingUp;

  return (
    <div className={cn('flex items-center gap-2', statusColor, className)}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">
        {featureName}: {used}/{limit} 使用中（残り{remaining}件）
      </span>
      {upgradePlan && (
        <Link
          href={ROUTES.dashboardSettingsPlan}
          className="text-sm text-[var(--aio-primary)] hover:underline ml-1"
        >
          {upgradePlanName}で{upgradeLimit === 'unlimited' ? '無制限' : `${upgradeLimit}件`}に拡張 →
        </Link>
      )}
    </div>
  );
}

// =====================================================
// Banner版 - 横長バナー
// =====================================================

function QuotaWarningBanner({
  featureName,
  used,
  limit,
  unlimited = false,
  upgradePlan,
  upgradeLimit,
  className,
  warningThreshold = 20,
}: QuotaWarningProps) {
  const status = getQuotaStatus(used, limit, unlimited, warningThreshold);

  // 正常時は表示しない
  if (status === 'ok') {
    return null;
  }

  const upgradePlanName = upgradePlan ? PLAN_NAMES[upgradePlan] : 'Pro';
  const isExceeded = status === 'exceeded';
  const isCritical = status === 'critical';

  const bgColor = isExceeded
    ? 'bg-[var(--aio-danger-muted)] border-[var(--aio-danger)]'
    : isCritical
    ? 'bg-[var(--aio-danger-muted)] border-[var(--aio-danger)]'
    : 'bg-[var(--aio-pending-muted)] border-[var(--aio-pending)]';

  const textColor = isExceeded || isCritical
    ? 'text-[var(--aio-danger)]'
    : 'text-[var(--aio-pending)]';

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        bgColor,
        className
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {isExceeded ? (
            <XCircle className={cn('w-5 h-5', textColor)} />
          ) : (
            <AlertTriangle className={cn('w-5 h-5', textColor)} />
          )}
          <div>
            <p className={cn('font-medium', textColor)}>
              {isExceeded
                ? `${featureName}の上限に達しました`
                : `${featureName}の残りが少なくなっています`}
            </p>
            <p className={cn('text-sm', textColor)}>
              {used}/{limit} 使用中
              {!isExceeded && ` • 残り${limit - used}件`}
            </p>
          </div>
        </div>
        {upgradePlan && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {upgradePlanName}なら{upgradeLimit === 'unlimited' ? '無制限' : `${upgradeLimit}件`}
            </span>
            <Link href={ROUTES.dashboardSettingsPlan}>
              <Button variant="primary" size="sm">
                <Zap className="w-3 h-3 mr-1" />
                アップグレード
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Alert版 - アラートスタイル
// =====================================================

function QuotaWarningAlert({
  featureName,
  used,
  limit,
  unlimited = false,
  currentPlan,
  upgradePlan,
  upgradeLimit,
  resetDate,
  className,
  warningThreshold = 20,
}: QuotaWarningProps) {
  const status = getQuotaStatus(used, limit, unlimited, warningThreshold);

  // 正常時は表示しない
  if (status === 'ok') {
    return null;
  }

  const upgradePlanName = upgradePlan ? PLAN_NAMES[upgradePlan] : 'Pro';
  const currentPlanName = currentPlan ? PLAN_NAMES[currentPlan] : '';
  const isExceeded = status === 'exceeded';
  const formattedReset = formatResetDate(resetDate);

  return (
    <div
      className={cn(
        'rounded-lg border p-5',
        isExceeded
          ? 'bg-[var(--aio-danger-muted)] border-[var(--aio-danger)]'
          : 'bg-[var(--aio-pending-muted)] border-[var(--aio-pending)]',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isExceeded ? (
          <XCircle className="w-6 h-6 text-[var(--aio-danger)] flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-[var(--aio-pending)] flex-shrink-0" />
        )}
        <div className="flex-1">
          <h4
            className={cn(
              'font-semibold',
              isExceeded ? 'text-[var(--aio-danger)]' : 'text-[var(--aio-pending)]'
            )}
          >
            {isExceeded
              ? `${featureName}の上限に到達しました`
              : `${featureName}の残りが少なくなっています`}
          </h4>
          <p
            className={cn(
              'text-sm mt-1',
              isExceeded ? 'text-[var(--aio-danger)]' : 'text-[var(--aio-pending)]'
            )}
          >
            現在の使用状況: {used}/{limit}件
            {formattedReset && ` • リセット日: ${formattedReset}`}
          </p>

          {upgradePlan && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--aio-primary)]">{upgradePlanName}</span> プランなら{' '}
                <span className="font-bold">
                  {upgradeLimit === 'unlimited' ? '無制限' : `${upgradeLimit}件`}
                </span>{' '}
                まで利用可能
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link href={ROUTES.dashboardSettingsPlan}>
              <Button variant="primary" size="sm">
                <Zap className="w-3 h-3 mr-1" />
                今すぐアップグレード
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// メインコンポーネント
// =====================================================

export function QuotaWarning({
  featureName,
  used,
  limit,
  unlimited = false,
  resetDate,
  currentPlan,
  upgradePlan,
  upgradeLimit,
  variant = 'inline',
  warningThreshold = 20,
  className,
}: QuotaWarningProps) {
  // 無制限の場合は表示しない
  if (unlimited) {
    return null;
  }

  const props: QuotaWarningProps = {
    featureName,
    used,
    limit,
    unlimited,
    resetDate,
    currentPlan,
    upgradePlan,
    upgradeLimit,
    warningThreshold,
    className,
  };

  switch (variant) {
    case 'banner':
      return <QuotaWarningBanner {...props} />;
    case 'alert':
      return <QuotaWarningAlert {...props} />;
    case 'inline':
    default:
      return <QuotaWarningInline {...props} />;
  }
}

export default QuotaWarning;
