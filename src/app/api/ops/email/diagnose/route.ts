import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sendHtmlEmail } from '@/lib/email/resend-client';
import { generateAuthLink } from '@/lib/auth/generate-link';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    console.info({
      event: 'email_diagnose_start',
      requestId,
      timestamp: new Date().toISOString()
    });

    const results = {
      requestId,
      timestamp: new Date().toISOString(),
      smtp_connectivity: null as any,
      resend_api: null as any,
      supabase_admin: null as any,
      environment_check: null as any
    };

    // 1. Environment variables check
    try {
      const requiredEnvVars = [
        'RESEND_API_KEY',
        'RESEND_FROM_EMAIL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_APP_URL'
      ];

      const missing = requiredEnvVars.filter(key => !process.env[key]);
      
      results.environment_check = {
        success: missing.length === 0,
        required_vars: requiredEnvVars.length,
        missing_vars: missing,
        resend_from: process.env.RESEND_FROM_EMAIL || 'noreply@aiohub.jp',
        app_url: process.env.NEXT_PUBLIC_APP_URL
      };

      console.info({
        event: 'email_diagnose_env_check',
        requestId,
        missing_vars: missing,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      results.environment_check = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 2. SMTP connectivity test (using nodemailer to test general SMTP)
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });

      await transporter.verify();
      
      results.smtp_connectivity = {
        success: true,
        host: 'smtp.resend.com',
        port: 587,
        auth_method: 'API_KEY'
      };

      console.info({
        event: 'email_diagnose_smtp_success',
        requestId,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      results.smtp_connectivity = {
        success: false,
        host: 'smtp.resend.com',
        port: 587,
        error: err instanceof Error ? err.message : 'Unknown error'
      };

      console.error({
        event: 'email_diagnose_smtp_failed',
        requestId,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Resend API test
    try {
      const testEmailResult = await sendHtmlEmail({
        to: 'test@example.com', // This will fail but we can check API response
        subject: 'Diagnostic Test Email',
        html: '<p>This is a diagnostic test email.</p>',
        requestId
      });

      // Even if email fails to send due to invalid recipient, 
      // we can still determine if API connection works
      results.resend_api = {
        success: testEmailResult.success,
        api_reachable: true,
        error: testEmailResult.error,
        message_id: testEmailResult.messageId
      };

      console.info({
        event: 'email_diagnose_resend_test',
        requestId,
        api_success: testEmailResult.success,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      results.resend_api = {
        success: false,
        api_reachable: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };

      console.error({
        event: 'email_diagnose_resend_failed',
        requestId,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // 4. Supabase Admin API test
    try {
      const linkResult = await generateAuthLink({
        email: 'test@example.com',
        type: 'signup',
        requestId
      });

      results.supabase_admin = {
        success: linkResult.success,
        has_url: !!linkResult.url,
        error: linkResult.error
      };

      console.info({
        event: 'email_diagnose_supabase_test',
        requestId,
        admin_success: linkResult.success,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      results.supabase_admin = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };

      console.error({
        event: 'email_diagnose_supabase_failed',
        requestId,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Summary
    const overallSuccess = 
      results.environment_check?.success &&
      results.smtp_connectivity?.success &&
      results.resend_api?.api_reachable &&
      results.supabase_admin?.success;

    console.info({
      event: 'email_diagnose_complete',
      requestId,
      overall_success: overallSuccess,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'すべての診断テストが成功しました' 
        : '一部の診断テストが失敗しました',
      ...results
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error({
      event: 'email_diagnose_error',
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Diagnostic test failed',
        requestId,
        details: errorMessage
      },
      { status: 500 }
    );
  }
}