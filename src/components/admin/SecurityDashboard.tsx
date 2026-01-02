'use client';

import { useState, useEffect , useCallback} from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Activity, Users, Ban, Eye } from 'lucide-react';

import { logger } from '@/lib/log';
// Types
interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  activeThreats: number;
  topAttackers: Array<{ ip: string; count: number; risk: string }>;
  recentIncidents: Array<{
    id: string;
    ip_address: string;
    incident_type: string;
    risk_level: string;
    created_at: string;
    blocked: boolean;
  }>;
  rateLimitStats: {
    totalRequests: number;
    blockedRequests: number;
    topPaths: Array<{ path: string; count: number }>;
  };
}

interface ServiceRoleStats {
  totalOperations: number;
  highRiskOperations: number;
  recentAnomalies: Array<{
    type: string;
    severity: string;
    details: any;
  }>;
}

interface WritePathMeta {
  table_name: string;
  function_name: string;
  code_lines: string;
  callers: string[];
  created_at_explicit: boolean;
  required_role: string;
  notes: string;
}

interface RateLimitMetrics {
  write_paths_meta: WritePathMeta[];
  rate_limit_requests: {
    period_minutes: number;
    total_count: number;
    suspicious_count: number;
    recent_5min_count: number;
  };
  rate_limit_logs: {
    period_minutes: number;
    total_count: number;
    top_ips: Array<{ ip: string; count: number; botCount: number }>;
  };
  security_incidents: {
    period_hours: number;
    total_count: number;
    by_risk_level: Record<string, number>;
    by_incident_type: Record<string, number>;
  };
  health: {
    window_minutes: number;
    insert_failure_rate_pct: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [serviceRoleStats, setServiceRoleStats] = useState<ServiceRoleStats | null>(null);
  const [rateLimitMetrics, setRateLimitMetrics] = useState<RateLimitMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('incidents');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSecurityMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get security incidents
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('id, ip_address, incident_type, severity, risk_level, blocked, metadata, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false });

      // Get rate limit requests
      const { data: rateLimitRequests } = await supabase
        .from('rate_limit_requests')
        .select('id, ip_address, endpoint, path, is_suspicious, created_at')
        .gte('created_at', oneHourAgo.toISOString());

      // Calculate metrics
      const totalRequests = rateLimitRequests?.length || 0;
      const blockedRequests = incidents?.filter(i => i.blocked).length || 0;
      const suspiciousActivity = rateLimitRequests?.filter(r => r.is_suspicious).length || 0;

      // Top attackers
      const ipCounts: Record<string, { count: number; risk: string }> = {};
      incidents?.forEach(incident => {
        const ip = incident.ip_address;
        if (!ipCounts[ip]) {
          ipCounts[ip] = { count: 0, risk: incident.risk_level };
        }
        ipCounts[ip].count++;
        // Update to highest risk level
        if (getRiskPriority(incident.risk_level) > getRiskPriority(ipCounts[ip].risk)) {
          ipCounts[ip].risk = incident.risk_level;
        }
      });

      const topAttackers = Object.entries(ipCounts)
        .map(([ip, data]) => ({ ip, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top paths
      const pathCounts: Record<string, number> = {};
      rateLimitRequests?.forEach(req => {
        pathCounts[req.path] = (pathCounts[req.path] || 0) + 1;
      });

      const topPaths = Object.entries(pathCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMetrics({
        totalRequests,
        blockedRequests,
        suspiciousActivity,
        activeThreats: topAttackers.filter(a => a.risk === 'critical' || a.risk === 'high').length,
        topAttackers,
        recentIncidents: incidents?.slice(0, 20) || [],
        rateLimitStats: {
          totalRequests,
          blockedRequests,
          topPaths
        }
      });

    } catch (error) {
      logger.error('Error fetching security metrics:', { data: error });
    }
  }, [supabase]);

  const fetchServiceRoleStats = useCallback(async () => {
    try {
      // Call the service role usage stats function
      const { data: stats, error } = await supabase.rpc('get_service_role_usage_stats');
      
      if (error) {
        logger.error('Error fetching service role stats:', { data: error });
        return;
      }

      // Call anomaly detection
      const { data: anomalies, error: anomalyError } = await supabase.rpc('detect_service_role_anomalies');
      
      if (anomalyError) {
        logger.error('Error fetching anomalies:', { data: anomalyError });
        return;
      }

      setServiceRoleStats({
        totalOperations: stats?.summary?.total_operations || 0,
        highRiskOperations: stats?.summary?.high_risk_operations || 0,
        recentAnomalies: anomalies?.anomalies || []
      });

    } catch (error) {
      logger.error('Error fetching service role stats:', { data: error });
    }
  }, [supabase]);

  const fetchRateLimitMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rate-limit-metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRateLimitMetrics(data.data);
        }
      }
    } catch (error) {
      logger.error('Error fetching rate limit metrics:', { data: error });
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSecurityMetrics(),
      fetchServiceRoleStats(),
      fetchRateLimitMetrics()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [fetchSecurityMetrics, fetchServiceRoleStats, fetchRateLimitMetrics]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllData, autoRefresh]);

  const getRiskPriority = (risk: string): number => {
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorities[risk as keyof typeof priorities] || 0;
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      critical: 'destructive' as const,
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return colors[risk as keyof typeof colors] || 'outline';
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={fetchAllData} size="sm" disabled={loading}>
            <Eye className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-[var(--aio-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRequests || 0}</div>
            <p className="text-xs text-gray-600">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.blockedRequests || 0}</div>
            <p className="text-xs text-gray-600">Security incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.suspiciousActivity || 0}</div>
            <p className="text-xs text-gray-600">Flagged requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics?.activeThreats || 0}</div>
            <p className="text-xs text-gray-600">High/Critical risk IPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="attackers">Top Attackers</TabsTrigger>
          <TabsTrigger value="service-role">Service Role Monitoring</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="db-write-paths">DB Write Paths</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getRiskColor(incident.risk_level)}>
                        {incident.risk_level}
                      </Badge>
                      <div>
                        <p className="font-medium">{incident.incident_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">IP: {incident.ip_address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatTime(incident.created_at)}</p>
                      <Badge variant={incident.blocked ? "destructive" : "secondary"}>
                        {incident.blocked ? "Blocked" : "Allowed"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!metrics?.recentIncidents || metrics.recentIncidents.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent incidents</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attackers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Attacking IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.topAttackers.map((attacker, index) => (
                  <div key={attacker.ip} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{attacker.ip}</p>
                        <p className="text-sm text-gray-600">{attacker.count} incidents</p>
                      </div>
                    </div>
                    <Badge variant={getRiskColor(attacker.risk)}>
                      {attacker.risk}
                    </Badge>
                  </div>
                ))}
                {(!metrics?.topAttackers || metrics.topAttackers.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No attacking IPs detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-role" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Role Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Operations</p>
                    <p className="text-2xl font-bold">{serviceRoleStats?.totalOperations || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">High Risk Operations</p>
                    <p className="text-2xl font-bold text-red-600">{serviceRoleStats?.highRiskOperations || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceRoleStats?.recentAnomalies.map((anomaly, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{anomaly.type.replace(/_/g, ' ')}</p>
                        <Badge variant={getRiskColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!serviceRoleStats?.recentAnomalies || serviceRoleStats.recentAnomalies.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No anomalies detected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top Requested Paths</h4>
                  <div className="space-y-2">
                    {metrics?.rateLimitStats.topPaths.map((path, index) => (
                      <div key={path.path} className="flex items-center justify-between">
                        <span className="text-sm font-mono">{path.path}</span>
                        <Badge variant="outline">{path.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="db-write-paths" className="space-y-4">
          {/* Health Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health (5min window)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    rateLimitMetrics?.health.status === 'healthy'
                      ? 'outline'
                      : rateLimitMetrics?.health.status === 'warning'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="text-lg px-4 py-2"
                >
                  {rateLimitMetrics?.health.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                <span className="text-sm text-gray-600">
                  INSERT Failure Rate: {rateLimitMetrics?.health.insert_failure_rate_pct || 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Write Paths Meta */}
          <Card>
            <CardHeader>
              <CardTitle>DB Write Path Mapping (middleware.ts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Table</th>
                      <th className="text-left py-2 px-3">Function</th>
                      <th className="text-left py-2 px-3">Lines</th>
                      <th className="text-left py-2 px-3">Callers</th>
                      <th className="text-left py-2 px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateLimitMetrics?.write_paths_meta.map((meta) => (
                      <tr key={meta.table_name} className="border-b">
                        <td className="py-2 px-3 font-mono text-xs">{meta.table_name}</td>
                        <td className="py-2 px-3 font-mono text-xs">{meta.function_name}()</td>
                        <td className="py-2 px-3">{meta.code_lines}</td>
                        <td className="py-2 px-3 text-xs">{meta.callers.join(', ')}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline">{meta.required_role}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rate Limit Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">rate_limit_requests</CardTitle>
                <p className="text-xs text-gray-500">
                  Last {rateLimitMetrics?.rate_limit_requests.period_minutes || 15} minutes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-bold">
                      {rateLimitMetrics?.rate_limit_requests.total_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suspicious</span>
                    <span className="font-bold text-yellow-600">
                      {rateLimitMetrics?.rate_limit_requests.suspicious_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent (5min)</span>
                    <span className="font-bold">
                      {rateLimitMetrics?.rate_limit_requests.recent_5min_count || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limit Logs Top IPs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">rate_limit_logs Top IPs</CardTitle>
                <p className="text-xs text-gray-500">
                  Last {rateLimitMetrics?.rate_limit_logs.period_minutes || 10} minutes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {rateLimitMetrics?.rate_limit_logs.top_ips.slice(0, 5).map((ip) => (
                    <div key={ip.ip} className="flex justify-between text-sm">
                      <span className="font-mono truncate">{ip.ip}</span>
                      <span>
                        {ip.count} {ip.botCount > 0 && <span className="text-xs text-gray-500">(🤖{ip.botCount})</span>}
                      </span>
                    </div>
                  ))}
                  {(!rateLimitMetrics?.rate_limit_logs.top_ips?.length) && (
                    <p className="text-gray-500 text-sm">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Incidents by Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">security_incidents</CardTitle>
                <p className="text-xs text-gray-500">
                  Last {rateLimitMetrics?.security_incidents.period_hours || 24} hours
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(rateLimitMetrics?.security_incidents.by_risk_level || {}).map(
                    ([risk, count]) => (
                      <div key={risk} className="flex justify-between">
                        <Badge variant={getRiskColor(risk)}>{risk}</Badge>
                        <span className="font-bold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}