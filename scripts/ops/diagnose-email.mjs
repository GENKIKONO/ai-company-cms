#!/usr/bin/env node

/**
 * Enhanced Email System Diagnostic Script
 * Comprehensive checks for email delivery system health
 * Usage: node scripts/ops/diagnose-email.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
  manual: (msg) => console.log(`${colors.magenta}🔧${colors.reset} ${msg}`)
};

class EmailDiagnostic {
  constructor() {
    this.results = {};
    this.envPath = path.join(process.cwd(), '.env.local');
    this.packagePath = path.join(process.cwd(), 'package.json');
  }

  async run() {
    log.section('🔍 Email System Diagnostic Report');
    log.info(`Generated at: ${new Date().toISOString()}`);
    log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    await this.checkEnvironmentVariables();
    await this.checkSupabaseConfiguration();
    await this.checkResendConfiguration();
    await this.checkDependencies();
    await this.checkNetworkConnectivity();
    await this.runEmailTests();
    await this.generateReport();
  }

  async checkEnvironmentVariables() {
    log.section('📋 Environment Variables Check');
    
    const requiredVars = [
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL', 
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL'
    ];

    const optionalVars = [
      'USE_SUPABASE_EMAIL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    this.results.environment = {
      required: {},
      optional: {},
      missing: [],
      issues: []
    };

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      const status = value ? 'SET' : 'MISSING';
      
      this.results.environment.required[varName] = {
        status,
        hasValue: !!value,
        length: value ? value.length : 0
      };

      if (value) {
        log.success(`${varName}: SET (${value.length} chars)`);
        
        // Specific validations
        if (varName === 'NEXT_PUBLIC_APP_URL') {
          if (!value.startsWith('https://')) {
            log.warning(`${varName} should use HTTPS in production`);
            this.results.environment.issues.push(`${varName} not using HTTPS`);
          }
          if (value.includes('localhost')) {
            log.warning(`${varName} still pointing to localhost`);
            this.results.environment.issues.push(`${varName} using localhost`);
          }
        }
        
        if (varName === 'RESEND_API_KEY' && !value.startsWith('re_')) {
          log.warning(`${varName} format appears invalid (should start with 're_')`);
          this.results.environment.issues.push(`${varName} invalid format`);
        }
      } else {
        log.error(`${varName}: MISSING`);
        this.results.environment.missing.push(varName);
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName];
      this.results.environment.optional[varName] = {
        status: value ? 'SET' : 'NOT_SET',
        value: value || null
      };
      
      if (value) {
        log.info(`${varName}: ${value}`);
      } else {
        log.info(`${varName}: Not set (using default)`);
      }
    }

    // Check .env.local file
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const commentedVars = envContent
        .split('\n')
        .filter(line => line.trim().startsWith('#') && line.includes('RESEND'))
        .map(line => line.trim());
      
      if (commentedVars.length > 0) {
        log.warning('.env.local contains commented Resend variables:');
        commentedVars.forEach(line => log.warning(`  ${line}`));
        this.results.environment.issues.push('Resend variables commented in .env.local');
      }
    }
  }

  async checkSupabaseConfiguration() {
    log.section('🏗️ Supabase Configuration Check');
    
    this.results.supabase = {
      url_format: false,
      service_key_format: false,
      connectivity: false,
      auth_config: 'MANUAL_CHECK_REQUIRED'
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl) {
      if (supabaseUrl.includes('.supabase.co')) {
        log.success('Supabase URL format: Valid');
        this.results.supabase.url_format = true;
      } else {
        log.error('Supabase URL format: Invalid');
      }
    }

    if (serviceKey) {
      if (serviceKey.startsWith('eyJ')) {
        log.success('Service Role Key format: Valid JWT');
        this.results.supabase.service_key_format = true;
      } else {
        log.error('Service Role Key format: Invalid');
      }
    }

    // Manual check instructions
    log.manual('Manual Supabase Auth checks required:');
    log.manual('1. Visit Supabase Dashboard → Authentication → URL Configuration');
    log.manual('2. Verify Site URL: https://aiohub.jp');
    log.manual('3. Verify Redirect URLs include: https://aiohub.jp/auth/callback');
    log.manual('4. Check Authentication → Settings → SMTP: Should be OFF (using Supabase standard)');
  }

  async checkResendConfiguration() {
    log.section('📧 Resend Configuration Check');
    
    this.results.resend = {
      api_key: false,
      from_email: false,
      domain_verification: 'MANUAL_CHECK_REQUIRED'
    };

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (apiKey && apiKey !== 'dummy-key-for-build') {
      log.success('Resend API Key: Configured');
      this.results.resend.api_key = true;
    } else {
      log.error('Resend API Key: Missing or using build fallback');
    }

    if (fromEmail) {
      if (fromEmail.includes('@aiohub.jp')) {
        log.success(`From Email: ${fromEmail} (aiohub.jp domain)`);
        this.results.resend.from_email = true;
      } else {
        log.warning(`From Email: ${fromEmail} (not aiohub.jp domain)`);
      }
    } else {
      log.error('Resend From Email: Missing');
    }

    log.manual('Manual Resend domain checks required:');
    log.manual('1. Visit Resend Dashboard → Domains');
    log.manual('2. Verify aiohub.jp domain status: Verified');
    log.manual('3. Check SPF record: v=spf1 include:_spf.resend.com ~all');
    log.manual('4. Check DKIM records are properly configured');
  }

  async checkDependencies() {
    log.section('📦 Dependencies Check');
    
    this.results.dependencies = {
      resend: false,
      nodemailer: false,
      supabase: false
    };

    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const requiredDeps = {
        'resend': 'Email delivery service',
        'nodemailer': 'SMTP testing',
        '@supabase/supabase-js': 'Supabase client'
      };

      for (const [dep, description] of Object.entries(requiredDeps)) {
        if (deps[dep]) {
          log.success(`${dep}: ${deps[dep]} (${description})`);
          this.results.dependencies[dep.replace('@supabase/supabase-js', 'supabase')] = true;
        } else {
          log.error(`${dep}: Missing (${description})`);
        }
      }
    } catch (error) {
      log.error(`Failed to read package.json: ${error.message}`);
    }
  }

  async checkNetworkConnectivity() {
    log.section('🌐 Network Connectivity Check');
    
    this.results.network = {
      supabase: false,
      resend_smtp: false,
      dns_resolution: {}
    };

    const hosts = [
      'mfumcxxzxuwbtjhhzqdy.supabase.co',
      'smtp.resend.com',
      'api.resend.com'
    ];

    for (const host of hosts) {
      try {
        const { promisify } = await import('util');
        const dns = await import('dns');
        const lookup = promisify(dns.lookup);
        
        const result = await lookup(host);
        log.success(`${host}: Resolved to ${result.address}`);
        this.results.network.dns_resolution[host] = {
          resolved: true,
          address: result.address
        };
        
        if (host.includes('supabase.co')) {
          this.results.network.supabase = true;
        }
        if (host.includes('resend.com')) {
          this.results.network.resend_smtp = true;
        }
      } catch (error) {
        log.error(`${host}: DNS resolution failed - ${error.message}`);
        this.results.network.dns_resolution[host] = {
          resolved: false,
          error: error.message
        };
      }
    }
  }

  async runEmailTests() {
    log.section('🧪 Email Delivery Tests');
    
    this.results.emailTests = {
      available: false,
      skipped: false,
      results: []
    };

    // Check if we can run email tests
    const testEmail = process.env.EMAIL_TEST_TARGET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' ? 
        (() => { throw new Error('NEXT_PUBLIC_APP_URL must be set in production'); })() :
        'http://localhost:3000'
      );
    
    if (!testEmail || !testEmail.includes('@')) {
      log.warning('EMAIL_TEST_TARGET not set - skipping live email tests');
      log.info('To enable email tests, set EMAIL_TEST_TARGET=your-test-email@domain.com');
      this.results.emailTests.skipped = true;
      return;
    }

    this.results.emailTests.available = true;
    
    try {
      // Test the email testing API
      log.info(`Testing email delivery to: ${testEmail.replace(/(.{2}).*@/, '$1***@')}`);
      
      const testPayload = {
        testEmail,
        tests: ['resend_direct', 'supabase_direct', 'dual_path'],
        skipActualSend: process.env.EMAIL_TEST_SKIP_SEND === 'true'
      };

      const testResponse = await fetch(`${appUrl}/api/ops/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (!testResponse.ok) {
        throw new Error(`Email test API returned ${testResponse.status}`);
      }

      const testResults = await testResponse.json();
      this.results.emailTests.results = testResults;

      // Report results
      if (testResults.success) {
        log.success(`Email tests completed: ${testResults.summary.passed}/${testResults.summary.total} passed`);
        
        testResults.results.forEach(result => {
          if (result.success) {
            log.success(`${result.test}: ${result.provider} (${result.duration}ms)`);
          } else {
            log.error(`${result.test}: ${result.error || 'Failed'} (${result.duration}ms)`);
          }
        });
      } else {
        log.error('Email tests failed - check API logs for details');
        
        testResults.results?.forEach(result => {
          if (!result.success) {
            log.error(`${result.test}: ${result.error || 'Failed'}`);
          }
        });
      }

    } catch (error) {
      log.error(`Email tests failed: ${error.message}`);
      this.results.emailTests.error = error.message;
    }

    log.manual('Email testing configuration:');
    log.manual('1. Set EMAIL_TEST_TARGET=your-test-email@domain.com for live tests');
    log.manual('2. Set EMAIL_TEST_SKIP_SEND=true to test without sending emails');
    log.manual('3. API endpoint: POST /api/ops/email/test');
    log.manual('4. Tests: resend_direct, supabase_direct, dual_path, auth_flow');
  }

  async generateReport() {
    log.section('📊 Diagnostic Summary');

    const issues = [];
    const warnings = [];
    let overallHealth = 'HEALTHY';

    // Environment issues
    if (this.results.environment.missing.length > 0) {
      issues.push(`Missing environment variables: ${this.results.environment.missing.join(', ')}`);
      overallHealth = 'CRITICAL';
    }

    if (this.results.environment.issues.length > 0) {
      warnings.push(...this.results.environment.issues);
    }

    // Network issues
    if (!this.results.network.supabase) {
      issues.push('Supabase connectivity failed');
      overallHealth = 'CRITICAL';
    }

    if (!this.results.network.resend_smtp) {
      warnings.push('Resend SMTP connectivity failed');
      if (overallHealth === 'HEALTHY') overallHealth = 'DEGRADED';
    }

    // Configuration issues
    if (!this.results.resend.api_key) {
      issues.push('Resend API key not configured');
      if (overallHealth === 'HEALTHY') overallHealth = 'DEGRADED';
    }

    // Email test issues
    if (this.results.emailTests?.results?.success === false) {
      const failedTests = this.results.emailTests.results.results?.filter(r => !r.success) || [];
      if (failedTests.length > 0) {
        failedTests.forEach(test => {
          issues.push(`Email test failed: ${test.test} - ${test.error || 'Unknown error'}`);
        });
        if (overallHealth === 'HEALTHY') overallHealth = 'DEGRADED';
      }
    }

    // Print summary
    if (overallHealth === 'HEALTHY') {
      log.success(`Overall System Health: ${overallHealth}`);
    } else if (overallHealth === 'DEGRADED') {
      log.warning(`Overall System Health: ${overallHealth}`);
    } else {
      log.error(`Overall System Health: ${overallHealth}`);
    }

    if (issues.length > 0) {
      log.section('❌ Critical Issues');
      issues.forEach(issue => log.error(issue));
    }

    if (warnings.length > 0) {
      log.section('⚠️ Warnings');
      warnings.forEach(warning => log.warning(warning));
    }

    // Next steps
    log.section('🔧 Recommended Actions');
    if (this.results.environment.missing.includes('RESEND_API_KEY')) {
      log.info('1. Uncomment RESEND_API_KEY in .env.local');
      log.info('2. Get API key from https://resend.com/dashboard');
    }
    if (!this.results.network.supabase) {
      log.info('3. Check internet connectivity and DNS settings');
      log.info('4. Verify Supabase project is not paused');
    }
    if (warnings.length > 0) {
      log.info('5. Address configuration warnings above');
    }

    // API endpoint info
    log.section('🔗 Diagnostic API Endpoint');
    log.info('Test via: POST /api/ops/email/diagnose');
    log.info('Dashboard link: https://aiohub.jp/ops/email-health (if implemented)');

    // Export JSON results
    const outputPath = path.join(process.cwd(), 'diagnostic-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    log.info(`Detailed results exported to: ${outputPath}`);
  }
}

// Run diagnostic if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostic = new EmailDiagnostic();
  diagnostic.run().catch(console.error);
}

export { EmailDiagnostic };