import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { type PlanType } from '@/config/plans';

/**
 * VerifiedBadge - 認証済みバッジ表示コンポーネント
 *
 * 責務: 純粋なUI表示のみ。feature_flags等の判定ロジックは持たない。
 *
 * 使用方法:
 * 1. 推奨: isEligible propで事前計算済みの判定結果を渡す
 * 2. 後方互換: plan propでプランベースの判定（business/pro/enterprise）
 *
 * @note [2024-12] feature_flags直読みを廃止。Check11準拠。
 */

interface VerifiedBadgeProps {
  /** 企業が認証済みかどうか（DBのverifiedフラグ） */
  verified?: boolean;
  /** 事前計算済みの表示可否（推奨：呼び出し側でfeatureGate等で判定） */
  isEligible?: boolean;
  /** プラン（後方互換：isEligibleが未指定時のフォールバック） */
  plan?: PlanType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({
  verified = false,
  isEligible,
  plan = 'starter',
  className = '',
  size = 'md',
  showLabel = false
}: VerifiedBadgeProps) {
  // 表示可否の判定
  // 優先順位: 1. isEligible prop（推奨） 2. plan-based判定（後方互換）
  const isEligibleForVerification = isEligible !== undefined
    ? isEligible
    : plan === 'business' || plan === 'pro' || plan === 'enterprise';

  const shouldShowBadge = verified && isEligibleForVerification;

  if (!shouldShowBadge) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <CheckBadgeIcon
        className={`${sizeClasses[size]} text-blue-600 flex-shrink-0`}
        title="認証済み企業"
      />
      {showLabel && (
        <span className={`${textSizeClasses[size]} font-medium text-blue-600`}>
          認証済み
        </span>
      )}
    </div>
  );
}

interface VerifiedStatusProps {
  verified?: boolean;
  isEligible?: boolean;
  plan?: PlanType;
  organizationName: string;
  className?: string;
}

export function VerifiedStatus({
  verified = false,
  isEligible,
  plan = 'starter',
  organizationName,
  className = ''
}: VerifiedStatusProps) {
  // 表示可否の判定
  const isEligibleForVerification = isEligible !== undefined
    ? isEligible
    : plan === 'business' || plan === 'pro' || plan === 'enterprise';

  const shouldShowBadge = verified && isEligibleForVerification;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">
        {organizationName}
      </h1>
      {shouldShowBadge && (
        <VerifiedBadge
          verified={verified}
          isEligible={isEligible}
          plan={plan}
          size="md"
          showLabel={false}
        />
      )}
    </div>
  );
}

export default VerifiedBadge;
