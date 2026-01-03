/* eslint-disable no-console */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MetricsFiltersProps {
  defaultRange?: '1w' | '4w' | '12w';
  defaultOrgId?: string;
}

const RANGE_OPTIONS = [
  { value: '1w', label: '今週' },
  { value: '4w', label: '過去4週' },
  { value: '12w', label: '過去12週' }
] as const;

interface OrganizationOption {
  value: string;
  label: string;
  is_super_admin_only?: boolean;
}

// Super Admin用の初期オプション（実際はAPIから取得）
const DEFAULT_ORG_OPTIONS: OrganizationOption[] = [
  { value: 'all', label: '🌐 全社横断', is_super_admin_only: true },
  { value: '', label: '組織を読み込み中...' }
];

export default function MetricsFilters({ defaultRange = '4w', defaultOrgId }: MetricsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || 'all');
  const [orgOptions, setOrgOptions] = useState<OrganizationOption[]>(DEFAULT_ORG_OPTIONS);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  // 組織一覧の取得
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        const response = await fetch('/api/admin/organizations?include_stats=false');
        
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const orgList: OrganizationOption[] = [
            { value: 'all', label: '🌐 全社横断', is_super_admin_only: true },
            ...data.data.map((org: any) => ({
              value: org.id,
              label: org.name || `組織${org.id}`,
              is_super_admin_only: false
            }))
          ];
          setOrgOptions(orgList);
        } else {
          // フォールバック
          setOrgOptions(DEFAULT_ORG_OPTIONS);
        }
      } catch (error) {
        console.warn('Failed to load organizations for metrics filter:', error);
        // エラー時はデフォルトオプションを使用
        setOrgOptions([
          { value: 'all', label: '🌐 全社横断', is_super_admin_only: true },
          { value: 'error', label: '⚠️ 組織取得エラー' }
        ]);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  const updateFilters = useCallback((newRange?: string, newOrgId?: string) => {
    const params = new URLSearchParams();
    
    const range = newRange || selectedRange;
    const orgId = newOrgId || selectedOrgId;
    
    params.set('range', range);
    if (orgId !== 'all') {
      params.set('orgId', orgId);
    }
    
    router.push(`/admin/metrics?${params.toString()}`);
  }, [selectedRange, selectedOrgId, router]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range as any);
    updateFilters(range, undefined);
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    updateFilters(undefined, orgId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">フィルタ</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 期間フィルタ */}
        <div>
          <label htmlFor="range-select" className="block text-sm font-medium text-gray-700 mb-2">
            期間
          </label>
          <select
            id="range-select"
            value={selectedRange}
            onChange={(e) => handleRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {RANGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            UTC週単位での集計
          </p>
        </div>

        {/* 組織フィルタ */}
        <div>
          <label htmlFor="org-select" className="block text-sm font-medium text-gray-700 mb-2">
            組織
            {isLoadingOrgs && (
              <span className="ml-2 text-xs text-gray-400">読み込み中...</span>
            )}
          </label>
          <select
            id="org-select"
            value={selectedOrgId}
            onChange={(e) => handleOrgChange(e.target.value)}
            disabled={isLoadingOrgs}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {orgOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {selectedOrgId === 'all' 
              ? 'Super Admin: 全組織のKPIを表示' 
              : 'AIインタビュー・引用KPIが組織別に絞り込まれます'
            }
          </p>
        </div>
      </div>

      {/* 選択中のフィルタ表示 */}
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
        <span>現在の設定:</span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {RANGE_OPTIONS.find(opt => opt.value === selectedRange)?.label}
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {orgOptions.find(opt => opt.value === selectedOrgId)?.label || '不明な組織'}
        </span>
      </div>
    </div>
  );
}