'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  TableCellsIcon,
  HeartIcon,
  StarIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Organization } from '@/types';
import { trackEvent } from '@/lib/analytics';
import FavoriteButton from '@/components/FavoriteButton';

export type ViewMode = 'grid' | 'list' | 'table';

interface SearchResultsGridProps {
  organizations: Organization[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export default function SearchResultsGrid({
  organizations,
  viewMode,
  onViewModeChange,
  totalCount,
  currentPage,
  hasMore,
  loading,
  onLoadMore,
  className = '',
}: SearchResultsGridProps) {
  const handleViewModeChange = (mode: ViewMode) => {
    onViewModeChange(mode);
    trackEvent({
      name: 'Search View Mode Change',
      properties: {
        view_mode: mode,
        total_results: totalCount,
      },
    });
  };

  const handleOrganizationClick = (organization: Organization, position: number) => {
    trackEvent({
      name: 'Search Result Click',
      properties: {
        organization_id: organization.id,
        organization_name: organization.name,
        position,
        view_mode: viewMode,
        total_results: totalCount,
      },
    });
  };

  return (
    <div className={className}>
      {/* Header with view mode toggle and results count */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            検索結果 ({totalCount.toLocaleString()}件)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {organizations.length}件を表示中
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">表示形式:</span>
          <div className="flex rounded-lg border border-gray-300 p-1">
            <ViewModeButton
              mode="grid"
              currentMode={viewMode}
              onClick={() => handleViewModeChange('grid')}
              icon={Squares2X2Icon}
              label="グリッド"
            />
            <ViewModeButton
              mode="list"
              currentMode={viewMode}
              onClick={() => handleViewModeChange('list')}
              icon={ListBulletIcon}
              label="リスト"
            />
            <ViewModeButton
              mode="table"
              currentMode={viewMode}
              onClick={() => handleViewModeChange('table')}
              icon={TableCellsIcon}
              label="テーブル"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {organizations.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {viewMode === 'grid' && (
            <GridView 
              organizations={organizations} 
              onOrganizationClick={handleOrganizationClick}
            />
          )}
          {viewMode === 'list' && (
            <ListView 
              organizations={organizations} 
              onOrganizationClick={handleOrganizationClick}
            />
          )}
          {viewMode === 'table' && (
            <TableView 
              organizations={organizations} 
              onOrganizationClick={handleOrganizationClick}
            />
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    読み込み中...
                  </>
                ) : (
                  `さらに読み込む (${totalCount - organizations.length}件)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ViewModeButtonProps {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

function ViewModeButton({ mode, currentMode, onClick, icon: Icon, label }: ViewModeButtonProps) {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">検索結果が見つかりませんでした</h3>
      <p className="mt-1 text-sm text-gray-500">
        検索条件を変更して再度お試しください
      </p>
    </div>
  );
}

interface OrganizationViewProps {
  organizations: Organization[];
  onOrganizationClick: (organization: Organization, position: number) => void;
}

function GridView({ organizations, onOrganizationClick }: OrganizationViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {organizations.map((org, index) => (
        <GridCard 
          key={org.id} 
          organization={org} 
          position={index}
          onClick={() => onOrganizationClick(org, index)}
        />
      ))}
    </div>
  );
}

function ListView({ organizations, onOrganizationClick }: OrganizationViewProps) {
  return (
    <div className="space-y-4">
      {organizations.map((org, index) => (
        <ListCard 
          key={org.id} 
          organization={org} 
          position={index}
          onClick={() => onOrganizationClick(org, index)}
        />
      ))}
    </div>
  );
}

function TableView({ organizations, onOrganizationClick }: OrganizationViewProps) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              企業
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              業界
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              地域
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              規模
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              設立年
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {organizations.map((org, index) => (
            <TableRow 
              key={org.id} 
              organization={org} 
              position={index}
              onClick={() => onOrganizationClick(org, index)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface OrganizationCardProps {
  organization: Organization;
  position: number;
  onClick: () => void;
}

function GridCard({ organization, position, onClick }: OrganizationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {organization.logo_url && (
              <div className="flex-shrink-0">
                <Image
                  src={organization.logo_url}
                  alt={`${organization.name}のロゴ`}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {organization.name}
              </h3>
              {organization.industries && organization.industries.length > 0 && (
                <p className="text-xs text-gray-500">
                  {organization.industries.slice(0, 2).join(', ')}
                  {organization.industries.length > 2 && ' など'}
                </p>
              )}
            </div>
          </div>
          <FavoriteButton organization={organization} variant="icon" size="sm" />
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {organization.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            {organization.address_region && (
              <div className="flex items-center space-x-1">
                <MapPinIcon className="w-3 h-3" />
                <span>{organization.address_region}</span>
              </div>
            )}
            {organization.founded_year && (
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{organization.founded_year}年</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/o/${organization.slug}`}
            onClick={onClick}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
          >
            詳細を見る
          </Link>
          
          <div className="flex items-center space-x-2">
            {organization.url && (
              <GlobeAltIcon className="w-4 h-4 text-gray-400" title="ウェブサイトあり" />
            )}
            {organization.is_verified && (
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">認証済み</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCard({ organization, position, onClick }: OrganizationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
      <div className="flex items-start space-x-4">
        {organization.logo_url && (
          <div className="flex-shrink-0">
            <Image
              src={organization.logo_url}
              alt={`${organization.name}のロゴ`}
              width={60}
              height={60}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {organization.name}
              </h3>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                {organization.industries && organization.industries.length > 0 && (
                  <span>{organization.industries.slice(0, 3).join(', ')}</span>
                )}
                {organization.address_region && (
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{organization.address_region}</span>
                  </div>
                )}
                {organization.founded_year && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{organization.founded_year}年設立</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 line-clamp-2 mb-4">
                {organization.description}
              </p>
              
              <div className="flex items-center space-x-4">
                <Link
                  href={`/o/${organization.slug}`}
                  onClick={onClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  詳細を見る
                </Link>
                
                <div className="flex items-center space-x-3 text-gray-400">
                  {organization.url && (
                    <GlobeAltIcon className="w-5 h-5" title="ウェブサイトあり" />
                  )}
                  {organization.is_verified && (
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" title="認証済み" />
                  )}
                </div>
              </div>
            </div>
            
            <FavoriteButton organization={organization} variant="icon" size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TableRow({ organization, position, onClick }: OrganizationCardProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {organization.logo_url && (
            <div className="flex-shrink-0 h-10 w-10 mr-3">
              <Image
                src={organization.logo_url}
                alt={organization.name}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {organization.name}
            </div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {organization.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {organization.industries?.slice(0, 2).join(', ') || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {organization.address_region || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {organization.size || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {organization.founded_year || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <FavoriteButton organization={organization} variant="icon" size="sm" />
        <Link
          href={`/o/${organization.slug}`}
          onClick={onClick}
          className="text-indigo-600 hover:text-indigo-900"
        >
          詳細
        </Link>
      </td>
    </tr>
  );
}