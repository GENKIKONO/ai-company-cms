'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getIndustries } from '@/lib/organizations';
import { normalizeOrganizationPayload } from '@/lib/normalize';
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
    industries: []
  });

  // 認証確認とデータ取得
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace('/auth/signin?redirect=' + encodeURIComponent('/organizations/new'));
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

  const handleArrayChange = (field: 'same_as' | 'industries', value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '企業名は必須です';
    }

    // 安全な文字列処理でundefined.test()エラーを回避
    const slugValue = typeof formData.slug === 'string' ? formData.slug : '';
    if (!slugValue.trim()) {
      newErrors.slug = 'スラッグは必須です';
    } else if (!/^[a-z0-9-]+$/.test(slugValue)) {
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

    // 送信直前にクライアント側セッションチェック
    const cookieString = document.cookie;
    const hasSupabaseAuthToken = /sb-[^=;]+-auth-token=/.test(cookieString);
    
    if (!hasSupabaseAuthToken) {
      setErrors({ 
        submit: 'セッションが切れています。再度ログインしてください。' 
      });
      // 3秒後に自動でログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/signin?redirect=' + encodeURIComponent('/organizations/new'));
      }, 3000);
      return;
    }

    setSubmitting(true);
    try {
      // データ正規化とバリデーション
      const normalizedData = normalizeOrganizationPayload(formData);
      
      // Single-Org API経由で作成
      const response = await fetch('/api/my/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(normalizedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // APIエラーレスポンスに基づいてエラー表示
        if (response.status === 409) {
          setErrors({ slug: errorData.message || 'このスラッグは既に使用されています' });
        } else if (response.status === 400) {
          setErrors({ submit: errorData.message || 'データに不備があります' });
        } else if (response.status === 422) {
          setErrors({ submit: errorData.message || 'バリデーションエラーです' });
        } else {
          setErrors({ submit: errorData.message || '企業の作成に失敗しました' });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '作成中...' : '企業を作成'}
              </button>
            </div>
          </div>
        </form>
      </main>
  );
}