'use client';

/**
 * Feature Management Tabs Component
 * プラン機能管理・組織別設定タブ
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanFeatureMatrix } from './PlanFeatureMatrix';

export function FeatureManagementTabs() {
  const [activeTab, setActiveTab] = useState('plan-features');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="plan-features">
          プラン機能設定
        </TabsTrigger>
        <TabsTrigger value="organization-overrides" disabled>
          組織別設定（準備中）
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="plan-features" className="mt-6">
        <PlanFeatureMatrix />
      </TabsContent>
      
      <TabsContent value="organization-overrides" className="mt-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 text-[var(--aio-text-muted)]">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--aio-text)]">組織別設定</h3>
            <p className="mt-2 text-sm text-[var(--aio-text-muted)]">
              この機能は次フェーズで有効化します
            </p>
            <p className="mt-1 text-xs text-[var(--aio-text-muted)]">
              個別組織への制限値上書き・期限付き設定が可能になります
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}