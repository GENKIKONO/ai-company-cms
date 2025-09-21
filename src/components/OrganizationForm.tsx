'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createOrganization, updateOrganization, getIndustries } from '@/lib/organizations';
import { type Organization, type OrganizationFormData } from '@/types/database';

interface OrganizationFormProps {
  organization?: Organization;
  onSuccess?: () => void;
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const router = useRouter();
  const [false, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: organization?.name || '',
    slug: organization?.slug || '',
    description: organization?.description || '',
    legal_form: organization?.legal_form || '',
    representative_name: organization?.representative_name || '',
    founded: organization?.founded || '',
    capital: organization?.capital || undefined,
    employees: organization?.employees || undefined,
    address_country: organization?.address_country || 'Japan',
    address_region: organization?.address_region || '',
    address_locality: organization?.address_locality || '',
    street_address: organization?.street_address || '',
    postal_code: organization?.postal_code || '',
    telephone: organization?.telephone || '',
    email: organization?.email || '',
    email_public: organization?.email_public || false,
    url: organization?.url || '',
    logo_url: organization?.logo_url || '',
    same_as: organization?.same_as || [],
    industries: organization?.industries || [],
  });

  useEffect(() => {
    loadIndustries();
  }, []);

  const loadIndustries = async () => {
    const { data } = await getIndustries();
    if (data) {
      setAvailableIndustries(data);
    }
  };

  // 企業名からスラッグを自動生成
  useEffect(() => {
    if (formData.name && !organization) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (organization) {
        // 更新
        const { error } = await updateOrganization(organization.id, formData);
        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await createOrganization(formData);
        if (error) throw error;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/organizations');
      }
    } catch (error: any) {
      setError(error.message || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      industries: checked
        ? [...(prev.industries || []), industry]
        : (prev.industries || []).filter(i => i !== industry)
    }));
  };

  const addCustomIndustry = () => {
    const customIndustry = prompt('カスタム業界を入力してください:');
    if (customIndustry && !formData.industries?.includes(customIndustry)) {
      setFormData(prev => ({
        ...prev,
        industries: [...(prev.industries || []), customIndustry]
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              企業名 *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              スラッグ（URL用） *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              企業説明
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              法人格
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.legal_form}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_form: e.target.value }))}
            >
              <option value="">選択してください</option>
              <option value="株式会社">株式会社</option>
              <option value="有限会社">有限会社</option>
              <option value="合同会社">合同会社</option>
              <option value="合資会社">合資会社</option>
              <option value="合名会社">合名会社</option>
              <option value="一般社団法人">一般社団法人</option>
              <option value="NPO法人">NPO法人</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              代表者名
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.representative_name}
              onChange={(e) => setFormData(prev => ({ ...prev, representative_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              設立年月日
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.founded}
              onChange={(e) => setFormData(prev => ({ ...prev, founded: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              資本金（円）
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.capital || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, capital: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              従業員数
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.employees || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
        </div>
      </div>

      {/* 住所情報 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">住所情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              都道府県
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.address_region}
              onChange={(e) => setFormData(prev => ({ ...prev, address_region: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              市区町村
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.address_locality}
              onChange={(e) => setFormData(prev => ({ ...prev, address_locality: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              郵便番号
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.postal_code}
              onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              番地・建物名
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.street_address}
              onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* 連絡先情報 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">連絡先情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電話番号
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.email_public}
                onChange={(e) => setFormData(prev => ({ ...prev, email_public: e.target.checked }))}
              />
              <span className="ml-2 text-sm text-gray-600">メールアドレスを公開する</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ウェブサイトURL
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ロゴURL
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* 業界選択 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">業界</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableIndustries.map((industry) => (
            <label key={industry} className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.industries?.includes(industry) || false}
                onChange={(e) => handleIndustryChange(industry, e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">{industry}</span>
            </label>
          ))}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={addCustomIndustry}
          className="mt-4"
        >
          カスタム業界を追加
        </Button>
      </div>

      {/* フォーム操作 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={false}
        >
          {false ? '保存中...' : organization ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
}