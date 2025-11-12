'use client';

/**
 * Plan Feature Matrix Component
 * プラン×機能マトリクス表示・編集
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FeatureMatrixData, FeatureManagementGetResponse, FeatureManagementUpdateRequest, PlanType } from '@/types/feature-management';
import { FeatureMatrixRow } from './FeatureMatrixRow';
import { FeatureMatrixActions } from './FeatureMatrixActions';
import { HIGButton } from '@/components/ui/HIGButton';

import { logger } from '@/lib/log';
const PLAN_COLUMNS: { key: PlanType; label: string }[] = [
  { key: 'starter', label: 'Starter' },
  { key: 'pro', label: 'Pro' },
  { key: 'business', label: 'Business' },
  { key: 'enterprise', label: 'Enterprise' },
];

export function PlanFeatureMatrix() {
  const [matrixData, setMatrixData] = useState<FeatureMatrixData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FeatureMatrixData[]>([]);

  // データ取得
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/feature-management');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data: FeatureManagementGetResponse = await response.json();
        const formattedData = formatMatrixData(data);
        
        setMatrixData(formattedData);
        setOriginalData(JSON.parse(JSON.stringify(formattedData))); // deep copy
      } catch (error) {
        logger.error('Error fetching feature data:', error);
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // APIレスポンスをマトリクス形式に変換
  function formatMatrixData(data: FeatureManagementGetResponse): FeatureMatrixData[] {
    return data.features.map(feature => {
      const planValues = {} as FeatureMatrixData['plan_values'];
      
      PLAN_COLUMNS.forEach(({ key: planType }) => {
        const planFeature = data.planFeatures.find(
          pf => pf.feature_key === feature.feature_key && pf.plan_type === planType
        );
        planValues[planType] = planFeature?.config_value || {};
      });

      return {
        feature_key: feature.feature_key,
        display_name: feature.display_name,
        control_type: feature.control_type,
        category: feature.category,
        plan_values: planValues,
      };
    });
  }

  // 値更新ハンドラ
  function handleValueUpdate(
    featureKey: string, 
    planType: PlanType, 
    value: number | boolean
  ) {
    setMatrixData(prev => 
      prev.map(item => {
        if (item.feature_key !== featureKey) return item;
        
        const updatedItem = { ...item };
        if (item.control_type === 'limit_number') {
          updatedItem.plan_values[planType] = { limit: value as number };
        } else if (item.control_type === 'on_off') {
          updatedItem.plan_values[planType] = { enabled: value as boolean };
        }
        
        return updatedItem;
      })
    );
    
    setHasChanges(true);
  }

  // 保存処理
  async function handleSave() {
    setIsSaving(true);
    
    try {
      // 変更内容を抽出
      const updates: FeatureManagementUpdateRequest['updates'] = [];
      
      matrixData.forEach(item => {
        PLAN_COLUMNS.forEach(({ key: planType }) => {
          const currentValue = item.plan_values[planType];
          const originalItem = originalData.find(orig => orig.feature_key === item.feature_key);
          const originalValue = originalItem?.plan_values[planType];
          
          if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
            updates.push({
              plan_type: planType,
              feature_key: item.feature_key,
              config_value: currentValue,
            });
          }
        });
      });

      if (updates.length === 0) {
        toast.info('変更はありません');
        return;
      }

      const response = await fetch('/api/admin/feature-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      const result = await response.json();
      
      toast.success(`${result.updated_count}件の設定を保存しました`);
      setHasChanges(false);
      setOriginalData(JSON.parse(JSON.stringify(matrixData))); // deep copy
      
    } catch (error) {
      logger.error('Error saving data:', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }

  // リセット処理
  function handleReset() {
    setMatrixData(JSON.parse(JSON.stringify(originalData))); // deep copy
    setHasChanges(false);
    toast.info('変更をリセットしました');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)] mx-auto"></div>
          <p className="mt-2 text-sm text-[var(--aio-text-muted)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--aio-text)]">
            プラン機能マトリクス
          </h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            各プランで利用可能な機能・制限値を設定できます
          </p>
        </div>
        
        {hasChanges && (
          <div className="text-sm text-[var(--aio-warning)]">
            未保存の変更があります
          </div>
        )}
      </div>

      {/* マトリクステーブル */}
      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--aio-border)]">
            <thead className="bg-[var(--aio-surface-secondary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase tracking-wider">
                  機能名
                </th>
                {PLAN_COLUMNS.map(({ key, label }) => (
                  <th key={key} className="px-6 py-3 text-center text-xs font-medium text-[var(--aio-text-muted)] uppercase tracking-wider">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--aio-surface)] divide-y divide-[var(--aio-border)]">
              {matrixData.map((feature) => (
                <FeatureMatrixRow
                  key={feature.feature_key}
                  feature={feature}
                  onValueUpdate={handleValueUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* アクション */}
      <FeatureMatrixActions
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  );
}