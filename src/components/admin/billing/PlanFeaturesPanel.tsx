'use client';

/**
 * Plan Features Panel Component
 * プラン×機能割当管理パネル
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';

interface Plan {
  id: string;
  name: string;
  slug: string;
}

interface Feature {
  id: string;
  key: string;
  name: string;
  category: string | null;
}

interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  is_required: boolean;
  display_order: number;
  default_config: Record<string, unknown>;
  plan?: Plan;
  feature?: Feature;
}

export function PlanFeaturesPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [plansRes, featuresRes] = await Promise.all([
          fetch('/api/admin/billing/plans'),
          fetch('/api/admin/billing/features'),
        ]);

        if (!plansRes.ok || !featuresRes.ok) throw new Error('Failed to fetch data');

        const plansData = await plansRes.json();
        const featuresData = await featuresRes.json();

        setPlans(plansData.data || []);
        setFeatures(featuresData.data || []);

        if (plansData.data?.length > 0) {
          setSelectedPlan(plansData.data[0].id);
        }
      } catch (err) {
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;

    async function fetchPlanFeatures() {
      try {
        const res = await fetch(`/api/admin/billing/plan-features?plan_id=${selectedPlan}`);
        if (!res.ok) throw new Error('Failed to fetch plan features');
        const { data } = await res.json();
        setPlanFeatures(data || []);
      } catch (err) {
        toast.error('割当情報の取得に失敗しました');
      }
    }

    fetchPlanFeatures();
  }, [selectedPlan]);

  const getFeatureAssignment = (featureId: string): PlanFeature | undefined => {
    return planFeatures.find((pf) => pf.feature_id === featureId);
  };

  const handleToggle = async (featureId: string, isEnabled: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/billing/plan-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          feature_id: featureId,
          is_enabled: isEnabled,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const { data } = await res.json();
      setPlanFeatures((prev) => {
        const existing = prev.findIndex((pf) => pf.feature_id === featureId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });

      toast.success('更新しました');
    } catch (err) {
      toast.error('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
      </div>
    );
  }

  // カテゴリでグループ化
  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || '未分類';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Plan ↔ Feature 割当</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            各プランで利用可能な機能を設定します
          </p>
        </div>
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="px-4 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <div key={category} className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--aio-surface-secondary)] border-b border-[var(--aio-border)]">
            <h3 className="text-sm font-medium text-[var(--aio-text)]">{category}</h3>
          </div>
          <div className="divide-y divide-[var(--aio-border)]">
            {categoryFeatures.map((feature) => {
              const assignment = getFeatureAssignment(feature.id);
              const isEnabled = assignment?.is_enabled ?? false;

              return (
                <div key={feature.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--aio-text)]">{feature.name}</div>
                    <div className="text-xs text-[var(--aio-text-muted)] font-mono">{feature.key}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggle(feature.id, e.target.checked)}
                        disabled={isSaving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--aio-primary)]"></div>
                    </label>
                    <span className={`text-xs ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {isEnabled ? '有効' : '無効'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
