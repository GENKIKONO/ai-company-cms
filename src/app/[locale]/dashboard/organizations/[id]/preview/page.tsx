'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { generateAllJsonLd, toE164 } from '@/lib/jsonld';
import { runComprehensivePreflight } from '@/lib/validation';
import PublishGate from '@/components/PublishGate';
import ConsentManager from '@/components/legal/ConsentManager';

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
  services?: any[];
  faqs?: any[];
  case_studies?: any[];
};

type Props = {
  params: { id: string };
};

export default function PreviewPage({ params }: Props) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [jsonLdBlocks, setJsonLdBlocks] = useState<any[]>([]);
  const [preflightResult, setPreflightResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'jsonld' | 'validation' | 'publish'>('preview');
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        const { data: org, error } = await supabase
          .from('organizations')
          .select(`
            *,
            services(*),
            faqs(*),
            case_studies(*)
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error loading organization:', error);
          router.push('/dashboard');
          return;
        }

        setOrganization(org);
        generateJsonLdPreview(org);
        await validateData(org);
        
      } catch (error) {
        console.error('Error:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [params.id, router]);

  const generateJsonLdPreview = (org: Organization) => {
    try {
      const organizationData = {
        name: org.name,
        url: org.url,
        logoUrl: org.logo_url,
        description: org.description,
        founded: org.founded,
        streetAddress: org.street_address,
        addressLocality: org.address_locality,
        addressRegion: org.address_region,
        postalCode: org.postal_code,
        telephoneE164: toE164(org.telephone),
        email: org.email_public ? org.email : undefined,
        areaServed: [],
        sameAs: [],
      };

      const servicesData = org.services?.map(service => ({
        name: service.name,
        summary: service.summary,
        category: service.category,
        priceNumeric: service.price ? parseFloat(service.price.replace(/[^0-9.]/g, '')) : undefined,
        ctaUrl: service.cta_url,
        org: {
          name: org.name,
          url: org.url,
        },
      })) || [];

      const faqsData = org.faqs?.map(faq => ({
        question: faq.question,
        answer: faq.answer,
      })) || [];

      const caseStudiesData = org.case_studies?.map(cs => ({
        title: cs.title,
        clientType: cs.client_type,
        problem: cs.problem,
        solution: cs.solution,
        outcome: cs.outcome,
        publishedAt: cs.published_at,
        org: {
          name: org.name,
        },
      })) || [];

      const blocks = generateAllJsonLd(organizationData, servicesData, faqsData, caseStudiesData);
      setJsonLdBlocks(blocks);
    } catch (error) {
      console.error('Error generating JSON-LD:', error);
    }
  };

  const validateData = async (org: Organization) => {
    setIsValidating(true);
    try {
      const result = await runComprehensivePreflight(
        org,
        org.services,
        org.faqs,
        org.case_studies
      );
      setPreflightResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setPreflightResult({
        success: false,
        errors: ['検証中にエラーが発生しました'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleApprovalRequest = async () => {
    if (!organization || !preflightResult?.success) {
      alert('エラーがあるため、承認申請できません。');
      return;
    }

    try {
      // 承認申請ロジック（後で実装）
      const response = await fetch('/api/approval/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id }),
      });

      if (response.ok) {
        alert('承認申請を送信しました。');
        router.push('/dashboard');
      } else {
        alert('承認申請に失敗しました。');
      }
    } catch (error) {
      console.error('Approval request error:', error);
      alert('承認申請に失敗しました。');
    }
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name} - プレビュー
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  公開前の確認とJSON-LD検証
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/dashboard/organizations/${organization.id}/edit`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              プレビュー
            </button>
            <button
              onClick={() => setActiveTab('jsonld')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jsonld'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              JSON-LD構造化データ
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              検証結果
            </button>
            <button
              onClick={() => setActiveTab('publish')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'publish'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              公開管理
            </button>
          </nav>
        </div>

        {/* プレビュータブ */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">公開ページプレビュー</h2>
              <p className="mt-1 text-sm text-gray-500">
                実際の公開ページとほぼ同じ表示です
              </p>
            </div>
            <div className="p-6">
              <iframe
                src={`/o/${organization.slug}?preview=true`}
                className="w-full h-96 border border-gray-300 rounded"
                title="プレビュー"
              />
              <div className="mt-4 flex justify-center">
                <a
                  href={`/o/${organization.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  新しいタブで開く →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* JSON-LDタブ */}
        {activeTab === 'jsonld' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">JSON-LD構造化データ</h2>
                <div className="flex space-x-2">
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Google Rich Results Test
                  </a>
                  <a
                    href="https://validator.schema.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Schema.org Validator
                  </a>
                </div>
              </div>
              
              {jsonLdBlocks.map((block, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {block['@type']} JSON-LD
                  </h3>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(block, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 検証結果タブ */}
        {activeTab === 'validation' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preflight検証結果</h2>
            
            {isValidating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">検証中...</p>
              </div>
            ) : preflightResult ? (
              <div className="space-y-4">
                {/* 全体ステータス */}
                <div className={`p-4 rounded-md ${
                  preflightResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                      preflightResult.success ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <p className={`ml-3 text-sm font-medium ${
                      preflightResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {preflightResult.success ? '検証成功：公開可能です' : '検証失敗：エラーを修正してください'}
                    </p>
                  </div>
                </div>

                {/* エラー */}
                {preflightResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">エラー</h3>
                    <ul className="space-y-1">
                      {preflightResult.errors.map((error: string, index: number) => (
                        <li key={index} className="text-sm text-red-700">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 警告 */}
                {preflightResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">警告</h3>
                    <ul className="space-y-1">
                      {preflightResult.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 承認申請ボタン */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleApprovalRequest}
                    disabled={!preflightResult.success || organization.status !== 'draft'}
                    className={`px-6 py-2 rounded-md text-sm font-medium ${
                      preflightResult.success && organization.status === 'draft'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {organization.status === 'draft' ? '承認申請' : `現在のステータス: ${organization.status}`}
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    承認申請後、企業担当者にメールが送信されます
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">検証結果を取得できませんでした</p>
            )}
          </div>
        )}

        {/* 公開管理タブ */}
        {activeTab === 'publish' && (
          <div className="space-y-6">
            {/* 法的同意 */}
            <ConsentManager
              userId={currentUser?.id}
              organizationId={organization.id}
              context="publication"
              required={['terms', 'privacy', 'disclaimer']}
              onConsentChange={setConsents}
              className="mb-6"
            />
            
            {/* 公開ゲート */}
            <PublishGate
              organizationId={organization.id}
              organizationName={organization.name}
              currentStatus={organization.status}
              onStatusChange={(newStatus) => {
                setOrganization(prev => prev ? { ...prev, status: newStatus } : null);
              }}
              additionalChecks={{
                'legal-consent': {
                  label: '法的文書への同意',
                  passed: ['terms', 'privacy', 'disclaimer'].every(type => consents[type] === true),
                  message: consents && Object.keys(consents).length > 0 
                    ? ['terms', 'privacy', 'disclaimer'].every(type => consents[type] === true)
                      ? '必要な法的文書への同意が完了しています'
                      : '必要な法的文書への同意が不足しています'
                    : '法的文書への同意を確認中...'
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}