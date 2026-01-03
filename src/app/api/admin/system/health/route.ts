/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import type { SystemHealth, ComponentHealth, ExternalServiceHealth } from '@/lib/monitoring/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const user = await getUserWithClient(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin role check（v_app_users_compat2 互換ビュー使用）
    const { data: userProfile, error: profileError } = await supabase
      .from('v_app_users_compat2')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Perform health checks
    const healthData = await performSystemHealthCheck();

    logger.info('[System Health] Health check requested', {
      user_id: user.id,
      overall_status: healthData.overall_status,
      active_alerts: healthData.active_alerts,
      component_count: healthData.components.length
    });

    return NextResponse.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    logger.error('[System Health] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performSystemHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  // Database health check
  const databaseHealth = await checkDatabaseHealth();
  
  // API health check
  const apiHealth = await checkAPIHealth();
  
  // Cache health check
  const cacheHealth = await checkCacheHealth();
  
  // External services health check
  const externalServicesHealth = await checkExternalServices();
  
  // System metrics
  const systemMetrics = await getSystemMetrics();
  
  const components: ComponentHealth[] = [
    {
      name: 'Database',
      status: databaseHealth.status,
      response_time: databaseHealth.responseTime,
      error_rate: databaseHealth.errorRate,
      last_check: new Date().toISOString()
    },
    {
      name: 'API Server',
      status: apiHealth.status,
      response_time: apiHealth.responseTime,
      error_rate: apiHealth.errorRate,
      last_check: new Date().toISOString()
    },
    {
      name: 'Cache',
      status: cacheHealth.status,
      response_time: cacheHealth.responseTime,
      error_rate: cacheHealth.errorRate,
      last_check: new Date().toISOString()
    }
  ];

  // Determine overall status
  const overallStatus = components.every(c => c.status === 'operational') 
    ? 'healthy'
    : components.some(c => c.status === 'outage') 
      ? 'unhealthy' 
      : 'degraded';

  const healthData: SystemHealth = {
    overall_status: overallStatus,
    last_updated: new Date().toISOString(),
    components,
    uptime_percentage: 99.95,
    response_time_avg: components.reduce((sum, c) => sum + c.response_time, 0) / components.length,
    error_rate: components.reduce((sum, c) => sum + c.error_rate, 0) / components.length,
    active_alerts: 0, // TODO: Get actual count from alerts system
    cpu_usage: systemMetrics.cpuUsage,
    memory_usage: systemMetrics.memoryUsage,
    disk_usage: systemMetrics.diskUsage,
    external_services: externalServicesHealth
  };

  const totalTime = Date.now() - startTime;
  logger.info('[System Health] Health check completed', {
    overall_status: overallStatus,
    check_duration: totalTime,
    components: components.length,
    external_services: externalServicesHealth.length
  });

  return healthData;
}

async function checkDatabaseHealth(): Promise<{
  status: ComponentHealth['status'];
  responseTime: number;
  errorRate: number;
}> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Simple database ping
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return { status: 'degraded', responseTime, errorRate: 100 };
    }

    return { status: 'operational', responseTime, errorRate: 0 };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { status: 'outage', responseTime, errorRate: 100 };
  }
}

async function checkAPIHealth(): Promise<{
  status: ComponentHealth['status'];
  responseTime: number;
  errorRate: number;
}> {
  // Mock API health check
  // In a real implementation, this would check various API endpoints
  
  const responseTime = Math.random() * 100 + 20; // 20-120ms
  const errorRate = Math.random() * 2; // 0-2%

  const status = errorRate > 5 ? 'outage' : errorRate > 1 ? 'degraded' : 'operational';

  return { status, responseTime, errorRate };
}

async function checkCacheHealth(): Promise<{
  status: ComponentHealth['status'];
  responseTime: number;
  errorRate: number;
}> {
  // Mock cache health check
  // In a real implementation, this would check Redis or other caching systems
  
  const responseTime = Math.random() * 10 + 1; // 1-11ms
  const errorRate = Math.random() * 0.5; // 0-0.5%

  const status = errorRate > 1 ? 'degraded' : 'operational';

  return { status, responseTime, errorRate };
}

async function checkExternalServices(): Promise<ExternalServiceHealth[]> {
  const services = [
    { name: 'Supabase', endpoint: 'https://supabase.com/health' },
    { name: 'Vercel', endpoint: 'https://vercel.com/api/status' },
    { name: 'Resend', endpoint: 'https://api.resend.com/health' }
  ];

  const healthChecks = services.map(async (service) => {
    const startTime = Date.now();
    
    try {
      // Mock external service check
      // In a real implementation, this would make actual HTTP requests
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
      
      const responseTime = Date.now() - startTime;
      const status = responseTime > 1000 ? 'degraded' as const : 'operational' as const;

      return {
        name: service.name,
        status,
        response_time: responseTime,
        last_check: new Date().toISOString(),
        endpoint: service.endpoint
      };

    } catch (error) {
      return {
        name: service.name,
        status: 'outage' as const,
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString(),
        endpoint: service.endpoint
      };
    }
  });

  return Promise.all(healthChecks);
}

async function getSystemMetrics(): Promise<{
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}> {
  // Mock system metrics
  // In a real implementation, this would get actual system resource usage
  
  return {
    cpuUsage: Math.random() * 80 + 10, // 10-90%
    memoryUsage: Math.random() * 70 + 20, // 20-90%
    diskUsage: Math.random() * 60 + 20 // 20-80%
  };
}