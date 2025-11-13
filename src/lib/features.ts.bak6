/**
 * プラン機能フィルタリング
 * planIdから表示可能な機能のみを返す
 */

import { FEATURES } from '@/config/features';
import { PLAN_FEATURE_MAP, type PlanType } from '@/config/plans';

/**
 * 指定されたプランで表示していい機能だけを返す
 * statusが'planned'または'deprecated'のものは除外
 */
export function getVisibleFeaturesForPlan(planId: PlanType) {
  const planFeatures = PLAN_FEATURE_MAP[planId] || [];
  
  return planFeatures.filter(feature => {
    // features.tsに存在しないIDはスキップ
    if (!feature || !feature.id) {
      return false;
    }
    
    // statusが'planned'または'deprecated'のものは返さない
    if (feature.status === 'planned' || feature.status === 'deprecated') {
      return false;
    }
    
    return true;
  });
}