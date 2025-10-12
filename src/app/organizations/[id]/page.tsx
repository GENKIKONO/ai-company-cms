'use client';

// 強制動的レンダリング（古いSSRキャッシュで上書きされないように）
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization, updateOrganization, updateOrganizationStatus, getIndustries } from '@/lib/organizations';
import { type AppUser, type Organization, type OrganizationFormData } from '@/types/database';
import { geocodeJP, isValidJapaneseCoordinates } from '@/lib/geocode';
import { type Coordinates } from '@/types/geo';
import ServicesTab from '@/components/ServicesTab';
import CaseStudiesTab from '@/components/CaseStudiesTab';
import FAQsTab from '@/components/FAQsTab';
import PostsTab from '@/components/PostsTab';
import OrgLogoUploader from '@/components/OrgLogoUploader';
import AddressDisplay from '@/components/address/AddressDisplay';
import QAManager from '@/components/qa/QAManager';

// プラン別タグ数制限
const TAG_LIMIT: Record<string, number | 'unlimited'> = {
  free: 1,
  starter: 3,
  business: 5,
  enterprise: 'unlimited'
};

// 共通マッパー関数: organization → formData
function fromOrg(org?: Organization | null): OrganizationFormData {
  return {
    name: org?.name ?? '',
    slug: org?.slug ?? '',
    description: org?.description ?? '',
    legal_form: org?.legal_form ?? '',
    representative_name: org?.representative_name ?? '',
    capital: org?.capital,
    employees: org?.employees,
    address_country: org?.address_country ?? 'JP',
    address_region: org?.address_region ?? '',
    address_locality: org?.address_locality ?? '',
    address_postal_code: org?.address_postal_code ?? '',
    address_street: org?.address_street ?? '',
    lat: org?.lat,
    lng: org?.lng,
    telephone: org?.telephone ?? '',
    email: org?.email ?? '',
    email_public: org?.email_public ?? false,
    url: org?.url ?? '',
    logo_url: org?.logo_url ?? '',
    same_as: org?.same_as ?? [],
    industries: org?.industries ?? [],
    plan: org?.plan ?? 'free'
  };
}

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // [VERIFY][DELETE_GUARD] Delete confirmation state removed for safety
  const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'casestudies' | 'faqs' | 'posts' | 'qa'>('basic');
  
  // 座標管理
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [publishCoordinates, setPublishCoordinates] = useState(false);

  // 初期化は空の状態から開始
  const [formData, setFormData] = useState<OrganizationFormData>(() => fromOrg(null));

  // 認証確認とデータ取得
  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        // 'new'または'create'の場合は早期return（新規作成ページ）
        if (organizationId === 'new' || organizationId === 'create') {
          router.push('/organizations/new');
          return;
        }
        
        // UUIDでない値をチェック
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(organizationId)) {
          router.push('/404');
          return;
        }
        
        // 企業データと業界一覧を取得
        console.log('[VERIFY] Fetching fresh organization data for edit page:', organizationId);
        
        const [orgResult, industriesResult] = await Promise.all([
          getOrganization(organizationId),
          getIndustries()
        ]);

        if (orgResult.data) {
          const org = orgResult.data;
          console.log('[VERIFY] Fresh organization loaded for edit:', { 
            id: org.id, 
            slug: org.slug, 
            name: org.name,
            updated_at: org.updated_at 
          });
          setOrganization(org);
          // フォームデータはuseEffectで自動同期される
        } else {
          console.warn('[VERIFY] No organization data found, redirecting to dashboard');
          router.push('/dashboard');
        }
        
        if (industriesResult.data) {
          setIndustries(industriesResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, router]);

  // organization更新時のフォーム自動同期
  useEffect(() => {
    console.log('[VERIFY] Syncing form data from organization', {
      orgId: organization?.id,
      slug: organization?.slug,
      updated_at: organization?.updated_at
    });
    
    // 🔥 FORCED SYNC: Always overwrite form with latest organization data
    if (organization) {
      const syncedFormData = fromOrg(organization);
      console.log('[SYNC_EFFECT] Forcing form sync with organization data:', syncedFormData);
      setFormData(syncedFormData);
      
      // 🔥 Initialize coordinates from database if available
      if (organization.lat && organization.lng) {
        console.log('[SYNC_EFFECT] Initializing coordinates from database:', {
          lat: organization.lat,
          lng: organization.lng
        });
        setCoordinates({
          lat: organization.lat,
          lng: organization.lng
        });
      }
    }
  }, [organization?.id, organization?.updated_at, organization?.slug, organization?.status, organization?.name, organization?.description, organization?.lat, organization?.lng]);

  const handleInputChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleArrayChange = (field: 'same_as' | 'industries', value: string[]) => {
    // プラン制限チェック（industriesフィールドのみ）
    if (field === 'industries') {
      const currentPlan = organization?.plan || 'free';
      const limit = TAG_LIMIT[currentPlan];
      
      if (limit !== 'unlimited' && value.length > limit) {
        // 制限を超える場合はトースト表示（ここでは単純にalertで代替）
        alert(`${currentPlan}プランでは業界タグは${limit}個まで選択できます。`);
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '企業名は必須です';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'スラッグは必須です';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'スラッグは小文字、数字、ハイフンのみ使用できます';
    }

    if (!formData.description.trim()) {
      newErrors.description = '企業説明は必須です';
    }

    // 安全な文字列処理でundefined.match()エラーを回避
    const urlValue = typeof formData.url === 'string' ? formData.url : '';
    if (urlValue && !/^https?:\/\/.+/.test(urlValue)) {
      newErrors.url = '正しいURL形式で入力してください';
    }

    const emailValue = typeof formData.email === 'string' ? formData.email : '';
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = '正しいメールアドレス形式で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateOrganization(organizationId, formData);
      console.log('[VERIFY] Organization save result', result);
      
      if (result.data) {
        console.log('[VERIFY] edit/save synced', { 
          id: result.data.id, 
          slug: result.data.slug, 
          status: result.data.status,
          is_published: result.data.is_published,
          updated_at: result.data.updated_at 
        });
        
        // 🔥 FORCED SYNCHRONIZATION: Overwrite with API response to prevent form reversion
        const freshFormData = fromOrg(result.data);
        console.log('[FORCED_SYNC] Overwriting form data with API response:', freshFormData);
        
        // Set organization state first
        setOrganization(result.data);
        
        // Force immediate form synchronization with setTimeout to ensure state updates
        setFormData(freshFormData);
        setTimeout(() => {
          setFormData(fromOrg(result.data));
          console.log('[FORCED_SYNC] Double-sync completed');
        }, 0);
        
        setErrors({ success: '企業情報を更新しました' });
        
        // ✅ slug変更時のURL同期
        if (result.data.slug && result.data.slug !== organizationId) {
          console.log('[VERIFY] Slug changed, updating URL:', result.data.slug);
          router.replace(`/organizations/${organizationId}`);
        }
      } else {
        console.error('[VERIFY] org save failed: no data returned');
        setErrors({ submit: '企業情報の更新に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
      setErrors({ submit: '企業情報の更新に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const result = await updateOrganizationStatus(organizationId, newStatus);
      if (result.data) {
        setOrganization(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // [VERIFY][DELETE_GUARD] Organization delete function removed for safety

  // 住所から座標を取得
  const handleDetectLocation = async () => {
    const fullAddress = `${formData.address_region}${formData.address_locality}${formData.address_street}`;
    
    if (!fullAddress.trim()) {
      setErrors({ address: '住所を入力してください' });
      return;
    }
    
    setGeocoding(true);
    setErrors({ ...errors, address: '' });
    
    try {
      const result = await geocodeJP(fullAddress);
      setCoordinates({ lat: result.lat, lng: result.lng });
      // 🔥 Update formData to include coordinates for saving
      setFormData(prev => ({ ...prev, lat: result.lat, lng: result.lng }));
      
      // 成功メッセージを表示
      const successElement = document.getElementById('geocode-success');
      if (successElement) {
        successElement.style.display = 'block';
        setTimeout(() => {
          successElement.style.display = 'none';
        }, 3000);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      setErrors({ 
        ...errors, 
        address: error instanceof Error ? error.message : '位置の特定に失敗しました' 
      });
    } finally {
      setGeocoding(false);
    }
  };

  // 手動座標入力の処理
  const handleManualCoordinates = (lat: number, lng: number) => {
    if (isValidJapaneseCoordinates(lat, lng)) {
      setCoordinates({ lat, lng });
      // 🔥 Update formData to include coordinates for saving
      setFormData(prev => ({ ...prev, lat, lng }));
      setErrors({ ...errors, coordinates: '' });
    } else {
      setErrors({ ...errors, coordinates: '日本国内の座標を入力してください' });
    }
  };

  // 完全な住所文字列を生成
  const getFullAddress = () => {
    return `${formData.address_region}${formData.address_locality}${formData.address_street}`.trim();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const text = {
      draft: '下書き',
      published: '公開中',
      archived: 'アーカイブ'
    };
    return text[status as keyof typeof text] || '不明';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業が見つかりません</h2>
          <Link href="/dashboard" className="mt-4 text-blue-600 hover:text-blue-700">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{organization.name}</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.name}</h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadge(organization.status)}`}>
                  {getStatusText(organization.status)}
                </span>
                <span className="text-sm text-gray-500">
                  最終更新: {new Date(organization.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* ステータス変更 */}
              <select
                value={organization.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="archived">アーカイブ</option>
              </select>
              
              {/* 公開ページへのリンク - リアルタイムslugに連動 */}
              {organization?.is_published && formData.slug ? (
                <Link
                  href={`/o/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  公開ページを見る
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed"
                >
                  {!organization?.is_published ? '未公開' : 'スラッグ未設定'}
                </button>
              )}
              
              {/* [VERIFY][DELETE_GUARD] Delete button removed for safety */}
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                サービス
              </button>
              <button
                onClick={() => setActiveTab('casestudies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'casestudies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                事例
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faqs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                記事
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'qa'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Q&A
              </button>
            </nav>
          </div>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 基本情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  スラッグ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.slug ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  公開URL: /o/{formData.slug}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                企業説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="legal_form" className="block text-sm font-medium text-gray-700 mb-2">
                  法人格
                </label>
                <select
                  id="legal_form"
                  value={formData.legal_form}
                  onChange={(e) => handleInputChange('legal_form', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="株式会社">株式会社</option>
                  <option value="有限会社">有限会社</option>
                  <option value="合同会社">合同会社</option>
                  <option value="合資会社">合資会社</option>
                  <option value="合名会社">合名会社</option>
                  <option value="一般社団法人">一般社団法人</option>
                  <option value="一般財団法人">一般財団法人</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700 mb-2">
                  代表者名
                </label>
                <input
                  type="text"
                  id="representative_name"
                  value={formData.representative_name}
                  onChange={(e) => handleInputChange('representative_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* 設立年月日入力欄は除去済み（UIに存在しない） */}

              <div>
                <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-2">
                  資本金（万円）
                </label>
                <input
                  type="number"
                  id="capital"
                  value={formData.capital || ''}
                  onChange={(e) => handleInputChange('capital', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-2">
                  従業員数
                </label>
                <input
                  type="number"
                  id="employees"
                  value={formData.employees || ''}
                  onChange={(e) => handleInputChange('employees', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">連絡先情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.email_public}
                  onChange={(e) => handleInputChange('email_public', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">メールアドレスを公開する</span>
              </label>
            </div>

            <div className="mt-6">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                ウェブサイトURL
              </label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.url ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
            </div>
          </div>

          {/* 住所情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">住所情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="address_postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号
                </label>
                <input
                  type="text"
                  id="address_postal_code"
                  value={formData.address_postal_code}
                  onChange={(e) => handleInputChange('address_postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="address_region" className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県
                </label>
                <select
                  id="address_region"
                  value={formData.address_region}
                  onChange={(e) => handleInputChange('address_region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="北海道">北海道</option>
                  <option value="青森県">青森県</option>
                  <option value="岩手県">岩手県</option>
                  <option value="宮城県">宮城県</option>
                  <option value="秋田県">秋田県</option>
                  <option value="山形県">山形県</option>
                  <option value="福島県">福島県</option>
                  <option value="茨城県">茨城県</option>
                  <option value="栃木県">栃木県</option>
                  <option value="群馬県">群馬県</option>
                  <option value="埼玉県">埼玉県</option>
                  <option value="千葉県">千葉県</option>
                  <option value="東京都">東京都</option>
                  <option value="神奈川県">神奈川県</option>
                  <option value="新潟県">新潟県</option>
                  <option value="富山県">富山県</option>
                  <option value="石川県">石川県</option>
                  <option value="福井県">福井県</option>
                  <option value="山梨県">山梨県</option>
                  <option value="長野県">長野県</option>
                  <option value="岐阜県">岐阜県</option>
                  <option value="静岡県">静岡県</option>
                  <option value="愛知県">愛知県</option>
                  <option value="三重県">三重県</option>
                  <option value="滋賀県">滋賀県</option>
                  <option value="京都府">京都府</option>
                  <option value="大阪府">大阪府</option>
                  <option value="兵庫県">兵庫県</option>
                  <option value="奈良県">奈良県</option>
                  <option value="和歌山県">和歌山県</option>
                  <option value="鳥取県">鳥取県</option>
                  <option value="島根県">島根県</option>
                  <option value="岡山県">岡山県</option>
                  <option value="広島県">広島県</option>
                  <option value="山口県">山口県</option>
                  <option value="徳島県">徳島県</option>
                  <option value="香川県">香川県</option>
                  <option value="愛媛県">愛媛県</option>
                  <option value="高知県">高知県</option>
                  <option value="福岡県">福岡県</option>
                  <option value="佐賀県">佐賀県</option>
                  <option value="長崎県">長崎県</option>
                  <option value="熊本県">熊本県</option>
                  <option value="大分県">大分県</option>
                  <option value="宮崎県">宮崎県</option>
                  <option value="鹿児島県">鹿児島県</option>
                  <option value="沖縄県">沖縄県</option>
                </select>
              </div>

              <div>
                <label htmlFor="address_locality" className="block text-sm font-medium text-gray-700 mb-2">
                  市区町村
                </label>
                <input
                  type="text"
                  id="address_locality"
                  value={formData.address_locality}
                  onChange={(e) => handleInputChange('address_locality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-2">
                番地・建物名
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => handleInputChange('address_street', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geocoding || !getFullAddress()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  aria-label="住所から位置を検出"
                >
                  {geocoding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      検出中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      位置を検出
                    </>
                  )}
                </button>
              </div>
              
              {/* 住所入力ヒント */}
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                ※ '〇丁目' は '4丁目' または '4-' 表記が推奨です。うまく位置が合わない場合は'位置を検出'で補正できます。
              </p>
              
              {/* エラーメッセージ */}
              {errors.address && (
                <p className="mt-2 text-sm text-red-600">{errors.address}</p>
              )}
              
              {/* 成功メッセージ */}
              <div id="geocode-success" className="mt-2 text-sm text-green-600" style={{ display: 'none' }}>
                位置を特定しました！住所プレビューが更新されました。
              </div>
            </div>

            {/* 手動座標入力（折りたたみ） */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowManualCoords(!showManualCoords)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${showManualCoords ? 'rotate-90' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                手動で緯度経度を入力
              </button>
              
              {showManualCoords && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="manual_lat" className="block text-sm font-medium text-gray-700 mb-2">
                        緯度
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="manual_lat"
                        value={coordinates?.lat || ''}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!isNaN(lat) && coordinates) {
                            handleManualCoordinates(lat, coordinates.lng);
                          } else if (!isNaN(lat)) {
                            setCoordinates({ lat, lng: coordinates?.lng || 0 });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: 35.681236"
                      />
                    </div>
                    <div>
                      <label htmlFor="manual_lng" className="block text-sm font-medium text-gray-700 mb-2">
                        経度
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="manual_lng"
                        value={coordinates?.lng || ''}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lng) && coordinates) {
                            handleManualCoordinates(coordinates.lat, lng);
                          } else if (!isNaN(lng)) {
                            setCoordinates({ lat: coordinates?.lat || 0, lng });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: 139.767052"
                      />
                    </div>
                  </div>
                  {errors.coordinates && (
                    <p className="mt-2 text-sm text-red-600">{errors.coordinates}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    手動で入力した座標は住所検出より優先されます。日本国内の座標を入力してください。
                  </p>
                  
                  {/* 座標公開設定 */}
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="publish_coordinates"
                      checked={publishCoordinates}
                      onChange={(e) => setPublishCoordinates(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="publish_coordinates" className="text-sm text-gray-700">
                      座標情報を公開する（検索エンジン向けJSON-LDに含める）
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    オフの場合、座標は保存されますが公開ページには表示されません。
                  </p>
                </div>
              )}
            </div>

            {/* 住所プレビュー */}
            <div className="mt-6">
              <AddressDisplay
                postalCode={formData.address_postal_code}
                fullAddress={getFullAddress()}
                organizationName={formData.name}
                showGoogleMapsLink={true}
                showDirectionsLink={true}
                className="w-full"
              />
            </div>
          </div>

          {/* ブランド設定 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ブランド設定</h2>
            
            <OrgLogoUploader
              organizationId={organization?.id || ''}
              organizationName={organization?.name || ''}
              currentLogoUrl={formData.logo_url}
              onUploadComplete={(logoUrl) => handleInputChange('logo_url', logoUrl)}
              disabled={submitting}
            />
          </div>

          {/* 業界・分類 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">業界・分類</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業界（複数選択可）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {industries.map((industry) => (
                  <label key={industry} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.industries?.includes(industry) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('industries', [...(formData.industries || []), industry]);
                        } else {
                          handleArrayChange('industries', (formData.industries || []).filter(i => i !== industry));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            {errors.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{errors.success}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                戻る
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </div>
        </form>
        )}

        {/* サービスタブ */}
        {activeTab === 'services' && (
          <ServicesTab organizationId={organizationId} />
        )}

        {/* 事例タブ */}
        {activeTab === 'casestudies' && (
          <CaseStudiesTab organizationId={organizationId} />
        )}

        {/* FAQタブ */}
        {activeTab === 'faqs' && (
          <FAQsTab organizationId={organizationId} />
        )}

        {/* 記事タブ */}
        {activeTab === 'posts' && (
          <PostsTab organizationId={organizationId} organizationSlug={organization?.slug} />
        )}

        {/* Q&Aタブ */}
        {activeTab === 'qa' && (
          <QAManager />
        )}
      </main>

      {/* [VERIFY][DELETE_GUARD] Delete confirmation modal removed for safety */}
    </div>
  );
}