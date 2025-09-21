'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { Organization } from '@/types';
import { Locale } from '@/i18n';
import { trackEvent } from '@/lib/analytics';

interface OrganizationCRUDProps {
  locale: Locale;
  organizationId?: string;
  onSave?: (organization: Organization) => void;
  onCancel?: () => void;
}

export default function OrganizationCRUD({
  locale,
  organizationId,
  onSave,
  onCancel,
}: OrganizationCRUDProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Partial<Organization>>({
    name: '',
    slug: '',
    description: '',
    url: '',
    logo_url: '',
    industries: [],
    address_country: 'Japan',
    address_region: '',
    address_locality: '',
    address_postal_code: '',
    address_street: '',
    employees: undefined,
    founded: '',
    status: 'draft',
    contact_email: '',
    contact_phone: '',
  });

  const [availableIndustries] = useState([
    'テクノロジー',
    '製造業',
    '金融',
    'ヘルスケア',
    '教育',
    '小売',
    '不動産',
    'エネルギー',
    '運輸・物流',
    'メディア・エンターテイメント',
    'コンサルティング',
    '法務・会計',
    '建設',
    '農業',
    'その他',
  ]);

  useEffect(() => {
    if (organizationId) {
      loadOrganization();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      if (data) {
        setOrganization(data);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      alert(t('crud.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setOrganization(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleIndustryToggle = (industry: string) => {
    setOrganization(prev => ({
      ...prev,
      industries: prev.industries?.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...(prev.industries || []), industry],
    }));
  };

  const validateForm = () => {
    if (!organization.name?.trim()) {
      alert(t('crud.validation.nameRequired'));
      return false;
    }
    if (!organization.slug?.trim()) {
      alert(t('crud.validation.slugRequired'));
      return false;
    }
    if (!organization.description?.trim()) {
      alert(t('crud.validation.descriptionRequired'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const orgData = {
        ...organization,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (organizationId) {
        // Update existing organization
        result = await supabaseClient
          .from('organizations')
          .update(orgData)
          .eq('id', organizationId)
          .select()
          .single();
      } else {
        // Create new organization
        result = await supabaseClient
          .from('organizations')
          .insert({
            ...orgData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      trackEvent({
        name: organizationId ? 'Organization Updated' : 'Organization Created',
        properties: {
          organization_id: result.data.id,
          organization_name: result.data.name,
          industries: result.data.industries?.length || 0,
        },
      });

      if (onSave) {
        onSave(result.data);
      } else {
        router.push(`/${locale}/o/${result.data.slug}`);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      alert(t('crud.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!organizationId) return;

    const confirmed = confirm(t('crud.confirmDelete'));
    if (!confirmed) return;

    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;

      trackEvent({
        name: 'Organization Deleted',
        properties: {
          organization_id: organizationId,
          organization_name: organization.name,
        },
      });

      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert(t('crud.errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {organizationId ? t('crud.editOrganization') : t('crud.createOrganization')}
          </h1>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md border"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('crud.sections.basicInfo')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.name')} *
                </label>
                <input
                  type="text"
                  value={organization.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.slug')} *
                </label>
                <input
                  type="text"
                  value={organization.slug || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t('crud.fields.slugHint')}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.description')} *
                </label>
                <textarea
                  value={organization.description || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.url')}
                </label>
                <input
                  type="url"
                  value={organization.url || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.logoUrl')}
                </label>
                <input
                  type="url"
                  value={organization.logo_url || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 業界 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('crud.sections.industries')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableIndustries.map((industry) => (
                <label key={industry} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={organization.industries?.includes(industry) || false}
                    onChange={() => handleIndustryToggle(industry)}
                    className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 住所情報 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('crud.sections.address')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.region')}
                </label>
                <select
                  value={organization.address_region || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, address_region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('crud.fields.selectRegion')}</option>
                  <option value="北海道">北海道</option>
                  <option value="東北">東北</option>
                  <option value="関東">関東</option>
                  <option value="中部">中部</option>
                  <option value="近畿">近畿</option>
                  <option value="中国">中国</option>
                  <option value="四国">四国</option>
                  <option value="九州・沖縄">九州・沖縄</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.locality')}
                </label>
                <input
                  type="text"
                  value={organization.address_locality || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, address_locality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.postalCode')}
                </label>
                <input
                  type="text"
                  value={organization.address_postal_code || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, address_postal_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.street')}
                </label>
                <input
                  type="text"
                  value={organization.address_street || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, address_street: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 企業情報 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('crud.sections.companyInfo')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.employees')}
                </label>
                <input
                  type="number"
                  value={organization.employees || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, employees: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.founded')}
                </label>
                <input
                  type="date"
                  value={organization.founded || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, founded: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.contactEmail')}
                </label>
                <input
                  type="email"
                  value={organization.contact_email || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.contactPhone')}
                </label>
                <input
                  type="tel"
                  value={organization.contact_phone || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crud.fields.status')}
                </label>
                <select
                  value={organization.status || 'draft'}
                  onChange={(e) => setOrganization(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">{t('crud.status.draft')}</option>
                  <option value="published">{t('crud.status.published')}</option>
                  <option value="archived">{t('crud.status.archived')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              {organizationId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('crud.actions.delete')}
                </button>
              )}
            </div>
            
            <div className="flex space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
              )}
              
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}