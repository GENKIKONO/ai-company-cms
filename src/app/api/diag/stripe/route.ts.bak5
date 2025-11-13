import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return NextResponse.json({
        configured: false,
        mode: 'unknown',
        status: 'not_configured',
        message: 'STRIPE_SECRET_KEY environment variable is not set'
      });
    }
    
    // Stripe key format detection
    const isTestMode = stripeKey.startsWith('sk_test_');
    const isLiveMode = stripeKey.startsWith('sk_live_');
    const mode = isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown';
    
    // Validate key format
    const isValidFormat = /^sk_(test|live)_[a-zA-Z0-9]{99}$/.test(stripeKey);
    
    let apiStatus = 'unknown';
    let apiError = null;
    
    try {
      // Test Stripe API connectivity with timeout
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(stripeKey);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      );
      
      await Promise.race([
        stripeClient.products.list({ limit: 1 }),
        timeoutPromise
      ]);
      
      apiStatus = 'accessible';
    } catch (error) {
      apiStatus = 'error';
      apiError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return NextResponse.json({
      configured: true,
      mode,
      keyFormat: {
        valid: isValidFormat,
        prefix: stripeKey.substring(0, 8) + '...',
        length: stripeKey.length
      },
      api: {
        status: apiStatus,
        error: apiError
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Diagnostics failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}