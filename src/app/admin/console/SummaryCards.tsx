/**
 * AIOHub P3-1: Super Admin Console - Summary Cards
 * 
 * admin_summary_today_v1 からのデータ表示
 */

'use client';

import React from 'react';
import type { AdminConsoleSummary } from '@/types/admin-console';

interface SummaryCardsProps {
  summary: AdminConsoleSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Today Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-3-8h8m-8 4h8M3 7V3h4" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Alerts Today</p>
            <p className="text-2xl font-bold text-gray-900">{summary.todayAlerts.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">Total alerts since midnight</span>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
            <p className="text-2xl font-bold text-red-600">{summary.criticalAlertsToday.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">High priority issues today</span>
          </div>
        </div>
      </div>

      {/* Failed Jobs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Failed Jobs (24h)</p>
            <p className="text-2xl font-bold text-orange-600">{summary.failedJobsLast24h.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">Jobs with error status</span>
          </div>
        </div>
      </div>

      {/* Slow Queries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Slow Queries</p>
            <p className="text-2xl font-bold text-purple-600">{summary.slowQueriesCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">
              {summary.slowQueriesCount === 0 ? 'Feature coming soon' : 'Performance issues detected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}