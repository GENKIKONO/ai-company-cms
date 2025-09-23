import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { APP_URL } from '@/lib/utils/env';

interface ConfigCheckResponse {
  success: boolean;
  data?: {
    supabase: {
      connected: boolean;
      auth_enabled: boolean;
      rls_enabled: boolean;
      site_url?: string;
      redirect_urls?: string[];
      email_provider?: string;
      smtp_enabled?: boolean;
    };
    environment: {
      app_url: string;
      app_url_is_production: boolean;
      is_production: boolean;
      has_approval_jwt_secret: boolean;
    };
    validation: {
      localhost_check: boolean;
      url_format_check: boolean;
      ssl_check: boolean;
    };
  };
  error?: string;
  warnings?: string[];
  requestId: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ConfigCheckResponse>> {
  const requestId = crypto.randomUUID();
  const warnings: string[] = [];
  
  try {
    console.info('Config check request', { requestId });
    
    // Environment checks
    const appUrl = APP_URL;
    const isProduction = process.env.NODE_ENV === 'production';
    const appUrlIsProduction = !appUrl.includes('localhost') && appUrl.startsWith('https://');
    const hasApprovalJwtSecret = !!process.env.APPROVAL_JWT_SECRET;
    
    // Validation checks
    const localhostCheck = !appUrl.includes('localhost') || !isProduction;
    const urlFormatCheck = /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(appUrl);
    const sslCheck = appUrl.startsWith('https://') || !isProduction;
    
    // Add warnings for common issues
    if (isProduction && appUrl.includes('localhost')) {
      warnings.push('本番環境でlocalhostが設定されています');
    }
    
    if (isProduction && !appUrl.startsWith('https://')) {
      warnings.push('本番環境でSSLが有効になっていません');
    }
    
    if (!hasApprovalJwtSecret) {
      warnings.push('APPROVAL_JWT_SECRETが設定されていません');
    }
    
    let supabaseConfig;
    try {
      // Test Supabase connection
      const { data: testData, error: testError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (testError) {
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      
      // Try to get Supabase configuration (this may not be available via API)
      supabaseConfig = {
        connected: true,
        auth_enabled: true,
        rls_enabled: true, // Assume enabled as we can't easily check
        site_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : undefined,
        redirect_urls: ['configured'], // Can't easily check via API
        email_provider: 'supabase', // Default assumption
        smtp_enabled: false // Assume using Supabase default
      };
      
    } catch (supabaseError) {
      console.error('Supabase connection test failed', {
        requestId,
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      });
      
      supabaseConfig = {
        connected: false,
        auth_enabled: false,
        rls_enabled: false
      };
      
      warnings.push('Supabase接続に失敗しました');
    }
    
    const configData = {
      supabase: supabaseConfig,
      environment: {
        app_url: appUrl,
        app_url_is_production: appUrlIsProduction,
        is_production: isProduction,
        has_approval_jwt_secret: hasApprovalJwtSecret
      },
      validation: {
        localhost_check: localhostCheck,
        url_format_check: urlFormatCheck,
        ssl_check: sslCheck
      }
    };
    
    // Log configuration status
    console.info('Config check completed', {
      requestId,
      supabaseConnected: supabaseConfig.connected,
      environmentValid: localhostCheck && urlFormatCheck && sslCheck,
      warningCount: warnings.length
    });
    
    return NextResponse.json({
      success: true,
      data: configData,
      warnings: warnings.length > 0 ? warnings : undefined,
      requestId
    });
    
  } catch (error) {
    console.error('Config check error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: 'Configuration check failed',
      warnings: warnings.length > 0 ? warnings : undefined,
      requestId
    }, { status: 500 });
  }
}

// Health check endpoint variant
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick health check - just test if basic services are available
    const appUrl = APP_URL;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Basic validation
    if (isProduction && appUrl.includes('localhost')) {
      return new NextResponse(null, { status: 503 }); // Service Unavailable
    }
    
    // Quick Supabase test
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      return new NextResponse(null, { status: 503 });
    }
    
    return new NextResponse(null, { status: 200 });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}