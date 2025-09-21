'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import SubscriptionManager from '@/components/SubscriptionManager';

type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  url: string;
  telephone: string;
  email: string;
  email_public: boolean;
  address_region: string;
  address_locality: string;
  street_address?: string;
  postal_code?: string;
  logo_url?: string;
  founded?: string;
  legal_form?: string;
  representative_name?: string;
  capital?: number;
  employees?: number;
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string;
  status: string;
  stripe_subscription_id?: string;
};

type Props = {
  params: { id: string };
};

export default function OrganizationDetailPage({ params }: Props) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // ユーザーロール取得
        const { data: appUser, error: userError } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('User role fetch error:', userError);
          return;
        }

        setUserRole(appUser.role);

        // 組織情報を取得
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', params.id)
          .single();

        if (orgError) {
          console.error('Organization fetch error:', orgError);
          router.push('/dashboard');
          return;
        }

        setOrganization(org);

        // サブスクリプション情報を取得
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select('id, status, stripe_subscription_id')
          .eq('org_id', params.id)
          .in('status', ['active', 'pending', 'trialing'])
          .maybeSingle();

        if (!subError && sub) {
          setSubscription(sub);
        }

      } catch (error) {
        console.error('Error:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id, router]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { text: '下書き', color: 'bg-gray-100 text-gray-800' },
      waiting_approval: { text: '承認待ち', color: 'bg-yellow-100 text-yellow-800' },
      published: { text: '公開中', color: 'bg-green-100 text-green-800' },
      paused: { text: '一時停止', color: 'bg-red-100 text-red-800' },
      archived: { text: 'アーカイブ', color: 'bg-gray-100 text-gray-600' },
    };
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">組織が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {organization.name}
                  </h1>
                  {getStatusBadge(organization.status)}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  企業情報の管理とサブスクリプション
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {organization.status === 'published' && (
                  <a
                    href={`/o/${organization.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    公開ページを見る
                  </a>
                )}
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/preview`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  プレビュー
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/edit`)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  編集
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">企業名</dt>
                  <dd className="text-sm text-gray-900">{organization.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">スラグ</dt>
                  <dd className="text-sm text-gray-900">/{organization.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">公式サイト</dt>
                  <dd className="text-sm text-gray-900">
                    <a href={organization.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {organization.url}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="text-sm text-gray-900">{organization.telephone}</dd>
                </div>
                {organization.legal_form && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">法人格</dt>
                    <dd className="text-sm text-gray-900">{organization.legal_form}</dd>
                  </div>
                )}
                {organization.representative_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">代表者</dt>
                    <dd className="text-sm text-gray-900">{organization.representative_name}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 説明 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">企業説明</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{organization.description}</p>
            </div>

            {/* 住所 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">所在地</h2>
              <p className="text-sm text-gray-700">
                {organization.postal_code && `〒${organization.postal_code} `}
                {organization.address_region}{organization.address_locality}
                {organization.street_address}
              </p>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* サブスクリプション管理 */}
            <SubscriptionManager
              organizationId={organization.id}
              organizationName={organization.name}
              hasActiveSubscription={!!subscription}
              subscriptionStatus={subscription?.status}
            />

            {/* ステータス情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ステータス</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">公開状態</span>
                  {getStatusBadge(organization.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">作成日</span>
                  <span className="text-sm text-gray-900">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">更新日</span>
                  <span className="text-sm text-gray-900">
                    {new Date(organization.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/edit`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  基本情報を編集
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/services`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  サービス管理
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/case-studies`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  導入事例管理
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/faqs`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  FAQ管理
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/preview`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  プレビュー・検証
                </button>
                {organization.status === 'published' && (
                  <a
                    href={`/o/${organization.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    公開ページを見る
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}