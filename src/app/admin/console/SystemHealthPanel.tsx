/**
 * AIOHub P3-1: Super Admin Console - System Health Panel
 * 
 * システムの全体的なヘルス状態を表示するコンポーネント
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { AdminSystemHealth } from '@/types/admin-console';

interface SystemHealthPanelProps {
  health: AdminSystemHealth;
}

export default function SystemHealthPanel({ health }: SystemHealthPanelProps) {
  // ヘルス状態のスタイル設定
  const getHealthBadge = (status: 'healthy' | 'warning' | 'critical') => {
    const configs = {
      healthy: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: 'Healthy',
        icon: '●'
      },
      warning: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: 'Warning',
        icon: '▲'
      },
      critical: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: 'Critical',
        icon: '●'
      }
    };
    
    const config = configs[status];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className="mr-2">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // レスポンス時間のフォーマット
  const formatResponseTime = (ms: number) => {
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // 全体的な健康状態のスタイル
  const getOverallStatusStyle = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`rounded-lg border-2 ${getOverallStatusStyle(health.overall)} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Health</h2>
          <p className="text-sm text-gray-600 mt-1">
            Last checked: {format(new Date(health.lastChecked), 'MMM d, HH:mm:ss', { locale: ja })}
          </p>
        </div>
        <div className="text-right">
          <div className="mb-2">{getHealthBadge(health.overall)}</div>
          <button className="text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary)] font-medium">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Health */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Database</h3>
            {getHealthBadge(health.database.status)}
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span className="font-mono">{formatResponseTime(health.database.responseTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Connections:</span>
              <span className="font-mono">{health.database.activeConnections}</span>
            </div>
            {health.database.details && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                {health.database.details}
              </div>
            )}
          </div>
        </div>

        {/* Supabase Health */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Supabase</h3>
            {getHealthBadge(health.supabase.status)}
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>API Response:</span>
              <span className="font-mono">{formatResponseTime(health.supabase.apiResponseTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className={`font-medium ${
                health.supabase.storageStatus === 'healthy' 
                  ? 'text-green-600' 
                  : health.supabase.storageStatus === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {health.supabase.storageStatus}
              </span>
            </div>
            {health.supabase.details && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                {health.supabase.details}
              </div>
            )}
          </div>
        </div>

        {/* External Services Health */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">External Services</h3>
            {getHealthBadge(health.external_services.status)}
          </div>
          
          <div className="space-y-2">
            {health.external_services.services.length === 0 ? (
              <p className="text-xs text-gray-500">No external services configured</p>
            ) : (
              health.external_services.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{service.name}:</span>
                  <div className="flex items-center gap-2">
                    {service.responseTime && (
                      <span className="font-mono text-gray-500">
                        {formatResponseTime(service.responseTime)}
                      </span>
                    )}
                    <span className={`font-medium ${
                      service.status === 'healthy' 
                        ? 'text-green-600' 
                        : service.status === 'warning'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  {service.details && (
                    <div className="mt-1 text-xs text-gray-500">
                      {service.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 健康状態が critical の場合の警告 */}
      {health.overall === 'critical' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">
                Critical System Issues Detected
              </h4>
              <p className="text-sm text-red-700 mt-1">
                One or more system components are experiencing critical issues. Immediate attention required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 健康状態が warning の場合の注意 */}
      {health.overall === 'warning' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                System Performance Warning
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Some system components are showing performance degradation. Monitoring recommended.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}