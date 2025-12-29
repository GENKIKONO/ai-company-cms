'use client';

/**
 * Billing Admin Tabs Component
 * 課金管理タブコンポーネント
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlansPanel } from './PlansPanel';
import { FeaturesPanel } from './FeaturesPanel';
import { PlanFeaturesPanel } from './PlanFeaturesPanel';
import { FeatureLimitsPanel } from './FeatureLimitsPanel';
import { SubscriptionsPanel } from './SubscriptionsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';

export function BillingAdminTabs() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
        <TabsTrigger value="plans" className="text-xs sm:text-sm">
          Plans
        </TabsTrigger>
        <TabsTrigger value="features" className="text-xs sm:text-sm">
          Features
        </TabsTrigger>
        <TabsTrigger value="plan-features" className="text-xs sm:text-sm">
          割当
        </TabsTrigger>
        <TabsTrigger value="limits" className="text-xs sm:text-sm">
          Limits
        </TabsTrigger>
        <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
          Subs
        </TabsTrigger>
        <TabsTrigger value="analytics" className="text-xs sm:text-sm">
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plans" className="mt-6">
        <PlansPanel />
      </TabsContent>

      <TabsContent value="features" className="mt-6">
        <FeaturesPanel />
      </TabsContent>

      <TabsContent value="plan-features" className="mt-6">
        <PlanFeaturesPanel />
      </TabsContent>

      <TabsContent value="limits" className="mt-6">
        <FeatureLimitsPanel />
      </TabsContent>

      <TabsContent value="subscriptions" className="mt-6">
        <SubscriptionsPanel />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <AnalyticsPanel />
      </TabsContent>
    </Tabs>
  );
}
