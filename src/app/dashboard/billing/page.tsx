'use client';

/**
 * Billing Page - 新アーキテクチャ版
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLAN_LIMITS } from '@/config/plans';
import type { Organization } from '@/types/legacy/database';
import { logger } from '@/lib/utils/logger';
import { getCurrentUserClient } from '@/lib/core/auth-state.client';
import {
  fetchActiveCheckoutForOrg,
  calculateDiscountedPrice,
  getCampaignDescription,
} from '@/lib/utils/checkout-helpers';
import {
  DashboardPageShell,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
  DashboardLoadingCard,
  DashboardBadge,
} from '@/components/dashboard/ui';

// =====================================================
// TYPES
// =====================================================

interface BillingData {
  organization: Organization;
  currentCounts: {
    services: number;
    posts: number;
    case_studies: number;
    faqs: number;
  };
  checkoutInfo?: {
    stripe_price_id: string;
    stripe_checkout_url: string | null;
    discount_rate: number;
    campaign_type: string;
    is_fallback?: boolean;
  } | null;
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function BillingPage() {
  return (
    <DashboardPageShell
      title="サブスクリプション管理"
      requiredRole="viewer"
      loadingSkeleton={<BillingLoadingSkeleton />}
    >
      <BillingContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function BillingContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const user = await getCurrentUserClient();
      if (!user) {
        // NOTE: Don't redirect - middleware handles auth
        setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
        return;
      }

      // 組織取得: organization_members を正規ソースとして使用
      // /organizations/new へのリダイレクトは禁止（誤判定の温床）
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        logger.error('[billing] organization_members query failed', {
          error: { code: membershipError.code, message: membershipError.message }
        });
        setError('組織情報の取得に失敗しました。ページを再読み込みしてください。');
        return;
      }

      if (!membershipData) {
        logger.warn('[billing] No organization membership found', { userId: user.id });
        setError('所属する組織が見つかりません。管理者にお問い合わせください。');
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, status, is_published, logo_url, description, legal_form, representative_name, created_by, created_at, plan, subscription_status, current_period_end, stripe_customer_id')
        .eq('id', membershipData.organization_id)
        .maybeSingle();

      if (orgError || !orgData) {
        logger.error('[billing] organizations query failed', {
          orgId: membershipData.organization_id,
          error: orgError ? { code: orgError.code, message: orgError.message } : 'no data'
        });
        setError('組織情報の取得に失敗しました。ページを再読み込みしてください。');
        return;
      }

      const org = orgData;

      // ReadContract準拠: secure view経由でcount取得（head:trueでpayload最小化）
      const [servicesRes, postsRes, caseStudiesRes, faqsRes] = await Promise.all([
        supabase.from('v_dashboard_services_secure').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('v_dashboard_posts_secure').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('v_dashboard_case_studies_secure').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('v_dashboard_faqs_secure').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
      ]);

      const checkoutInfo = await fetchActiveCheckoutForOrg('starter', org);

      setData({
        organization: org,
        currentCounts: {
          services: servicesRes.count || 0,
          posts: postsRes.count || 0,
          case_studies: caseStudiesRes.count || 0,
          faqs: faqsRes.count || 0,
        },
        checkoutInfo,
      });
    } catch (error) {
      logger.error('Failed to fetch billing data', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('請求情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  async function handleSubscribe() {
    try {
      setActionLoading(true);

      if (data?.checkoutInfo?.stripe_checkout_url) {
        window.location.href = data.checkoutInfo.stripe_checkout_url;
        return;
      }

      const response = await fetch('/api/billing/checkout', { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'チェックアウトの作成に失敗しました');
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch {
      setError('チェックアウトの開始に失敗しました');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      setActionLoading(true);
      const response = await fetch('/api/billing/portal', { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'ポータルの作成に失敗しました');
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch {
      setError('請求ポータルの開始に失敗しました');
    } finally {
      setActionLoading(false);
    }
  }

  function getPlanLimits(plan: string) {
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  }

  function getStatusBadge(status?: string) {
    switch (status) {
      case 'active':
        return <DashboardBadge variant="success">有効</DashboardBadge>;
      case 'past_due':
        return <DashboardBadge variant="warning">支払い遅延</DashboardBadge>;
      case 'canceled':
        return <DashboardBadge variant="error">キャンセル済み</DashboardBadge>;
      case 'trialing':
        return <DashboardBadge variant="info">トライアル中</DashboardBadge>;
      default:
        return <DashboardBadge variant="default">未契約</DashboardBadge>;
    }
  }

  if (loading) {
    return <BillingLoadingSkeleton />;
  }

  if (!data) {
    return (
      <DashboardAlert variant="error" title="データが見つかりません">
        請求情報を取得できませんでした。
      </DashboardAlert>
    );
  }

  const { organization, currentCounts, checkoutInfo } = data;
  const currentPlan = organization.plan || 'trial';
  const limits = getPlanLimits(currentPlan);
  const isActive = organization.subscription_status === 'active' || organization.subscription_status === 'trialing';
  const canUpgrade = !isActive || currentPlan === 'trial';

  const originalPrice = 2980;
  const discountedPrice = checkoutInfo ? calculateDiscountedPrice(originalPrice, checkoutInfo.discount_rate) : originalPrice;
  const campaignDescription = checkoutInfo ? getCampaignDescription(checkoutInfo.campaign_type) : '';
  const hasDiscount = checkoutInfo && checkoutInfo.discount_rate > 0;

  return (
    <>
      <DashboardPageHeader
        title="サブスクリプション管理"
        description="プランの管理と請求情報を確認できます"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      {/* Status Messages */}
      {success && (
        <DashboardAlert variant="success" className="mb-6">
          サブスクリプションの設定が完了しました！
        </DashboardAlert>
      )}
      {canceled && (
        <DashboardAlert variant="warning" className="mb-6">
          サブスクリプションの設定がキャンセルされました。
        </DashboardAlert>
      )}
      {error && (
        <DashboardAlert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </DashboardAlert>
      )}

      {/* Current Plan */}
      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">現在のプラン</h2>
            {getStatusBadge(organization.subscription_status)}
          </div>
        </DashboardCardHeader>
        <DashboardCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-1">プラン</div>
              <div className="text-lg font-medium text-[var(--color-text-primary)] capitalize">
                {currentPlan === 'trial' ? 'Trial (14日間無料)' :
                  currentPlan === 'starter' ? 'Starter (¥2,980/月)' :
                  currentPlan === 'pro' ? 'Pro (¥8,000/月)' :
                  currentPlan === 'business' ? 'Business (¥15,000/月)' :
                  currentPlan === 'enterprise' ? 'Enterprise (¥30,000〜/月)' : currentPlan}
              </div>
            </div>

            {organization.current_period_end && (
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">次回請求日</div>
                <div className="text-lg font-medium text-[var(--color-text-primary)]">
                  {formatDate(organization.current_period_end)}
                </div>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          <div className="pt-6 border-t border-[var(--dashboard-card-border)]">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">利用状況</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentCounts).map(([key, count]) => {
                const limit = limits[key as keyof typeof limits];
                const numericLimit = typeof limit === 'number' ? limit : 0;
                const isNearLimit = numericLimit > 0 && count >= numericLimit * 0.8;
                const isOverLimit = numericLimit > 0 && count >= numericLimit;

                return (
                  <div key={key} className="text-center">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1 capitalize">
                      {key === 'case_studies' ? '導入事例' :
                        key === 'services' ? 'サービス' :
                        key === 'posts' ? '記事' :
                        key === 'faqs' ? 'FAQ' : key}
                    </div>
                    <div className={`text-lg font-medium ${isOverLimit ? 'text-[var(--status-error)]' : isNearLimit ? 'text-[var(--status-warning)]' : 'text-[var(--color-text-primary)]'}`}>
                      {count} / {numericLimit > 0 ? numericLimit : '無制限'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-[var(--dashboard-card-border)] flex flex-wrap gap-4">
            {canUpgrade ? (
              <div className="flex flex-col gap-3">
                {hasDiscount && (
                  <DashboardAlert variant="info" className="mb-2">
                    <div className="text-sm font-medium">特別キャンペーン適用</div>
                    <div className="text-sm">{campaignDescription}</div>
                  </DashboardAlert>
                )}
                <DashboardButton
                  onClick={handleSubscribe}
                  loading={actionLoading}
                  variant="primary"
                  size="lg"
                >
                  {hasDiscount
                    ? `Starterプランで購読 (¥${discountedPrice.toLocaleString()}/月)`
                    : 'Starterプランで購読 (¥2,980/月)'}
                </DashboardButton>
                {hasDiscount && !checkoutInfo?.is_fallback && (
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    <span className="line-through">¥{originalPrice.toLocaleString()}/月</span>
                    <span className="ml-2 text-[var(--status-success)] font-medium">¥{discountedPrice.toLocaleString()}/月</span>
                    <DashboardBadge variant="error" size="sm" className="ml-2">
                      {checkoutInfo?.discount_rate}%OFF
                    </DashboardBadge>
                  </div>
                )}
              </div>
            ) : (
              <DashboardButton
                onClick={handleManageBilling}
                loading={actionLoading}
                disabled={!organization.stripe_customer_id}
                variant="primary"
                size="lg"
              >
                請求の管理
              </DashboardButton>
            )}
          </div>
        </DashboardCardContent>
      </DashboardCard>

      {/* Plan Comparison */}
      <DashboardCard>
        <DashboardCardHeader>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">プラン比較</h3>
        </DashboardCardHeader>
        <DashboardCardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
              <thead className="bg-[var(--aio-muted)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">機能</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Trial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Starter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Pro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Enterprise</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--dashboard-card-bg)] divide-y divide-[var(--dashboard-card-border)]">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">サービス</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.trial.services}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.services}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.services}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">Q&A項目</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.trial.qa_items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.qa_items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.qa_items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">営業資料</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.trial.materials}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.materials}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.materials}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">料金</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥0 (14日間)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥2,980/月</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥8,000/月</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥15,000/月</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥30,000〜/月</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function BillingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardLoadingCard lines={4} showHeader />
      <DashboardLoadingCard lines={6} showHeader />
    </div>
  );
}
