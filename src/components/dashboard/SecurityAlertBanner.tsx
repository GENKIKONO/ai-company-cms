'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AlertData {
  key: string;
  value: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'normal';
  threshold?: number;
}

interface SecurityAlertBannerProps {
  className?: string;
}

export function SecurityAlertBanner({ className = '' }: SecurityAlertBannerProps) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user dismissed the banner in this session
    const dismissedKey = 'security_alert_dismissed';
    const dismissedAt = sessionStorage.getItem(dismissedKey);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      // Allow re-show after 30 minutes
      if (Date.now() - dismissedTime < 30 * 60 * 1000) {
        setDismissed(true);
        setLoading(false);
        return;
      }
    }

    async function fetchAlerts() {
      try {
        const response = await fetch('/api/admin/alerts/dashboard?range=1w');
        if (!response.ok) {
          // Non-admin users will get 403, silently ignore
          setLoading(false);
          return;
        }
        const json = await response.json();
        if (json.success && json.data?.cards) {
          // Filter only critical/high severity alerts
          const criticalAlerts = json.data.cards.filter(
            (card: AlertData) => card.severity === 'critical' || card.severity === 'high'
          );
          setAlerts(criticalAlerts);
        }
      } catch (e) {
        // Silently fail - this is a non-critical feature
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('security_alert_dismissed', Date.now().toString());
  };

  // Don't render anything if loading, dismissed, or no critical alerts
  if (loading || dismissed || alerts.length === 0) {
    return null;
  }

  const getAlertLabel = (key: string) => {
    const labels: Record<string, string> = {
      intrusion_alerts: '侵入検知アラート',
      rls_denied: 'RLS拒否イベント',
      job_failure_rate: 'ジョブ失敗率',
      webhook_error_rate: 'Webhookエラー率',
    };
    return labels[key] || key;
  };

  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const bgColor = hasCritical
    ? 'bg-red-600'
    : 'bg-orange-500';
  const Icon = hasCritical ? ShieldExclamationIcon : ExclamationTriangleIcon;

  return (
    <div className={`${bgColor} text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium">
                {hasCritical ? 'セキュリティ警告' : '注意が必要な項目'}
              </span>
              {alerts.map((alert) => (
                <span
                  key={alert.key}
                  className="text-sm bg-white/20 px-2 py-0.5 rounded"
                >
                  {getAlertLabel(alert.key)}: {alert.key.includes('rate') ? `${alert.value}%` : alert.value}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/security"
              className="text-sm font-medium hover:underline"
            >
              詳細を確認
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded"
              aria-label="閉じる"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityAlertBanner;
