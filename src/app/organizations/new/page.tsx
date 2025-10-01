'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getIndustries } from '@/lib/organizations';
import { normalizeOrganizationPayload } from '@/lib/utils/data-normalization';
import { type AppUser, type OrganizationFormData } from '@/types/database';

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
    representative_name: '',
    founded: '',
    capital: undefined,
    employees: undefined,
    address_country: 'JP',
    address_region: '',
    address_locality: '',
    street_address: '',
    postal_code: '',
    telephone: '',
    email: '',
    email_public: false,
    url: '',
    logo_url: '',
    same_as: [],
    industries: [],
    // Enhanced organization settings (I1)
    favicon_url: '',
    brand_color_primary: '#000000',
    brand_color_secondary: '#808080',
    social_media: {},
    business_hours: [],
    timezone: 'Asia/Tokyo',
    languages_supported: [],
    certifications: [],
    awards: [],
    company_culture: '',
    mission_statement: '',
    vision_statement: '',
    values: []
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
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // スラッグの自動生成
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

  const handleArrayChange = (field: 'same_as' | 'industries' | 'languages_supported' | 'certifications' | 'awards' | 'values', value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialMediaChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: url.trim() || undefined
      }
    }));
  };

  const handleBusinessHoursChange = (day: string, hours: any) => {
    setFormData(prev => {
      const existingHours = [...(prev.business_hours || [])];
      const dayIndex = existingHours.findIndex(h => h.day === day);
      
      if (dayIndex >= 0) {
        existingHours[dayIndex] = { day, ...hours };
      } else {
        existingHours.push({ day, ...hours });
      }
      
      return { ...prev, business_hours: existingHours };
    });
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

    // 安全な文字列処理でundefined.match()エラーを回避
    const urlValue = typeof formData.url === 'string' ? formData.url : '';
    if (urlValue && !/^https?:\/\/.+/.test(urlValue)) {
      newErrors.url = '正しいURL形式で入力してください';
    }

    const emailValue = typeof formData.email === 'string' ? formData.email : '';
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = '正しいメールアドレス形式で入力してください';
    }

    // Enhanced validation (I1)
    if (formData.brand_color_primary && formData.brand_color_primary.trim() && !/^#[0-9A-Fa-f]{6}$/.test(formData.brand_color_primary)) {
      newErrors.brand_color_primary = '正しいHEXカラー形式で入力してください（例: #FF0000）';
    }

    if (formData.brand_color_secondary && formData.brand_color_secondary.trim() && !/^#[0-9A-Fa-f]{6}$/.test(formData.brand_color_secondary)) {
      newErrors.brand_color_secondary = '正しいHEXカラー形式で入力してください（例: #00FF00）';
    }

    if (formData.favicon_url && formData.favicon_url.trim() && !/^https?:\/\/.+/.test(formData.favicon_url)) {
      newErrors.favicon_url = '正しいURL形式で入力してください';
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
      // 最も最小限のデータのみ送信
      const minimalData = {
        name: formData.name.trim(),
      };
      
      // 📥 送信前の詳細ログ（日付系フィールドの状態確認）
      console.info('🚀 送信直前のフォームデータ:', {
        name: formData.name,
        slug: formData.slug,
        establishment_date: formData.establishment_date || 'UNDEFINED',
        founded: formData.founded || 'UNDEFINED',
        // その他日付が含まれそうなフィールド
      });
      console.info('📤 実際の送信データ:', minimalData);
      
      // Single-Org API経由で作成
      const response = await fetch('/api/my/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(minimalData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Organization create error:', errorData);
        
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
            console.log('Validation error details:', errorData.details);
            
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
      if (result.data?.id) {
        // Single-Org モードでは企業作成後はダッシュボードにリダイレクト
        router.push('/dashboard');
      } else {
        setErrors({ submit: '企業の作成に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to create organization:', error);
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
                ダッシュボード
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label htmlFor="founded" className="block text-sm font-medium text-gray-700 mb-2">
                  設立年月日
                </label>
                <input
                  type="date"
                  id="founded"
                  value={formData.founded}
                  onChange={(e) => handleInputChange('founded', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

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
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号
                </label>
                <input
                  type="text"
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
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
              <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-2">
                番地・建物名
              </label>
              <input
                type="text"
                id="street_address"
                value={formData.street_address}
                onChange={(e) => handleInputChange('street_address', e.target.value)}
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

          {/* 拡張設定（I1） */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ブランド・デザイン設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                  ロゴURL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label htmlFor="favicon_url" className="block text-sm font-medium text-gray-700 mb-2">
                  ファビコンURL
                </label>
                <input
                  type="url"
                  id="favicon_url"
                  value={formData.favicon_url}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.favicon_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/favicon.ico"
                />
                {errors.favicon_url && <p className="mt-1 text-sm text-red-600">{errors.favicon_url}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="brand_color_primary" className="block text-sm font-medium text-gray-700 mb-2">
                  プライマリブランドカラー
                </label>
                <input
                  type="color"
                  id="brand_color_primary"
                  value={formData.brand_color_primary}
                  onChange={(e) => handleInputChange('brand_color_primary', e.target.value)}
                  className={`w-full h-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.brand_color_primary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.brand_color_primary && <p className="mt-1 text-sm text-red-600">{errors.brand_color_primary}</p>}
              </div>

              <div>
                <label htmlFor="brand_color_secondary" className="block text-sm font-medium text-gray-700 mb-2">
                  セカンダリブランドカラー
                </label>
                <input
                  type="color"
                  id="brand_color_secondary"
                  value={formData.brand_color_secondary}
                  onChange={(e) => handleInputChange('brand_color_secondary', e.target.value)}
                  className={`w-full h-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.brand_color_secondary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.brand_color_secondary && <p className="mt-1 text-sm text-red-600">{errors.brand_color_secondary}</p>}
              </div>
            </div>
          </div>

          {/* SNS・外部リンク */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SNS・外部リンク</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/yourcompany' },
                { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourcompany' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/yourcompany' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourcompany' },
                { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/c/yourcompany' },
                { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourcompany' },
                { key: 'note', label: 'note', placeholder: 'https://note.com/yourcompany' },
                { key: 'qiita', label: 'Qiita', placeholder: 'https://qiita.com/yourcompany' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  <input
                    type="url"
                    id={key}
                    value={(formData.social_media as any)?.[key] || ''}
                    onChange={(e) => handleSocialMediaChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 企業理念・文化 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">企業理念・文化</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="mission_statement" className="block text-sm font-medium text-gray-700 mb-2">
                  ミッション・企業理念
                </label>
                <textarea
                  id="mission_statement"
                  rows={3}
                  value={formData.mission_statement}
                  onChange={(e) => handleInputChange('mission_statement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="私たちの使命や企業理念を記載してください"
                />
              </div>

              <div>
                <label htmlFor="vision_statement" className="block text-sm font-medium text-gray-700 mb-2">
                  ビジョン・将来像
                </label>
                <textarea
                  id="vision_statement"
                  rows={3}
                  value={formData.vision_statement}
                  onChange={(e) => handleInputChange('vision_statement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="目指す将来像やビジョンを記載してください"
                />
              </div>

              <div>
                <label htmlFor="company_culture" className="block text-sm font-medium text-gray-700 mb-2">
                  企業文化・働き方
                </label>
                <textarea
                  id="company_culture"
                  rows={3}
                  value={formData.company_culture}
                  onChange={(e) => handleInputChange('company_culture', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="企業文化や働き方の特徴を記載してください"
                />
              </div>
            </div>
          </div>

          {/* 詳細設定 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">詳細設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  タイムゾーン
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                </select>
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
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="btn-secondary"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? '作成中...' : '企業を作成'}
              </button>
            </div>
          </div>
        </form>
      </main>
  );
}