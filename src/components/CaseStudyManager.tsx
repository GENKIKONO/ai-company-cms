'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getCaseStudies, deleteCaseStudy, getCaseStudyStats, getClientIndustries } from '@/lib/case-studies';
import { getOrganizations } from '@/lib/organizations';
import { CaseStudyForm } from '@/components/CaseStudyForm';
import { type CaseStudy, type Organization } from '@/types/database';

export function CaseStudyManager() {
  const { user } = useAuth();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);
  const [stats, setStats] = useState({ total: 0, byOrganization: 0, byIndustry: [], anonymous: 0 });

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  useEffect(() => {
    loadCaseStudies();
    loadOrganizations();
    loadIndustries();
    loadStats();
  }, [searchQuery, selectedOrganization, selectedIndustry, showAnonymousOnly]);

  const loadCaseStudies = async () => {
    setLoading(true);
    const { data } = await getCaseStudies({
      search: searchQuery || undefined,
      organizationId: selectedOrganization || undefined,
      clientIndustry: selectedIndustry || undefined,
      isAnonymous: showAnonymousOnly ? true : undefined,
      limit: 50
    });
    
    if (data) {
      setCaseStudies(data);
    }
    setLoading(false);
  };

  const loadOrganizations = async () => {
    const { data } = await getOrganizations({ limit: 100 });
    if (data) {
      setOrganizations(data);
    }
  };

  const loadIndustries = async () => {
    const { data } = await getClientIndustries();
    if (data) {
      setIndustries(data);
    }
  };

  const loadStats = async () => {
    const statsData = await getCaseStudyStats();
    setStats(statsData);
  };

  const handleEdit = (caseStudy: CaseStudy) => {
    setEditingCaseStudy(caseStudy);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この導入事例を削除してもよろしいですか？')) return;
    
    const { error } = await deleteCaseStudy(id);
    if (!error) {
      loadCaseStudies();
      loadStats();
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCaseStudy(null);
    loadCaseStudies();
    loadStats();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedOrganization('');
    setSelectedIndustry('');
    setShowAnonymousOnly(false);
  };

  if (showForm) {
    return (
      <CaseStudyForm
        caseStudy={editingCaseStudy}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">総事例数</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">提供企業数</h3>
          <p className="text-3xl font-bold text-green-600">{stats.byOrganization}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">業界数</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.byIndustry.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">匿名事例数</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.anonymous}</p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="事例を検索..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
          >
            <option value="">すべての企業</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="">すべての業界</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2 px-3 py-2">
            <input
              type="checkbox"
              checked={showAnonymousOnly}
              onChange={(e) => setShowAnonymousOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">匿名事例のみ</span>
          </label>

          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              事例追加
            </button>
          )}
        </div>

        {(searchQuery || selectedOrganization || selectedIndustry || showAnonymousOnly) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            フィルターをクリア
          </button>
        )}
      </div>

      {/* 導入事例一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            導入事例一覧 ({caseStudies.length}件)
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : caseStudies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">導入事例が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    企業
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クライアント
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    業界
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caseStudies.map((caseStudy) => (
                  <tr key={caseStudy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {caseStudy.title}
                        </div>
                        {caseStudy.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            注目
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {caseStudy.organization?.logo_url && (
                          <img
                            src={caseStudy.organization.logo_url}
                            alt=""
                            className="h-8 w-8 rounded-full mr-2 object-contain"
                          />
                        )}
                        <span className="text-sm text-gray-900">
                          {caseStudy.organization?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseStudy.is_anonymous ? (
                        <span className="text-gray-500 italic">匿名</span>
                      ) : (
                        caseStudy.client_name || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseStudy.client_industry || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseStudy.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(caseStudy)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(caseStudy.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}