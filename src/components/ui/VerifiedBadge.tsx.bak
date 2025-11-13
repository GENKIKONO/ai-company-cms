import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { type PlanType } from '@/config/plans';

interface VerifiedBadgeProps {
  verified?: boolean;
  plan?: PlanType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({ 
  verified = false, 
  plan = 'starter',
  className = '',
  size = 'md',
  showLabel = false
}: VerifiedBadgeProps) {
  // Business プラン以上でかつ承認済みの場合のみ表示
  const isEligibleForVerification = plan === 'business' || plan === 'pro' || plan === 'enterprise';
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
  plan?: PlanType;
  organizationName: string;
  className?: string;
}

export function VerifiedStatus({ 
  verified = false, 
  plan = 'starter',
  organizationName,
  className = ''
}: VerifiedStatusProps) {
  const isEligibleForVerification = plan === 'business' || plan === 'pro' || plan === 'enterprise';
  const shouldShowBadge = verified && isEligibleForVerification;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">
        {organizationName}
      </h1>
      {shouldShowBadge && (
        <VerifiedBadge 
          verified={verified}
          plan={plan}
          size="md"
          showLabel={false}
        />
      )}
    </div>
  );
}

export default VerifiedBadge;