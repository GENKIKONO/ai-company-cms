#!/usr/bin/env node

/**
 * Email System Regression Test Suite
 * Comprehensive testing to prevent regressions in email delivery functionality
 * Usage: node scripts/ops/regression-test-email.mjs
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
  debug: (msg) => console.log(`${colors.magenta}🔧${colors.reset} ${msg}`)
};

class EmailRegressionTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      environment: {},
      startTime: new Date().toISOString()
    };
    
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.testEmail = process.env.EMAIL_TEST_TARGET;
    this.skipSend = process.env.EMAIL_TEST_SKIP_SEND === 'true';
  }

  async run() {
    log.section('🧪 Email System Regression Test Suite');
    log.info(`Started at: ${this.results.startTime}`);
    log.info(`Target URL: ${this.appUrl}`);
    log.info(`Test Email: ${this.testEmail ? this.testEmail.replace(/(.{2}).*@/, '$1***@') : 'Not configured'}`);
    log.info(`Skip Send: ${this.skipSend}`);
    
    // Environment validation
    await this.validateEnvironment();
    
    // Core API tests
    await this.testDiagnosticAPI();
    await this.testEmailTestAPI();
    await this.testResendConfirmationAPI();
    
    // Edge cases and error scenarios
    await this.testErrorConditions();
    await this.testRateLimiting();
    await this.testValidationEdgeCases();
    
    // Integration tests
    await this.testDualPathBehavior();
    await this.testLoggingOutput();
    
    // Performance tests
    await this.testPerformanceBaselines();
    
    // Generate final report
    await this.generateReport();
  }

  async validateEnvironment() {
    log.section('🔍 Environment Validation');
    
    this.results.environment = {
      hasResendKey: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'dummy-key-for-build'),
      hasSupabaseKeys: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasTestEmail: !!this.testEmail,
      appUrl: this.appUrl,
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    if (!this.results.environment.hasTestEmail) {
      log.warning('EMAIL_TEST_TARGET not set - some tests will be skipped');
    }

    if (!this.results.environment.hasResendKey) {
      log.warning('RESEND_API_KEY not configured - Resend tests will fail');
    }

    if (!this.results.environment.hasSupabaseKeys) {
      log.warning('Supabase keys not configured - Supabase tests will fail');
    }

    log.success('Environment validation complete');
  }

  async runTest(testName, testFunction, category = 'general') {
    const startTime = Date.now();
    this.results.summary.total++;
    
    try {
      log.info(`Running: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        category,
        status: 'passed',
        duration,
        result,
        timestamp: new Date().toISOString()
      });
      
      log.success(`PASS: ${testName} (${duration}ms)`);
      this.results.summary.passed++;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        category,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      log.error(`FAIL: ${testName} - ${error.message} (${duration}ms)`);
      this.results.summary.failed++;
    }
  }

  async testDiagnosticAPI() {
    log.section('📊 Diagnostic API Tests');
    
    await this.runTest('Diagnostic API responds', async () => {
      const response = await fetch(`${this.appUrl}/api/ops/email/diagnose`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Diagnostic API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.checks || !Array.isArray(result.checks)) {
        throw new Error('Diagnostic API response missing checks array');
      }
      
      return { checks: result.checks.length, healthy: result.overallHealth === 'healthy' };
    }, 'diagnostic');
  }

  async testEmailTestAPI() {
    log.section('🧪 Email Test API Tests');
    
    if (!this.testEmail) {
      log.warning('Skipping email test API tests - no test email configured');
      return;
    }
    
    await this.runTest('Email Test API - All tests', async () => {
      const response = await fetch(`${this.appUrl}/api/ops/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: this.testEmail,
          tests: ['resend_direct', 'supabase_direct', 'dual_path'],
          skipActualSend: this.skipSend
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email Test API returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success && !this.skipSend) {
        throw new Error(`Email tests failed: ${result.summary?.failed || 'unknown'} failures`);
      }
      
      return { 
        passed: result.summary.passed, 
        total: result.summary.total,
        skipped: this.skipSend 
      };
    }, 'email-test');
    
    await this.runTest('Email Test API - Individual test types', async () => {
      const testTypes = ['resend_direct', 'supabase_direct', 'dual_path'];
      const results = [];
      
      for (const testType of testTypes) {
        const response = await fetch(`${this.appUrl}/api/ops/email/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testEmail: this.testEmail,
            tests: [testType],
            skipActualSend: true // Always skip for individual tests
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          results.push({ test: testType, success: result.success });
        } else {
          results.push({ test: testType, success: false });
        }
      }
      
      return results;
    }, 'email-test');
  }

  async testResendConfirmationAPI() {
    log.section('📧 Resend Confirmation API Tests');
    
    if (!this.testEmail) {
      log.warning('Skipping resend confirmation API tests - no test email configured');
      return;
    }
    
    await this.runTest('Resend Confirmation API - Valid request', async () => {
      const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.testEmail,
          type: 'signup'
        })
      });
      
      const result = await response.json();
      
      // Should succeed or fail gracefully with proper error codes
      if (!response.ok && response.status !== 429 && response.status !== 424) {
        throw new Error(`Unexpected status ${response.status}: ${result.error}`);
      }
      
      if (!result.requestId) {
        throw new Error('Response missing requestId');
      }
      
      return { status: response.status, success: result.success, code: result.code };
    }, 'api');
  }

  async testErrorConditions() {
    log.section('⚠️ Error Condition Tests');
    
    await this.runTest('Invalid email format handling', async () => {
      const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          type: 'signup'
        })
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected 400 for invalid email, got ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.code !== 'validation_error') {
        throw new Error(`Expected validation_error code, got ${result.code}`);
      }
      
      return { status: response.status, code: result.code };
    }, 'error-handling');
    
    await this.runTest('Missing email handling', async () => {
      const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup'
        })
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected 400 for missing email, got ${response.status}`);
      }
      
      return { status: response.status };
    }, 'error-handling');
    
    await this.runTest('Invalid JSON handling', async () => {
      const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      // Should handle malformed JSON gracefully
      if (response.status < 400 || response.status >= 500) {
        throw new Error(`Expected 4xx error for invalid JSON, got ${response.status}`);
      }
      
      return { status: response.status };
    }, 'error-handling');
  }

  async testRateLimiting() {
    log.section('🚦 Rate Limiting Tests');
    
    if (!this.testEmail) {
      log.warning('Skipping rate limiting tests - no test email configured');
      return;
    }
    
    await this.runTest('Rate limiting behavior', async () => {
      const requests = [];
      
      // Send multiple requests quickly
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: this.testEmail,
              type: 'signup'
            })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      if (rateLimited.length === 0) {
        log.warning('No rate limiting detected - may indicate issue with rate limiter');
      }
      
      return { 
        totalRequests: responses.length, 
        rateLimited: rateLimited.length,
        statusCodes: responses.map(r => r.status)
      };
    }, 'rate-limiting');
  }

  async testValidationEdgeCases() {
    log.section('🔍 Validation Edge Cases');
    
    const edgeCaseEmails = [
      'test+tag@example.com',
      'user.name@example.com', 
      'user_name@example-domain.com',
      'a@b.co',
      'verylongemailaddress123456789@verylongdomainname123456789.com'
    ];
    
    for (const email of edgeCaseEmails) {
      await this.runTest(`Email validation: ${email}`, async () => {
        const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            type: 'signup'
          })
        });
        
        const result = await response.json();
        
        // Should accept valid email formats
        if (response.status === 400 && result.code === 'validation_error') {
          throw new Error(`Valid email rejected: ${email}`);
        }
        
        return { status: response.status, accepted: response.status !== 400 };
      }, 'validation');
    }
  }

  async testDualPathBehavior() {
    log.section('🔄 Dual-Path Integration Tests');
    
    if (!this.testEmail) {
      log.warning('Skipping dual-path tests - no test email configured');
      return;
    }
    
    await this.runTest('Dual-path email delivery simulation', async () => {
      const response = await fetch(`${this.appUrl}/api/ops/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: this.testEmail,
          tests: ['dual_path'],
          skipActualSend: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Dual-path test failed: ${response.status}`);
      }
      
      const result = await response.json();
      const dualPathResult = result.results.find(r => r.test === 'dual_path');
      
      if (!dualPathResult) {
        throw new Error('Dual-path test result not found');
      }
      
      return {
        success: dualPathResult.success,
        details: dualPathResult.details
      };
    }, 'integration');
  }

  async testLoggingOutput() {
    log.section('📝 Logging Output Tests');
    
    await this.runTest('Request ID tracking', async () => {
      const response = await fetch(`${this.appUrl}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com', // Use dummy email
          type: 'signup'
        })
      });
      
      const result = await response.json();
      
      if (!result.requestId) {
        throw new Error('Response missing requestId for logging correlation');
      }
      
      // Verify requestId format (UUID v4)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(result.requestId)) {
        throw new Error('Invalid requestId format');
      }
      
      return { requestId: result.requestId, format: 'uuid-v4' };
    }, 'logging');
  }

  async testPerformanceBaselines() {
    log.section('⚡ Performance Baseline Tests');
    
    await this.runTest('API response time baseline', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${this.appUrl}/api/ops/email/diagnose`, {
        method: 'POST'
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      if (duration > 10000) { // 10 second baseline
        throw new Error(`API too slow: ${duration}ms (baseline: 10000ms)`);
      }
      
      return { duration, baseline: 10000 };
    }, 'performance');
    
    if (this.testEmail) {
      await this.runTest('Email test API performance', async () => {
        const startTime = Date.now();
        
        const response = await fetch(`${this.appUrl}/api/ops/email/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testEmail: this.testEmail,
            tests: ['resend_direct'],
            skipActualSend: true
          })
        });
        
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`Email test API failed: ${response.status}`);
        }
        
        if (duration > 15000) { // 15 second baseline
          throw new Error(`Email test too slow: ${duration}ms (baseline: 15000ms)`);
        }
        
        return { duration, baseline: 15000 };
      }, 'performance');
    }
  }

  async generateReport() {
    log.section('📊 Regression Test Report');
    
    this.results.endTime = new Date().toISOString();
    this.results.duration = Date.now() - new Date(this.results.startTime).getTime();
    
    // Calculate success rate
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.passed / this.results.summary.total) * 100)
      : 0;
    
    // Print summary
    log.info(`Total Tests: ${this.results.summary.total}`);
    log.success(`Passed: ${this.results.summary.passed}`);
    log.error(`Failed: ${this.results.summary.failed}`);
    log.info(`Success Rate: ${successRate}%`);
    log.info(`Total Duration: ${this.results.duration}ms`);
    
    // Print failed tests
    if (this.results.summary.failed > 0) {
      log.section('❌ Failed Tests');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          log.error(`${test.name}: ${test.error}`);
        });
    }
    
    // Print performance summary
    const performanceTests = this.results.tests.filter(t => t.category === 'performance');
    if (performanceTests.length > 0) {
      log.section('⚡ Performance Summary');
      performanceTests.forEach(test => {
        const duration = test.result?.duration || test.duration;
        const baseline = test.result?.baseline || 'N/A';
        log.info(`${test.name}: ${duration}ms (baseline: ${baseline}ms)`);
      });
    }
    
    // Export detailed results
    const outputPath = path.join(process.cwd(), 'regression-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    log.info(`Detailed results exported to: ${outputPath}`);
    
    // Exit with appropriate code
    if (this.results.summary.failed > 0) {
      log.error('🚨 Regression tests failed - some functionality may be broken');
      process.exit(1);
    } else {
      log.success('🎉 All regression tests passed - system is stable');
      process.exit(0);
    }
  }
}

// Run regression tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EmailRegressionTester();
  tester.run().catch(error => {
    console.error('💥 Regression test runner crashed:', error);
    process.exit(1);
  });
}

export { EmailRegressionTester };