'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe,
  RefreshCw as Refresh,
  Download,
  Settings
} from 'lucide-react';

interface VisibilityMetrics {
  total: number;
  p0Issues: number;
  p1Issues: number;
  p2Issues: number;
  okChecks: number;
  avgResponseTime: number;
  uniqueUrls: number;
  uniqueUserAgents: number;
  topIssues: string[];
}

interface VisibilityResult {
  url: string;
  userAgent: string;
  timestamp: string;
  statusCode: number;
  responseTime: number;
  severity: string;
  issues: string[];
}

export default function AIVisibilityDashboard() {
  const [metrics, setMetrics] = useState<VisibilityMetrics | null>(null);
  const [results, setResults] = useState<VisibilityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    loadLatestResults();
  }, []);

  const loadLatestResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ai-visibility/latest');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.summary);
        setResults(data.results || []);
        setLastCheck(data.lastCheck);
      }
    } catch (error) {
      logger.error('Error loading results', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async (dryRun = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ai-visibility/run', {
        method: dryRun ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'test'}`
        },
        body: dryRun ? undefined : JSON.stringify({ dryRun: false })
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.summary);
        setResults(data.results || []);
        setLastCheck(new Date().toISOString());
      } else {
        logger.error('Check failed:', response.statusText);
      }
    } catch (error) {
      logger.error('Error running check', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0': return 'text-red-600 bg-red-50';
      case 'P1': return 'text-orange-600 bg-orange-50';
      case 'P2': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'P0': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'P1': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'P2': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                AI Visibility Guard
              </h1>
              <p className="text-gray-600 mt-2">
                Monitoring AI crawler access and content protection
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => runCheck(true)} 
                disabled={loading}
                variant="outline"
              >
                <Activity className="h-4 w-4 mr-2" />
                Dry Run
              </Button>
              <Button 
                onClick={() => runCheck(false)} 
                disabled={loading}
              >
                <Refresh className="h-4 w-4 mr-2" />
                {loading ? 'Running...' : 'Run Check'}
              </Button>
            </div>
          </div>
          {lastCheck && (
            <p className="text-sm text-gray-500 mt-2">
              Last check: {new Date(lastCheck).toLocaleString()}
            </p>
          )}
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.p0Issues}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">P0 - Immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Important Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.p1Issues}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">P1 - Should fix soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minor Issues</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.p2Issues}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">P2 - Optimize when possible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthy Checks</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.okChecks}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">No issues detected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                <p className="text-xs text-[var(--color-text-secondary)]">Average across all checks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">URLs Monitored</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.uniqueUrls}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">Unique endpoints checked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.uniqueUserAgents}</div>
                <p className="text-xs text-[var(--color-text-secondary)]">Different crawlers tested</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Issues */}
        {metrics && metrics.topIssues.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Most Common Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.topIssues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Detailed Check Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(result.severity)}
                          <span className="font-medium">{result.url}</span>
                          <span className="text-sm text-gray-600">({result.userAgent})</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(result.severity)}`}>
                            {result.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Status: {result.statusCode} | Response: {result.responseTime}ms
                        </div>
                        {result.issues && result.issues.length > 0 && (
                          <div className="space-y-1">
                            {result.issues.map((issue, issueIndex) => (
                              <div key={issueIndex} className="text-sm text-gray-700 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading results...' : 'No results available. Run a check to see data.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}