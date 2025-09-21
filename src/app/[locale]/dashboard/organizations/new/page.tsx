'use client';

import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import OrganizationForm from '@/components/forms/OrganizationForm';
import { useState } from 'react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const supabase = supabaseBrowser();
      
      // 現在のユーザーを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('認証が必要です');
      }

      // app_usersからロール情報を取得
      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('role, partner_id')
        .eq('id', user.id)
        .single();

      if (userError || !appUser) {
        throw new Error('ユーザー情報が見つかりません');
      }

      // Organizationデータを準備
      const orgData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        legal_form: formData.legalForm,
        representative_name: formData.representativeName,
        founded: formData.founded || null,
        capital: formData.capital ? parseFloat(formData.capital.replace(/[^0-9.]/g, '')) : null,
        employees: formData.employees ? parseInt(formData.employees.replace(/[^0-9]/g, '')) : null,
        address_country: 'JP',
        address_region: formData.addressRegion,
        address_locality: formData.addressLocality,
        street_address: formData.streetAddress || null,
        postal_code: formData.postalCode || null,
        telephone: formData.telephone,
        email: formData.email || null,
        email_public: formData.emailPublic,
        url: formData.url,
        logo_url: formData.logoUrl || null,
        same_as: [],
        gbp_url: null,
        industries: [],
        eeat: null,
        status: 'draft',
        owner_user_id: user.id,
        partner_id: appUser.partner_id,
      };

      const { data: newOrg, error: insertError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`保存に失敗しました: ${insertError.message}`);
      }

      console.log('Organization created:', newOrg);
      router.push(`/dashboard/organizations/${newOrg.id}`);
      
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">新規企業登録</h1>
                <p className="mt-1 text-sm text-gray-500">
                  企業情報を入力して、公開ページを作成します
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <OrganizationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}