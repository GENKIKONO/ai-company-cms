'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/components/layout/I18nProvider';
import { ChevronDown, Filter, X, Calendar, Star, MapPin, Building2 } from 'lucide-react';

export interface AdvancedFilters {
  query: string;
  type: 'all' | 'organizations' | 'services' | 'case_studies';
  industries: string[];
  regions: string[];
  categories: string[];
  foundedYear?: {
    min?: number;
    max?: number;
  };
  companySize?: string[];
  rating?: number;
  hasAwards?: boolean;
  hasCertifications?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  sortBy: 'relevance' | 'name' | 'founded' | 'rating' | 'updated';
  sortOrder: 'asc' | 'desc';
}

interface Props {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  industries: string[];
  categories: string[];
  onSearch: () => void;
  resultsCount: number;
}

const COMPANY_SIZES = [
  'startup',     // スタートアップ（〜10名）
  'small',       // 小企業（11〜50名）
  'medium',      // 中企業（51〜200名）
  'large',       // 大企業（201〜1000名）
  'enterprise'   // 大手企業（1001名〜）
];

const JAPANESE_REGIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const CURRENT_YEAR = new Date().getFullYear();

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  industries,
  categories,
  onSearch,
  resultsCount
}: Props) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = useCallback((updates: Partial<AdvancedFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const toggleArrayFilter = useCallback((
    key: 'industries' | 'regions' | 'categories' | 'companySize',
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters({ [key]: newArray });
  }, [filters, updateFilters]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      query: filters.query,
      type: 'all',
      industries: [],
      regions: [],
      categories: [],
      companySize: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  }, [filters.query, onFiltersChange]);

  const hasActiveFilters = 
    filters.industries.length > 0 ||
    filters.regions.length > 0 ||
    filters.categories.length > 0 ||
    filters.companySize?.length || 0 > 0 ||
    filters.foundedYear?.min ||
    filters.foundedYear?.max ||
    filters.rating ||
    filters.hasAwards ||
    filters.hasCertifications ||
    filters.priceRange?.min ||
    filters.priceRange?.max;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      {/* 基本検索バー */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <button
          onClick={onSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('search.search')}
        </button>
      </div>

      {/* クイックフィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'organizations', 'services', 'case_studies'] as const).map(type => (
          <button
            key={type}
            onClick={() => updateFilters({ type })}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filters.type === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(`search.types.${type}`)}
          </button>
        ))}
      </div>

      {/* 結果カウントと高度なフィルターの切り替え */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {resultsCount > 0 ? (
            t('search.resultsCount', { count: resultsCount.toLocaleString() })
          ) : (
            t('search.noResults')
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
              {t('search.clearFilters')}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Filter className="w-4 h-4" />
            {t('search.advancedFilters')}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* 高度なフィルター */}
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* 業界 */}
          <div>
            <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 mb-3">
              <Building2 className="w-4 h-4" />
              {t('search.filters.industries')}
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {industries.map(industry => (
                <label key={industry} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.industries.includes(industry)}
                    onChange={() => toggleArrayFilter('industries', industry)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 地域 */}
          <div>
            <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 mb-3">
              <MapPin className="w-4 h-4" />
              {t('search.filters.regions')}
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {JAPANESE_REGIONS.map(region => (
                <label key={region} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(region)}
                    onChange={() => toggleArrayFilter('regions', region)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* サービスカテゴリ */}
          <div>
            <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 mb-3">
              <Filter className="w-4 h-4" />
              {t('search.filters.categories')}
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categories.map(category => (
                <label key={category} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleArrayFilter('categories', category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 企業規模 */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('search.filters.companySize')}
            </h3>
            <div className="space-y-2">
              {COMPANY_SIZES.map(size => (
                <label key={size} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.companySize?.includes(size) || false}
                    onChange={() => toggleArrayFilter('companySize', size)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t(`search.companySize.${size}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 設立年 */}
          <div>
            <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 mb-3">
              <Calendar className="w-4 h-4" />
              {t('search.filters.foundedYear')}
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t('search.min')}
                value={filters.foundedYear?.min || ''}
                onChange={(e) => updateFilters({
                  foundedYear: {
                    ...filters.foundedYear,
                    min: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                min="1900"
                max={CURRENT_YEAR}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                type="number"
                placeholder={t('search.max')}
                value={filters.foundedYear?.max || ''}
                onChange={(e) => updateFilters({
                  foundedYear: {
                    ...filters.foundedYear,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                min="1900"
                max={CURRENT_YEAR}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* その他のフィルター */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('search.filters.other')}
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasAwards || false}
                  onChange={(e) => updateFilters({ hasAwards: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('search.filters.hasAwards')}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasCertifications || false}
                  onChange={(e) => updateFilters({ hasCertifications: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('search.filters.hasCertifications')}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ソート */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('search.sortBy')}:
        </span>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="relevance">{t('search.sort.relevance')}</option>
          <option value="name">{t('search.sort.name')}</option>
          <option value="founded">{t('search.sort.founded')}</option>
          <option value="updated">{t('search.sort.updated')}</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="desc">{t('search.sort.desc')}</option>
          <option value="asc">{t('search.sort.asc')}</option>
        </select>
      </div>
    </div>
  );
}