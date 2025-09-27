import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { healthCheck } from '@/lib/monitoring';
import { SentryUtils } from '@/lib/utils/sentry-utils';

interface DetailedSystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    supabase: {
      status: boolean;
      responseTime?: number;
      details?: string;
    };
    stripe: {
      status: boolean;
      responseTime?: number;
      details?: string;
      configured?: boolean;
      mode?: 'test' | 'live' | 'unknown';
    };
    resend: {
      status: boolean;
      responseTime?: number;
      details?: string;
    };
    database: {
      status: boolean;
      responseTime?: number;
      connectionCount?: number;
      details?: string;
    };
    auth: {
      status: boolean;
      responseTime?: number;
      details?: string;
    };
  };
  metrics: {
    totalUsers?: number;
    totalOrganizations?: number;
    totalPosts?: number;
    webhookEvents24h?: number;
    errorRate24h?: number;
  };
  systemInfo: {
    nodeVersion: string;
    nextVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
    environment: Record<string, string>;
  };
}

async function getDetailedStatus(): Promise<DetailedSystemStatus> {
  const startTime = Date.now();
  const checks: DetailedSystemStatus['checks'] = {
    supabase: { status: false },
    stripe: { status: false },
    resend: { status: false },
    database: { status: false },
    auth: { status: false },
  };

  try {
    // Basic health check
    const basicHealth = await healthCheck();
    
    // Enhanced Supabase checks
    const supabaseStart = Date.now();
    try {
      const supabase = await supabaseServer();
      
      // Test database connection
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      checks.supabase = {
        status: !error,
        responseTime: Date.now() - supabaseStart,
        details: error ? error.message : 'Connected'
      };

      checks.database = {
        status: !error,
        responseTime: Date.now() - supabaseStart,
        details: error ? error.message : 'Database accessible'
      };

      // Test auth service
      const authStart = Date.now();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      checks.auth = {
        status: !authError || authError.message.includes('JWT'),
        responseTime: Date.now() - authStart,
        details: authError ? 'Auth service responding' : 'Auth service healthy'
      };

    } catch (error) {
      checks.supabase.details = error instanceof Error ? error.message : 'Connection failed';
      checks.database.details = 'Database connection failed';
    }

    // Stripe check with timing and configuration diagnostics
    const stripeStart = Date.now();
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
        
        // Stripeモード検出
        const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
        const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
        const mode = isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown';
        
        // タイムアウト付きでAPI呼び出し
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stripe API timeout')), 5000)
        );
        
        await Promise.race([
          stripeClient.products.list({ limit: 1 }),
          timeoutPromise
        ]);
        
        checks.stripe = {
          status: true,
          responseTime: Date.now() - stripeStart,
          details: `API accessible (${mode} mode)`,
          configured: true,
          mode
        };
      } else {
        checks.stripe = {
          status: true, // 設定されていなくても健康とみなす
          details: 'STRIPE_SECRET_KEY not configured (optional)',
          configured: false,
          mode: 'unknown'
        };
      }
    } catch (error) {
      const isConfigured = !!process.env.STRIPE_SECRET_KEY;
      const mode = isConfigured 
        ? (process.env.STRIPE_SECRET_KEY!.startsWith('sk_test_') ? 'test' : 
           process.env.STRIPE_SECRET_KEY!.startsWith('sk_live_') ? 'live' : 'unknown')
        : 'unknown';
        
      checks.stripe = {
        status: false,
        responseTime: Date.now() - stripeStart,
        details: error instanceof Error ? error.message : 'API call failed',
        configured: isConfigured,
        mode
      };
    }

    // Resend check with timing
    const resendStart = Date.now();
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.domains.list();
        checks.resend = {
          status: true,
          responseTime: Date.now() - resendStart,
          details: 'API accessible'
        };
      } else {
        checks.resend = {
          status: false,
          details: 'RESEND_API_KEY not configured'
        };
      }
    } catch (error) {
      checks.resend = {
        status: false,
        responseTime: Date.now() - resendStart,
        details: error instanceof Error ? error.message : 'API call failed'
      };
    }

    // Collect metrics
    const metrics: DetailedSystemStatus['metrics'] = {};
    try {
      const supabase = await supabaseServer();
      
      // Count users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      metrics.totalUsers = userCount || 0;

      // Count organizations
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      metrics.totalOrganizations = orgCount || 0;

      // Count posts
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      metrics.totalPosts = postCount || 0;

      // Count webhook events in last 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: webhookCount } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday);
      metrics.webhookEvents24h = webhookCount || 0;

    } catch (error) {
      SentryUtils.captureException(error instanceof Error ? error : new Error('Failed to collect metrics'));
    }

    // Determine overall status
    const healthyCount = Object.values(checks).filter(check => check.status).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) {
      status = 'healthy';
    } else if (healthyCount >= totalChecks * 0.6) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      uptime: process.uptime(),
      checks,
      metrics,
      systemInfo: {
        nodeVersion: process.version,
        nextVersion: '15.5.3',
        memoryUsage: process.memoryUsage(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'unknown',
          NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
          VERCEL_ENV: process.env.VERCEL_ENV || 'unknown',
        }
      }
    };

  } catch (error) {
    SentryUtils.captureException(error instanceof Error ? error : new Error('Status check failed'));
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      uptime: process.uptime(),
      checks,
      metrics: {},
      systemInfo: {
        nodeVersion: process.version,
        nextVersion: '15.5.3',
        memoryUsage: process.memoryUsage(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'unknown',
        }
      }
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check - require valid session
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Optional: Additional authorization check for admin users
    // You could check user roles here if needed
    
    const status = await getDetailedStatus();
    
    const httpStatus = status.status === 'healthy' ? 200 : 
                      status.status === 'degraded' ? 206 : 503;

    return NextResponse.json(status, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    SentryUtils.captureException(error instanceof Error ? error : new Error('Status endpoint failed'));
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}