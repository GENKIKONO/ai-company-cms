'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  translationManager,
  type TranslatableContent,
  type TranslationStats,
} from '@/lib/translation-manager';
import { type Locale, locales, localeNames, localeFlags } from '@/i18n';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  LanguageIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface TranslationDashboardProps {
  className?: string;
}

export default function TranslationDashboard({ className = '' }: TranslationDashboardProps) {
  const t = useTranslations();
  const [content, setContent] = useState<TranslatableContent[]>([]);
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TranslatableContent['status'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedLocale, selectedStatus]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [contentData, statsData] = await Promise.all([
        translationManager.getTranslatableContent({
          locale: selectedLocale === 'all' ? undefined : selectedLocale,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          limit: 100,
        }),
        translationManager.getTranslationStats(),
      ]);

      setContent(contentData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load translation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (contentId: string) => {
    try {
      await translationManager.approveTranslation(contentId, 'current-user-id');
      await loadData();
    } catch (error) {
      console.error('Failed to approve translation:', error);
    }
  };

  const handleReject = async (contentId: string) => {
    try {
      await translationManager.rejectTranslation(contentId, 'Quality review failed');
      await loadData();
    } catch (error) {
      console.error('Failed to reject translation:', error);
    }
  };

  const handleBulkTranslate = async (targetLocale: Locale) => {
    if (selectedItems.length === 0) return;
    
    try {
      await translationManager.bulkTranslate(selectedItems, targetLocale, 'current-user-id');
      await loadData();
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to bulk translate:', error);
    }
  };

  const getStatusIcon = (status: TranslatableContent['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'translated':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TranslatableContent['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'translated':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredContent = content.filter(item =>
    searchQuery === '' ||
    item.originalContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.translatedContent?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('translation.dashboard')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('translation.dashboardDescription')}
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('translation.newRequest')}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('translation.totalContent')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalContent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('translation.translated')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.translatedContent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('translation.pending')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingTranslations.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('translation.completion')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completionPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locale Progress */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('translation.progressByLanguage')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locales.map(locale => {
              const localeStats = stats.byLocale[locale];
              return (
                <div key={locale} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{localeFlags[locale]}</span>
                    <div>
                      <p className="font-medium text-gray-900">{localeNames[locale]}</p>
                      <p className="text-sm text-gray-600">
                        {localeStats.translated + localeStats.approved} / {localeStats.total}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {localeStats.completion.toFixed(1)}%
                    </p>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${localeStats.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search')}
            </label>
            <input
              type="text"
              placeholder={t('translation.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('translation.language')}
            </label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value as Locale | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('translation.allLanguages')}</option>
              {locales.map(locale => (
                <option key={locale} value={locale}>
                  {localeFlags[locale]} {localeNames[locale]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('translation.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TranslatableContent['status'] | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('translation.allStatuses')}</option>
              <option value="pending">{t('translation.pending')}</option>
              <option value="translated">{t('translation.translated')}</option>
              <option value="approved">{t('translation.approved')}</option>
              <option value="rejected">{t('translation.rejected')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('translation.bulkActions')}
            </label>
            <div className="flex space-x-2">
              {locales.map(locale => (
                <button
                  key={locale}
                  onClick={() => handleBulkTranslate(locale)}
                  disabled={selectedItems.length === 0}
                  className="flex items-center px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={`Translate to ${localeNames[locale]}`}
                >
                  {localeFlags[locale]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('translation.translationContent')}
          </h3>
          {selectedItems.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {t('translation.selectedItems', { count: selectedItems.length })}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredContent.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('translation.content')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('translation.language')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('translation.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('translation.lastUpdated')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.originalContent}
                      </p>
                      {item.translatedContent && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {item.translatedContent}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {item.table}.{item.field}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{localeFlags[item.locale]}</span>
                      <span className="text-sm text-gray-900">{localeNames[item.locale]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className={`ml-2 ${getStatusBadge(item.status)}`}>
                        {t(`translation.status.${item.status}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900 transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {item.status === 'translated' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <LanguageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('translation.noContent')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('translation.noContentDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}