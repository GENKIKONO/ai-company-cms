import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/config/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      issues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[],
      billing_system: {
        configured: false,
        environment_variables: {
          missing: [] as string[],
          stripe_mode: 'unknown'
        },
        stripe_integration: {},
        database_schema: {
          organizations_table: { has_stripe_columns: false, error: null as string | null },
          resource_tables: { services: false, posts: false, case_studies: false, faqs: false }
        },
        api_endpoints: {},
        plan_limits: {},
      }
    };

    // 1. Environment Variables Check
    const envVars = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_BASIC: !!process.env.STRIPE_PRICE_BASIC,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    diagnostics.billing_system.environment_variables = {
      ...envVars,
      missing: Object.entries(envVars).filter(([_, value]) => !value).map(([key, _]) => key),
      stripe_mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 
                  process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'unknown'
    };

    if (envVars.STRIPE_SECRET_KEY && envVars.STRIPE_PUBLISHABLE_KEY) {
      diagnostics.billing_system.configured = true;
    } else {
      diagnostics.issues.push('Missing required Stripe environment variables');
      diagnostics.overall_status = 'degraded';
    }

    if (!envVars.STRIPE_WEBHOOK_SECRET) {
      diagnostics.warnings.push('STRIPE_WEBHOOK_SECRET not configured - webhooks will not be verified');
    }

    // 2. Stripe Integration Check
    try {
      const stripeResponse = await fetch('/api/diag/stripe');
      if (stripeResponse.ok) {
        diagnostics.billing_system.stripe_integration = await stripeResponse.json();
      } else {
        diagnostics.issues.push('Stripe diagnostic API failed');
      }
    } catch (error) {
      diagnostics.issues.push(`Stripe integration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Database Schema Check
    try {
      const supabase = await createClient();
      
      // Check if organizations table has Stripe columns
      const { data: orgColumns, error: orgError } = await supabase
        .from('organizations')
        .select('stripe_customer_id, stripe_subscription_id, plan, subscription_status, current_period_end')
        .limit(1);

      diagnostics.billing_system.database_schema.organizations_table = {
        has_stripe_columns: !orgError,
        error: orgError?.message || null
      };

      if (orgError) {
        diagnostics.issues.push(`Organizations table missing Stripe columns: ${orgError.message}`);
        diagnostics.overall_status = 'critical';
      }

      // Check if we can query billing-related tables
      const tableChecks = await Promise.allSettled([
        supabase.from('services').select('id', { count: 'exact' }).limit(1),
        supabase.from('posts').select('id', { count: 'exact' }).limit(1),
        supabase.from('case_studies').select('id', { count: 'exact' }).limit(1),
        supabase.from('faqs').select('id', { count: 'exact' }).limit(1)
      ]);

      diagnostics.billing_system.database_schema.resource_tables = {
        services: tableChecks[0].status === 'fulfilled',
        posts: tableChecks[1].status === 'fulfilled', 
        case_studies: tableChecks[2].status === 'fulfilled',
        faqs: tableChecks[3].status === 'fulfilled'
      };

    } catch (error) {
      diagnostics.issues.push(`Database schema check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      diagnostics.overall_status = 'critical';
    }

    // 4. API Endpoints Health Check
    const apiEndpoints = [
      '/api/billing/checkout',
      '/api/billing/portal', 
      '/api/stripe/webhook'
    ];

    const endpointResults: Record<string, any> = {};
    for (const endpoint of apiEndpoints) {
      try {
        // Do a basic OPTIONS request to check if endpoint exists
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
          method: 'OPTIONS',
        });
        endpointResults[endpoint] = {
          exists: response.status !== 404,
          status: response.status
        };
      } catch (error) {
        endpointResults[endpoint] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    diagnostics.billing_system.api_endpoints = endpointResults;

    // 5. Plan Limits Configuration
    diagnostics.billing_system.plan_limits = {
      configured: !!PLAN_LIMITS,
      plans: Object.keys(PLAN_LIMITS),
      limits: PLAN_LIMITS
    };

    // 6. Overall Health Assessment
    if (diagnostics.issues.length === 0) {
      diagnostics.overall_status = 'healthy';
    } else if (diagnostics.issues.some(issue => issue.includes('critical') || issue.includes('missing'))) {
      diagnostics.overall_status = 'critical';
    } else {
      diagnostics.overall_status = 'degraded';
    }

    // 7. Recommendations
    const recommendations: string[] = [];
    if (!envVars.STRIPE_WEBHOOK_SECRET) {
      recommendations.push('Configure STRIPE_WEBHOOK_SECRET for secure webhook handling');
    }
    if (!envVars.STRIPE_PRICE_BASIC) {
      recommendations.push('Configure STRIPE_PRICE_BASIC for subscription creation');
    }
    if (diagnostics.billing_system.environment_variables.stripe_mode === 'test') {
      recommendations.push('Using Stripe test mode - remember to switch to live keys for production');
    }

    diagnostics.recommendations = recommendations;

    return NextResponse.json(diagnostics);

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Billing diagnostics failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        overall_status: 'critical'
      },
      { status: 500 }
    );
  }
}