'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FacetGroup, FacetOption, SearchFilters, facetedSearchService } from '@/lib/faceted-search';
import { trackEvent } from '@/lib/analytics';

interface FacetedSearchPanelProps {
  facets: FacetGroup[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  totalResults: number;
  searchTime: number;
  className?: string;
}

export default function FacetedSearchPanel({
  facets,
  filters,
  onFiltersChange,
  totalResults,
  searchTime,
  className = '',
}: FacetedSearchPanelProps) {
  const [collapsedFacets, setCollapsedFacets] = useState<Set<string>>(new Set());

  const handleFilterToggle = (facetKey: string, value: string) => {
    const newFilters = facetedSearchService.toggleFilter(filters, facetKey, value);
    onFiltersChange(newFilters);

    trackEvent({
      name: 'Facet Filter Toggle',
      properties: {
        facet_group: facetKey,
        filter_value: value,
        total_active_filters: countActiveFilters(newFilters),
      },
    });
  };

  const handleClearFacetGroup = (facetKey: string) => {
    const newFilters = facetedSearchService.clearFacetGroup(filters, facetKey);
    onFiltersChange(newFilters);

    trackEvent({
      name: 'Facet Group Clear',
      properties: {
        facet_group: facetKey,
        total_active_filters: countActiveFilters(newFilters),
      },
    });
  };

  const handleClearAllFilters = () => {
    const newFilters = facetedSearchService.clearFilters();
    onFiltersChange(newFilters);

    trackEvent({
      name: 'All Filters Clear',
      properties: {
        previous_filter_count: countActiveFilters(filters),
      },
    });
  };

  const toggleFacetCollapse = (facetKey: string) => {
    setCollapsedFacets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(facetKey)) {
        newSet.delete(facetKey);
      } else {
        newSet.add(facetKey);
      }
      return newSet;
    });
  };

  const countActiveFilters = (filters: SearchFilters): number => {
    let count = 0;
    if (filters.industries?.length) count += filters.industries.length;
    if (filters.regions?.length) count += filters.regions.length;
    if (filters.sizes?.length) count += filters.sizes.length;
    if (filters.technologies?.length) count += filters.technologies.length;
    if (filters.hasUrl) count++;
    if (filters.hasLogo) count++;
    if (filters.hasServices) count++;
    if (filters.hasCaseStudies) count++;
    if (filters.isVerified) count++;
    if (filters.lastUpdated) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">検索フィルター</h3>
            <p className="text-sm text-gray-500 mt-1">
              {totalResults.toLocaleString()}件の結果 ({searchTime}ms)
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              すべてクリア ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
          <div className="flex flex-wrap gap-2">
            {renderActiveFilters()}
          </div>
        </div>
      )}

      {/* Facet Groups */}
      <div className="divide-y divide-gray-200">
        {facets.map((facet) => (
          <FacetGroupComponent
            key={facet.key}
            facet={facet}
            collapsed={collapsedFacets.has(facet.key)}
            onToggleCollapse={() => toggleFacetCollapse(facet.key)}
            onFilterToggle={(value) => handleFilterToggle(facet.key, value)}
            onClearGroup={() => handleClearFacetGroup(facet.key)}
          />
        ))}
      </div>
    </div>
  );

  function renderActiveFilters() {
    const tags: JSX.Element[] = [];

    // Industry filters
    filters.industries?.forEach(industry => {
      tags.push(
        <FilterTag
          key={`industry-${industry}`}
          label={industry}
          onRemove={() => handleFilterToggle('industries', industry)}
        />
      );
    });

    // Region filters
    filters.regions?.forEach(region => {
      tags.push(
        <FilterTag
          key={`region-${region}`}
          label={region}
          onRemove={() => handleFilterToggle('regions', region)}
        />
      );
    });

    // Size filters
    filters.sizes?.forEach(size => {
      const sizeLabels = {
        small: 'スタートアップ',
        medium: '中企業',
        large: '大企業',
        enterprise: '大手企業',
      };
      tags.push(
        <FilterTag
          key={`size-${size}`}
          label={sizeLabels[size as keyof typeof sizeLabels] || size}
          onRemove={() => handleFilterToggle('sizes', size)}
        />
      );
    });

    // Technology filters
    filters.technologies?.forEach(tech => {
      tags.push(
        <FilterTag
          key={`tech-${tech}`}
          label={tech}
          onRemove={() => handleFilterToggle('technologies', tech)}
        />
      );
    });

    // Feature filters
    if (filters.hasUrl) {
      tags.push(
        <FilterTag
          key="hasUrl"
          label="ウェブサイトあり"
          onRemove={() => handleFilterToggle('features', 'hasUrl')}
        />
      );
    }
    if (filters.hasLogo) {
      tags.push(
        <FilterTag
          key="hasLogo"
          label="ロゴあり"
          onRemove={() => handleFilterToggle('features', 'hasLogo')}
        />
      );
    }
    if (filters.hasServices) {
      tags.push(
        <FilterTag
          key="hasServices"
          label="サービス情報あり"
          onRemove={() => handleFilterToggle('features', 'hasServices')}
        />
      );
    }
    if (filters.hasCaseStudies) {
      tags.push(
        <FilterTag
          key="hasCaseStudies"
          label="導入事例あり"
          onRemove={() => handleFilterToggle('features', 'hasCaseStudies')}
        />
      );
    }

    // Status filters
    if (filters.isVerified) {
      tags.push(
        <FilterTag
          key="isVerified"
          label="認証済み"
          onRemove={() => handleFilterToggle('status', 'isVerified')}
        />
      );
    }
    if (filters.lastUpdated) {
      tags.push(
        <FilterTag
          key="lastUpdated"
          label="最近更新"
          onRemove={() => handleFilterToggle('status', 'recentlyUpdated')}
        />
      );
    }

    return tags;
  }
}

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-md">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-indigo-200 rounded-sm p-0.5"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

interface FacetGroupComponentProps {
  facet: FacetGroup;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onFilterToggle: (value: string) => void;
  onClearGroup: () => void;
}

function FacetGroupComponent({
  facet,
  collapsed,
  onToggleCollapse,
  onFilterToggle,
  onClearGroup,
}: FacetGroupComponentProps) {
  const hasSelectedOptions = facet.options.some(option => option.selected);
  const visibleOptions = facet.options.slice(0, collapsed ? 5 : undefined);
  const hasMoreOptions = facet.options.length > 5;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
          {facet.label}
          {hasSelectedOptions && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {facet.options.filter(o => o.selected).length}
            </span>
          )}
        </button>
        {hasSelectedOptions && (
          <button
            onClick={onClearGroup}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            クリア
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {visibleOptions.map((option) => (
            <FacetOptionComponent
              key={option.value}
              option={option}
              type={facet.type}
              onToggle={() => onFilterToggle(option.value)}
            />
          ))}
          
          {hasMoreOptions && collapsed && (
            <button
              onClick={onToggleCollapse}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              さらに表示 ({facet.options.length - 5}件)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FacetOptionComponentProps {
  option: FacetOption;
  type: 'checkbox' | 'radio' | 'range' | 'tags';
  onToggle: () => void;
}

function FacetOptionComponent({ option, type, onToggle }: FacetOptionComponentProps) {
  const inputType = type === 'radio' ? 'radio' : 'checkbox';

  return (
    <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2">
      <div className="flex items-center gap-3">
        <input
          type={inputType}
          checked={option.selected}
          onChange={onToggle}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">{option.label}</span>
      </div>
      <span className="text-xs text-gray-500 font-medium">
        {option.count.toLocaleString()}
      </span>
    </label>
  );
}