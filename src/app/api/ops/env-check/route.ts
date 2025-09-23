import { NextRequest, NextResponse } from 'next/server';
import { APP_URL, getEnvironmentInfo } from '@/lib/utils/env';

/**
 * Environment Check API Endpoint
 * Provides runtime environment validation and debugging information
 * GET /api/ops/env-check
 */
export async function GET(request: NextRequest) {
  try {
    const envInfo = getEnvironmentInfo();
    
    // Security check: Only show detailed info in development or with admin key
    const adminKey = request.headers.get('x-admin-key');
    const isAuthorized = process.env.NODE_ENV === 'development' || 
      (adminKey && adminKey === process.env.ADMIN_KEY);
    
    const baseInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: envInfo.nodeEnv,
      isProduction: envInfo.isProduction,
      appUrlConfigured: !!envInfo.appUrl,
      appUrlIsProduction: envInfo.appUrl ? !envInfo.appUrl.includes('localhost') : false,
    };
    
    if (!isAuthorized) {
      return NextResponse.json({
        ...baseInfo,
        message: 'Basic environment check completed',
        note: 'Add x-admin-key header for detailed information'
      });
    }
    
    // Detailed information for authorized requests
    const detailedInfo = {
      ...baseInfo,
      environment: {
        ...envInfo,
        // Mask sensitive information
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/\/[^\.]+/, '//***') : null,
        hasSupabaseKeys: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendFromEmail: process.env.RESEND_FROM_EMAIL || null,
      },
      checks: {
        appUrlValid: true,
        productionReady: envInfo.isProduction ? !envInfo.hasLocalhostRefs : true,
        requiredVarsPresent: [
          'NEXT_PUBLIC_SUPABASE_URL',
          'SUPABASE_SERVICE_ROLE_KEY', 
          'RESEND_API_KEY',
          'NEXT_PUBLIC_APP_URL'
        ].every(key => !!process.env[key]),
        appUrlError: undefined as string | undefined
      }
    };
    
    // Test environment utility function
    try {
      const testAppUrl = APP_URL;
      detailedInfo.checks.appUrlValid = true;
    } catch (error) {
      detailedInfo.checks.appUrlValid = false;
      detailedInfo.checks.appUrlError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    const statusCode = detailedInfo.checks.productionReady && 
      detailedInfo.checks.requiredVarsPresent && 
      detailedInfo.checks.appUrlValid ? 200 : 422;
    
    return NextResponse.json(detailedInfo, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Environment check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}