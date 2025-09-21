'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { trackPageView, trackEvent } from '@/lib/analytics';
import { Organization } from '@/types';

interface CandidateOrganization {
  id: string;
  name: string;
  slug: string;
  industries?: string[];
  address_region?: string;
  logo_url?: string;
}

interface Props {
  organizations: Organization[];
  candidates: CandidateOrganization[];
  selectedIds: string[];
}

export default function ComparePage({ organizations, candidates, selectedIds }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState(candidates);

  useEffect(() => {
    // Analytics: ページビュー追跡
    trackPageView({
      url: '/compare',
      referrer: document.referrer,
      title: '企業比較',
    });

    trackEvent({
      name: 'Compare Page View',
      properties: {
        organizations_count: organizations.length,
        has_selected_organizations: organizations.length > 0,
      },
    });
  }, [organizations.length]);

  useEffect(() => {
    // 検索フィルタリング
    if (searchQuery) {
      const filtered = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.industries?.some(industry => 
          industry.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredCandidates(filtered);
    } else {
      setFilteredCandidates(candidates);
    }
  }, [searchQuery, candidates]);

  const addToCompare = (organizationId: string) => {
    const newIds = [...selectedIds, organizationId].slice(0, 4); // 最大4社まで
    const params = new URLSearchParams({ ids: newIds.join(',') });
    router.push(`/compare?${params.toString()}`);

    trackEvent({
      name: 'Add to Compare',
      properties: {
        organization_id: organizationId,
        total_comparing: newIds.length,
      },
    });
  };

  const removeFromCompare = (organizationId: string) => {
    const newIds = selectedIds.filter(id => id !== organizationId);
    if (newIds.length > 0) {
      const params = new URLSearchParams({ ids: newIds.join(',') });
      router.push(`/compare?${params.toString()}`);
    } else {
      router.push('/compare');
    }

    trackEvent({
      name: 'Remove from Compare',
      properties: {
        organization_id: organizationId,
        remaining_comparing: newIds.length,
      },
    });
  };

  const formatFoundedYear = (founded?: string) => {
    if (!founded) return '-';
    return new Date(founded).getFullYear() + '年';
  };

  const formatEmployeeCount = (employees?: number) => {
    if (!employees) return '-';
    return employees.toLocaleString() + '名';
  };

  const formatCapital = (capital?: number) => {
    if (!capital) return '-';
    return capital.toLocaleString() + '円';
  };

  const renderComparisonTable = () => {
    if (organizations.length < 2) return null;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">比較表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  項目
                </th>
                {organizations.map((org) => (
                  <th key={org.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      {org.logo_url && (
                        <Image
                          src={org.logo_url}
                          alt={`${org.name}のロゴ`}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      )}
                      <span className="truncate">{org.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* 基本情報 */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  設立年
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFoundedYear(org.founded)}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  従業員数
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatEmployeeCount(org.employees)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  資本金
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCapital(org.capital)}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  所在地
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.address_region && org.address_locality
                      ? `${org.address_region}${org.address_locality}`
                      : '-'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  業界
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 text-sm text-gray-500">
                    {org.industries && org.industries.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {org.industries.slice(0, 3).map((industry) => (
                          <span
                            key={industry}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {industry}
                          </span>
                        ))}
                        {org.industries.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{org.industries.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  サービス数
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.services ? org.services.length : 0}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  導入事例数
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.case_studies ? org.case_studies.length : 0}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  アクション
                </td>
                {organizations.map((org) => (
                  <td key={org.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-2">
                      <Link
                        href={`/o/${org.slug}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        詳細を見る
                      </Link>
                      <button
                        onClick={() => removeFromCompare(org.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        比較から削除
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">企業比較</h1>
              <p className="mt-2 text-lg text-gray-600">
                複数の企業を比較して、最適なパートナーを見つけましょう
              </p>
            </div>
            <Link
              href="/directory"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              企業一覧に戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 現在比較中の企業 */}
        {organizations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              比較中の企業 ({organizations.length}/4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {organizations.map((org) => (
                <div key={org.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {org.logo_url && (
                      <Image
                        src={org.logo_url}
                        alt={`${org.name}のロゴ`}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {org.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {org.address_region}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/o/${org.slug}`}
                      className="flex-1 text-center text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      詳細
                    </Link>
                    <button
                      onClick={() => removeFromCompare(org.id)}
                      className="flex-1 text-center text-xs text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 比較表 */}
            {renderComparisonTable()}
          </div>
        )}

        {/* 企業選択セクション */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {organizations.length === 0 ? '比較する企業を選択' : '企業を追加'}
              </h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="企業名または業界で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">該当する企業が見つかりませんでした。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates
                  .filter(candidate => !selectedIds.includes(candidate.id))
                  .map((candidate) => (
                    <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        {candidate.logo_url && (
                          <Image
                            src={candidate.logo_url}
                            alt={`${candidate.name}のロゴ`}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {candidate.address_region}
                          </p>
                        </div>
                      </div>
                      
                      {candidate.industries && candidate.industries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.industries.slice(0, 2).map((industry) => (
                            <span
                              key={industry}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {industry}
                            </span>
                          ))}
                          {candidate.industries.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{candidate.industries.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Link
                          href={`/o/${candidate.slug}`}
                          className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                        >
                          詳細を見る
                        </Link>
                        <button
                          onClick={() => addToCompare(candidate.id)}
                          disabled={selectedIds.length >= 4}
                          className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          比較に追加
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {selectedIds.length >= 4 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  比較できる企業は最大4社までです。新しい企業を追加するには、既存の企業を削除してください。
                </p>
              </div>
            )}
          </div>
        </div>

        {organizations.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              まだ比較する企業が選択されていません。
            </p>
            <Link
              href="/directory"
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              企業一覧から選択する →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}