'use client';

/**
 * Feature Matrix Row Component
 * 機能×プランマトリクスの1行を表示・編集
 */

import { useState } from 'react';
import { FeatureMatrixData, PlanType } from '@/types/feature-management';

const PLAN_COLUMNS: PlanType[] = ['starter', 'pro', 'business', 'enterprise'];

interface FeatureMatrixRowProps {
  feature: FeatureMatrixData;
  onValueUpdate: (featureKey: string, planType: PlanType, value: number | boolean) => void;
}

export function FeatureMatrixRow({ feature, onValueUpdate }: FeatureMatrixRowProps) {
  // 入力値の一時保持（バリデーション用）
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  // 数値入力ハンドラ
  function handleNumberChange(planType: PlanType, inputValue: string) {
    setTempValues(prev => ({ ...prev, [`${feature.feature_key}-${planType}`]: inputValue }));
    
    // 数値変換とバリデーション
    if (inputValue === '' || inputValue === '-1') {
      onValueUpdate(feature.feature_key, planType, inputValue === '-1' ? -1 : 0);
    } else {
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        onValueUpdate(feature.feature_key, planType, numValue);
      }
    }
  }

  // チェックボックス変更ハンドラ
  function handleCheckboxChange(planType: PlanType, checked: boolean) {
    onValueUpdate(feature.feature_key, planType, checked);
  }

  // 表示値の取得
  function getDisplayValue(planType: PlanType): string | boolean {
    const value = feature.plan_values[planType];
    
    if (feature.control_type === 'limit_number') {
      const tempKey = `${feature.feature_key}-${planType}`;
      if (tempKey in tempValues) {
        return tempValues[tempKey];
      }
      const limit = value?.limit ?? 0;
      return limit === -1 ? '∞' : String(limit);
    } else if (feature.control_type === 'on_off') {
      return value?.enabled ?? false;
    }
    
    return '';
  }

  // カテゴリカラー
  function getCategoryColor(category: string): string {
    switch (category) {
      case 'content': return 'text-blue-600';
      case 'business': return 'text-green-600';
      case 'analytics': return 'text-purple-600';
      default: return 'text-[var(--aio-text-muted)]';
    }
  }

  return (
    <tr className="hover:bg-[var(--aio-surface-secondary)] transition-colors">
      {/* 機能名 */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-[var(--aio-text)]">
            {feature.display_name}
          </div>
          <div className="text-xs text-[var(--aio-text-muted)]">
            <span className={getCategoryColor(feature.category)}>
              {feature.category}
            </span>
            <span className="mx-1">•</span>
            <span>{feature.feature_key}</span>
          </div>
        </div>
      </td>

      {/* プラン列 */}
      {PLAN_COLUMNS.map((planType) => (
        <td key={planType} className="px-6 py-4 whitespace-nowrap text-center">
          {feature.control_type === 'limit_number' ? (
            <div className="flex items-center justify-center">
              <input
                type="text"
                className="w-20 px-2 py-1 text-sm text-center border border-[var(--aio-border)] rounded-md 
                          bg-[var(--aio-surface)] text-[var(--aio-text)]
                          focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent
                          placeholder:text-[var(--aio-text-muted)]"
                value={getDisplayValue(planType) as string}
                onChange={(e) => handleNumberChange(planType, e.target.value)}
                placeholder="0"
              />
            </div>
          ) : feature.control_type === 'on_off' ? (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-[var(--aio-primary)] bg-[var(--aio-surface)] border-[var(--aio-border)] rounded
                          focus:ring-[var(--aio-primary)] focus:ring-2"
                checked={getDisplayValue(planType) as boolean}
                onChange={(e) => handleCheckboxChange(planType, e.target.checked)}
              />
            </div>
          ) : (
            <span className="text-xs text-[var(--aio-text-muted)]">
              未実装
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}