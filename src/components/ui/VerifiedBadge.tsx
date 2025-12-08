import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { type PlanType } from '@/config/plans';
import { canUseFeatureFromOrg } from '@/lib/org-features/features';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

type OrganizationRow = any;

interface VerifiedBadgeProps {
  verified?: boolean;
  // 新しい正規ルート用
  organization?: OrganizationRow;
  // 既存の後方互換性用（deprecated）
  plan?: PlanType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({ 
  verified = false, 
  organization,
  plan = 'starter',
  className = '',
  size = 'md',
  showLabel = false
}: VerifiedBadgeProps) {
  // NOTE: [FEATURE_MIGRATION] 新しい正規ルートに移行、既存ロジック保持
  const isEligibleForVerification = organization
    ? canUseFeatureFromOrg(organization, 'verified_badge')
    : plan === 'business' || plan === 'pro' || plan === 'enterprise'; // 既存の後方互換性
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
  // 新しい正規ルート用
  organization?: OrganizationRow;
  // 既存の後方互換性用（deprecated）
  plan?: PlanType;
  organizationName: string;
  className?: string;
}

export function VerifiedStatus({ 
  verified = false, 
  organization,
  plan = 'starter',
  organizationName,
  className = ''
}: VerifiedStatusProps) {
  // NOTE: [FEATURE_MIGRATION] 新しい正規ルートに移行、既存ロジック保持
  const isEligibleForVerification = organization
    ? canUseFeatureFromOrg(organization, 'verified_badge')
    : plan === 'business' || plan === 'pro' || plan === 'enterprise'; // 既存の後方互換性
  const shouldShowBadge = verified && isEligibleForVerification;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">
        {organizationName}
      </h1>
      {shouldShowBadge && (
        <VerifiedBadge 
          verified={verified}
          organization={organization}
          plan={plan}
          size="md"
          showLabel={false}
        />
      )}
    </div>
  );
}

export default VerifiedBadge;