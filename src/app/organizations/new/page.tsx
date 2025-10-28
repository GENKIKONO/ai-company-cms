'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getIndustries } from '@/lib/organizations';
import { normalizeOrganizationPayload } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { type AppUser, type OrganizationFormData } from '@/types/database';
import OrgLogoUploader from '@/components/OrgLogoUploader';

// プラン別タグ数制限
const TAG_LIMIT: Record<string, number | 'unlimited'> = {
  free: 1,
  starter: 3,
  business: 5,
  enterprise: 'unlimited'
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    legal_form: '',
    corporate_number: '',
    representative_name: '',
    // founded: '',  // UIに入力欄がないため完全除去
    capital: undefined,
    employees: undefined,
    address_country: 'JP',
    address_region: '',
    address_locality: '',
    address_postal_code: '',
    address_street: '',
    telephone: '',
    email: '',
    email_public: false,
    url: '',
    logo_url: '',
    same_as: [],
    industries: [],
    status: 'draft',
    meta_title: '',
    meta_description: '',
    meta_keywords: []
  });

  // 認証確認とデータ取得
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace('/auth/login?redirect=' + encodeURIComponent('/organizations/new'));
          return;
        }
        
        setUser(currentUser);
        
        // 業界一覧を取得
        const industriesResult = await getIndustries();
        if (industriesResult.data) {
          setIndustries(industriesResult.data);
        }
      } catch (error) {
        logger.error('Auth check failed', error instanceof Error ? error : new Error(String(error)));
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // スラッグの自動生成
  const generateSlug = (name: string): string => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // 予約語チェック
    const reservedSlugs = [
      'o', 's', 'admin', 'api', 'assets', 'static', 
      'sitemap', 'robots', 'login', 'signup', 'auth',
      'dashboard', 'ops', 'help', 'contact', 'terms', 'privacy',
      'organizations', 'new', 'edit', 'delete', 'create'
    ];
    
    if (reservedSlugs.includes(baseSlug)) {
      return `${baseSlug}-company`;
    }
    
    return baseSlug;
  };

  const handleInputChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // 企業名が変更されたときにスラッグを自動生成
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleArrayChange = (field: 'same_as' | 'industries' | 'meta_keywords', value: string[]) => {
    // プラン制限チェック（industriesフィールドのみ）
    if (field === 'industries') {
      const currentPlan = 'free'; // Default plan for new users
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

    // スラッグは任意に変更（空の場合はAPI側で自動生成）
    const slugValue = typeof formData.slug === 'string' ? formData.slug : '';
    if (slugValue.trim() && !/^[a-z0-9-]+$/.test(slugValue)) {
      newErrors.slug = 'スラッグは小文字、数字、ハイフンのみ使用できます';
    }

    // 企業説明は任意に変更
    // if (!formData.description.trim()) {
    //   newErrors.description = '企業説明は必須です';
    // }

    // 法人番号バリデーション（法人格が選択されている場合）
    const isLegalEntity = ['株式会社', '有限会社', '合同会社', '合資会社', '合名会社', '一般社団法人', '一般財団法人'].includes(formData.legal_form);
    if (isLegalEntity && formData.corporate_number) {
      const corporateNumber = formData.corporate_number.trim();
      if (corporateNumber && !/^\d{13}$/.test(corporateNumber)) {
        newErrors.corporate_number = '法人番号は13桁の数字で入力してください';
      }
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

    // 送信直前にクライアント側セッションチェック
    const cookieString = document.cookie;
    const hasSupabaseAuthToken = /sb-[^=;]+-auth-token=/.test(cookieString);
    
    if (!hasSupabaseAuthToken) {
      setErrors({ 
        submit: 'セッションが切れています。再度ログインしてください。' 
      });
      // 3秒後に自動でログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent('/organizations/new'));
      }, 3000);
      return;
    }

    setSubmitting(true);
    try {
      // ✅ 根本修正: 基本スキーマのフィールドのみ送信（拡張は本番DB未適用）
      const allowedFields = [
        // 001_initial_schema.sql で定義されたフィールド（確実に存在する）
        'description', 'legal_form', 'representative_name', 'capital', 'employees',
        'address_country', 'address_region', 'address_locality', 'address_postal_code', 'address_street',
        'telephone', 'email', 'email_public', 'url', 'logo_url', 'industries', 'same_as', 'status',
        'meta_title', 'meta_description', 'meta_keywords', 'slug', 'corporate_number'
        // foundedはUIに入力欄がないため除外
        // 拡張フィールドは本番DBに未適用のため一時的に除外
        // 'favicon_url', 'brand_color_primary', 'brand_color_secondary', 'social_media', 'business_hours',
        // 'timezone', 'languages_supported', 'certifications', 'awards', 'company_culture', 
        // 'mission_statement', 'vision_statement', 'values'
      ];
      
      const cleanData: any = {
        name: formData.name.trim(),
      };
      
      // ✅ 強化された空文字・null・undefined除外ロジック（日付フィールド特別処理）
      const dateFields: string[] = []; // foundedはUIに存在しないため完全除去
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'name' && allowedFields.includes(key)) {
          // 日付フィールドの特別処理：空文字は完全に除外
          if (dateFields.includes(key)) {
            if (typeof value === 'string') {
              const trimmedValue = value.trim();
              // 空文字、undefined、nullを完全に除外し、有効な日付形式のみ受け入れ
              if (trimmedValue !== '' && trimmedValue !== 'undefined' && trimmedValue !== 'null') {
                // 日付形式チェック（YYYY-MM-DD）
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
                  cleanData[key] = trimmedValue;
                }
              }
            }
            // 日付フィールドで空文字の場合は完全にスキップ（DBに送信しない）
          }
          // 通常の文字列フィールド：空文字・null・undefinedを完全除外
          else if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (trimmedValue !== '' && trimmedValue !== 'undefined' && trimmedValue !== 'null') {
              cleanData[key] = trimmedValue;
            }
          }
          // 数値の場合：有効な値のみ（NaN・null・undefined除外）
          else if (typeof value === 'number' && !isNaN(value)) {
            cleanData[key] = value;
          }
          // ブール値の場合：null・undefinedでなければ追加
          else if (typeof value === 'boolean') {
            cleanData[key] = value;
          }
          // 配列の場合：空でない、かつ要素が有効なもののみ
          else if (Array.isArray(value) && value.length > 0 && value.some(item => item !== null && item !== undefined && item !== '')) {
            cleanData[key] = value.filter(item => item !== null && item !== undefined && item !== '');
          }
          // オブジェクトの場合：null・undefinedでなければ追加
          else if (value !== null && value !== undefined && typeof value === 'object') {
            cleanData[key] = value;
          }
        }
      });
      
      const minimalData = cleanData;
      
      // Debug logging for development
      logger.debug('Organization form submission', {
        name: formData.name,
        slug: formData.slug,
        allKeys: Object.keys(formData),
        emptyStringFields: Object.entries(formData).filter(([k, v]) => v === '').map(([k]) => k),
        minimalData
      });
      
      // Single-Org API経由で作成
      // 🚨 フロント送信前の最終クリーニング: 日付フィールドの空文字をnullに変換
      const payload = { ...minimalData };
      
      // established_at 空文字チェック
      if (payload.established_at === '') {
        delete (payload as any).established_at;
      }
      
      logger.debug('Final organization payload', { payload, keys: Object.keys(payload) });

      const response = await fetch('/api/my/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Organization create error', errorData);
        
        // 新しいAPIエラーレスポンス形式に対応
        if (response.status === 409) {
          if (errorData.code === 'UNIQUE_VIOLATION') {
            if (errorData.reason?.includes('slug')) {
              setErrors({ slug: 'このスラッグは既に使用されています' });
            } else if (errorData.reason?.includes('organization')) {
              setErrors({ submit: 'すでに企業を作成済みです' });
            } else {
              setErrors({ slug: errorData.details || 'このスラッグは既に使用されています' });
            }
          } else {
            setErrors({ submit: errorData.reason || 'データの重複エラーです' });
          }
        } else if (response.status === 400) {
          if (errorData.code === 'VALIDATION_ERROR' && errorData.details && Array.isArray(errorData.details)) {
            // デバッグ用: 詳細エラーをコンソールに出力
            logger.error('Validation error details', errorData.details);
            
            // Zod詳細エラーを各フィールドにマッピング
            const fieldErrors: Record<string, string> = {};
            errorData.details.forEach((err: any) => {
              if (err.field && err.message) {
                fieldErrors[err.field] = err.message;
              }
            });
            
            // フィールドエラーがある場合はそれを設定、なければ詳細なエラー
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
            } else {
              setErrors({ 
                submit: `バリデーションエラー: ${errorData.details.map((d: any) => d.message || JSON.stringify(d)).join(', ')}` 
              });
            }
          } else {
            setErrors({ submit: errorData.reason || errorData.message || 'データに不備があります' });
          }
        } else if (response.status === 401) {
          setErrors({ submit: 'ログインが必要です。再度ログインしてください。' });
          setTimeout(() => {
            router.push('/auth/login?redirect=' + encodeURIComponent('/organizations/new'));
          }, 2000);
        } else {
          setErrors({ 
            submit: errorData.details || errorData.reason || errorData.message || '企業の作成に失敗しました' 
          });
        }
        return;
      }
      
      const result = await response.json();
      
      // Debug API response structure
      logger.debug('API Response', {
        status: response.status,
        hasData: !!result.data,
        hasDataId: !!result.data?.id,
        responseKeys: Object.keys(result)
      });
      
      // 成功条件：APIの実際のレスポンス構造に基づいて判定
      const isSuccessful = (
        // 新規作成成功: { data: { id: ... }, created: true } with status 201
        (response.status === 201 && result.data?.id && result.created === true) ||
        // 既存組織発見: { data: { id: ... }, created: false } with status 200  
        (response.status === 200 && result.data?.id && result.created === false) ||
        // その他の成功パターン: dataにidがあれば成功とみなす
        (result.data?.id)
      );
      
      if (isSuccessful) {
        logger.info('Organization creation/retrieval successful');
        // Single-Org モードでは企業作成後はダッシュボードにリダイレクト
        router.push('/dashboard');
      } else {
        logger.error('Organization creation failed - unexpected response structure', result);
        setErrors({ submit: '企業の作成に失敗しました' });
      }
    } catch (error) {
      logger.error('Failed to create organization', error instanceof Error ? error : new Error(String(error)));
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setErrors({ submit: 'ログインが必要です。再度ログインしてください。' });
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          setErrors({ submit: '権限がありません。管理者にお問い合わせください。' });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        setErrors({ submit: '企業の作成に失敗しました。しばらく時間をおいてから再度お試しください。' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                マイページ
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">新しい企業を追加</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しい企業を追加</h1>
          <p className="text-lg text-gray-600">
            企業情報を入力して、ディレクトリに追加します
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="card">
          {/* 基本情報 */}
          <div className="card-padding card-header bg-gray-50">
            <h2 className="text-heading-4 text-gray-900">基本情報</h2>
            
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="株式会社サンプル"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.slug ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="sample-company"
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  公開URL: /o/{formData.slug}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                企業説明
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="企業の事業内容や特徴を記載してください"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="田中 太郎"
                />
              </div>
            </div>

            {/* 法人番号フィールド（法人の場合のみ表示） */}
            {(['株式会社', '有限会社', '合同会社', '合資会社', '合名会社', '一般社団法人', '一般財団法人'].includes(formData.legal_form)) && (
              <div className="mt-6">
                <label htmlFor="corporate_number" className="block text-sm font-medium text-gray-700 mb-2">
                  法人番号 <span className="text-[var(--bg-primary)] text-xs">（信頼性向上）</span>
                </label>
                <input
                  type="text"
                  id="corporate_number"
                  value={formData.corporate_number}
                  onChange={(e) => handleInputChange('corporate_number', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.corporate_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234567890123"
                  maxLength={13}
                  pattern="[0-9]{13}"
                />
                {errors.corporate_number && <p className="mt-1 text-sm text-red-600">{errors.corporate_number}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  13桁の法人番号を入力してください（国税庁法人番号公表サイトで確認可能）
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* 設立年月日入力欄を除去（UIに存在しない） */}

              <div>
                <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-2">
                  資本金（万円）
                </label>
                <input
                  type="number"
                  id="capital"
                  value={formData.capital || ''}
                  onChange={(e) => handleInputChange('capital', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="1000"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="100"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="03-1234-5678"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="info@example.com"
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
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://www.example.com"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="100-0001"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="千代田区"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-2">
                番地・建物名
              </label>
              <input
                type="text"
                id="address_street"
                value={formData.address_street}
                onChange={(e) => handleInputChange('address_street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="丸の内1-1-1 パレスビル"
              />
            </div>
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
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ブランド設定（基本スキーマのみ） */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ブランド設定</h2>
            
            {/* 企業作成前はロゴアップロード機能を無効化 */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                企業ロゴ
              </label>
              
              <div className="flex items-center space-x-4">
                {/* Logo Display */}
                <div className="flex-shrink-0 w-30 h-30">
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Upload Message */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500">
                    企業作成後にロゴをアップロードできます
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG、JPG、WebP形式、最大1MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEO・メタ情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO・メタ情報</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-2">
                  メタタイトル
                </label>
                <input
                  type="text"
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="検索結果に表示されるタイトル"
                />
              </div>

              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-2">
                  メタ説明文
                </label>
                <textarea
                  id="meta_description"
                  rows={3}
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="検索結果に表示される説明文"
                />
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-6 bg-gray-50">
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">作成に失敗しました</h3>
                    <p className="text-sm text-red-600 mt-1">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--bg-primary)] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    作成中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    企業を作成
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
  );
}