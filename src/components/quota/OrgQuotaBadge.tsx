/**
 * 組織 Quota 表示バッジ（Phase 4-B）
 * 
 * NOTE: [DISPLAY_ONLY] 
 * - quota 情報の表示のみを行う
 * - fail-open: quota が null の場合は何も表示しない
 * - 制限ロジックには一切関与しない
 */

export interface SimpleQuotaProps {
  limit: number | null;          // -1 を含む
  unlimited: boolean;
  usedInWindow: number;
  remaining: number | null;
  windowType: string;            // "calendar_month"
}

interface OrgQuotaBadgeProps {
  label: string;
  quota: SimpleQuotaProps | null; // null の場合は何も表示しない
  className?: string;
}

export function OrgQuotaBadge({ label, quota, className = '' }: OrgQuotaBadgeProps) {
  // fail-open: quota が取得できない場合は何も表示しない
  if (!quota) return null;

  const { unlimited, limit, usedInWindow, remaining, windowType } = quota;

  // 基本スタイル
  const baseClasses = `
    inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
    border bg-gray-50 text-gray-700 border-gray-200
  `;

  // unlimited の場合
  if (unlimited) {
    return (
      <span className={`${baseClasses} bg-green-50 text-green-700 border-green-200 ${className}`}>
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        {label}: 無制限
      </span>
    );
  }

  // limit = 0 の場合（機能無効）
  if (limit === 0) {
    return (
      <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200 ${className}`}>
        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
        {label}: 利用不可
      </span>
    );
  }

  // 通常の制限表示
  const usage = Math.max(0, usedInWindow); // 負の数を防ぐ
  const effectiveLimit = limit || 0;
  const isNearLimit = effectiveLimit > 0 && usage / effectiveLimit >= 0.8; // 80%以上で警告色
  const isAtLimit = effectiveLimit > 0 && usage >= effectiveLimit;

  // 使用状況に応じたスタイル
  let statusClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  let dotClasses = 'bg-blue-400';

  if (isAtLimit) {
    statusClasses = 'bg-red-50 text-red-700 border-red-200';
    dotClasses = 'bg-red-400';
  } else if (isNearLimit) {
    statusClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    dotClasses = 'bg-yellow-400';
  }

  return (
    <span className={`${baseClasses} ${statusClasses} ${className}`}>
      <span className={`w-2 h-2 ${dotClasses} rounded-full`}></span>
      {label}: {usage} / {effectiveLimit}
      {typeof remaining === 'number' && (
        <span className="text-xs opacity-75">（残り {remaining}）</span>
      )}
    </span>
  );
}