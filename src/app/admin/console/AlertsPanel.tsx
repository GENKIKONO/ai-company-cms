/**
 * AIOHub P3-1: Super Admin Console - Alerts Panel (VIEW準拠版)
 * 
 * VIEW: admin_alerts_latest_v1 対応：
 * - message は VIEW で投影済み（details からの抽出不要）
 * - event_type / severity は DB値準拠
 * - フィルタリングは VIEWフィールド名に対応
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { 
  AdminAlertEvent,
  AdminAlertFilters
} from '@/types/admin-console';
import { getSeverityVariant } from '@/types/admin-console';

interface AlertsPanelProps {
  alerts: AdminAlertEvent[];
  stats: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent24h: number;
  };
  isPreview?: boolean;
}

export default function AlertsPanel({ alerts, stats, isPreview = false }: AlertsPanelProps) {
  const [filters, setFilters] = useState<AdminAlertFilters>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // VIEW フィールド名に対応したフィルタリング
  const filteredAlerts = alerts.filter(alert => {
    if (filters.eventType && alert.event_type !== filters.eventType) return false;
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.dateFrom && alert.created_at < filters.dateFrom) return false;
    if (filters.dateTo && alert.created_at > filters.dateTo) return false;
    return true;
  });

  // Severity バッジの設定（VIEW値対応）
  const getSeverityBadge = (severity: string) => {
    const variant = getSeverityVariant(severity);
    const configs = {
      info: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Warning' },
      critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' }
    };
    
    const config = configs[variant];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // フィルタ用の一意値を取得（VIEW フィールド名準拠）
  const availableEventTypes = Array.from(new Set(alerts.map(alert => alert.event_type)));
  const availableSeverities = Array.from(new Set(alerts.map(alert => alert.severity)));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isPreview ? 'Recent Alerts' : 'System Alerts'}
            </h3>
            <p className="text-sm text-gray-500">
              {stats.total} total, {stats.recent24h} in last 24h
            </p>
          </div>
          {!isPreview && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
              View All Alerts
            </button>
          )}
        </div>

        {/* 統計サマリー（stats は既存ロジックを流用） */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.bySeverity['info'] || 0}
            </div>
            <div className="text-xs text-gray-500">Info</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.bySeverity['warning'] || 0}
            </div>
            <div className="text-xs text-gray-500">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.bySeverity['critical'] || 0}
            </div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
        </div>
      </div>

      {!isPreview && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Event Type フィルタ（VIEW フィールド名準拠） */}
            <select 
              value={filters.eventType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Event Types</option>
              {availableEventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Severity フィルタ（DB値準拠） */}
            <select 
              value={filters.severity || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              {availableSeverities.map(severity => (
                <option key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>

            {/* 日付フィルタ */}
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="From"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="To"
            />

            {/* フィルタリセット */}
            <button
              onClick={() => setFilters({})}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No alerts found</p>
          </div>
        ) : (
          filteredAlerts.slice(0, isPreview ? 5 : undefined).map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-sm font-medium text-gray-900">{alert.event_type}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(alert.created_at), 'MMM d, HH:mm', { locale: ja })}
                    </span>
                  </div>
                  
                  {/* VIEW から投影済みの message を表示 */}
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {alert.message}
                  </p>

                  {/* Event Key 表示（あれば） */}
                  {alert.event_key && (
                    <div className="mt-1 text-xs text-gray-500">
                      Key: <code className="bg-gray-100 px-1 rounded">{alert.event_key}</code>
                    </div>
                  )}

                  {showDetails === alert.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                      <div className="mb-2">
                        <span className="font-medium">Alert ID:</span> {alert.id}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Created:</span> {format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                      {alert.source_table && (
                        <div className="mb-2">
                          <span className="font-medium">Source:</span> {alert.source_table}
                        </div>
                      )}
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div>
                          <span className="font-medium">Details:</span>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center ml-4">
                  <button
                    onClick={() => setShowDetails(showDetails === alert.id ? null : alert.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showDetails === alert.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isPreview && filteredAlerts.length > 5 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All {filteredAlerts.length} Alerts
          </button>
        </div>
      )}
    </div>
  );
}