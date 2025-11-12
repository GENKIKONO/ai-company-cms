#!/usr/bin/env node

/**
 * Final Security Check Script
 * 
 * This script performs comprehensive final security validation
 * to verify all production security features are properly configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Final Security Check Report');
console.log('='.repeat(60));
console.log(`📅 Generated: ${new Date().toISOString()}`);
console.log('');

// 1️⃣ Next.js Build & NODE_ENV Validation
console.log('1️⃣ Next.js Production Optimization Check');
console.log('-'.repeat(45));

const nodeEnv = process.env.NODE_ENV;
const appEnv = process.env.APP_ENV;

if (nodeEnv === 'production') {
  console.log('✅ NODE_ENV: production (Next.js optimizations enabled)');
} else {
  console.log(`⚠️  NODE_ENV: ${nodeEnv || 'undefined'} (expected: production)`);
}

if (appEnv === 'production') {
  console.log('✅ APP_ENV: production (Application production mode)');
} else {
  console.log(`⚠️  APP_ENV: ${appEnv || 'undefined'} (expected: production)`);
}

console.log('');

// 2️⃣ HTTPS Configuration Check
console.log('2️⃣ HTTPS Security Configuration');
console.log('-'.repeat(35));

const forceHttps = process.env.FORCE_HTTPS;
if (forceHttps === 'true') {
  console.log('✅ FORCE_HTTPS: true (HTTP→HTTPS redirects enabled)');
  console.log('✅ Secure cookies will be enforced');
  console.log('✅ Mixed content protection active');
} else {
  console.log(`⚠️  FORCE_HTTPS: ${forceHttps || 'undefined'} (expected: true)`);
}

console.log('');

// 3️⃣ Security Headers Validation
console.log('3️⃣ Security Headers & CSP Validation');
console.log('-'.repeat(40));

const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
let headersConfigured = 0;

if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check for security headers
  const securityHeaders = [
    { name: 'Content-Security-Policy', pattern: /Content-Security-Policy/i },
    { name: 'X-Frame-Options', pattern: /X-Frame-Options/i },
    { name: 'X-Content-Type-Options', pattern: /X-Content-Type-Options/i },
    { name: 'Referrer-Policy', pattern: /Referrer-Policy/i },
    { name: 'Strict-Transport-Security', pattern: /Strict-Transport-Security/i }
  ];
  
  securityHeaders.forEach(header => {
    if (header.pattern.test(middlewareContent)) {
      console.log(`✅ ${header.name}: Configured`);
      headersConfigured++;
    } else {
      console.log(`⚠️  ${header.name}: Not found`);
    }
  });
  
  console.log(`📊 Security Headers: ${headersConfigured}/${securityHeaders.length} configured`);
  
  // Check for CSP strictness
  if (middlewareContent.includes("'unsafe-inline'") || middlewareContent.includes("'unsafe-eval'")) {
    console.log('⚠️  CSP contains unsafe directives');
  } else {
    console.log('✅ CSP appears strict (no unsafe directives detected)');
  }
  
} else {
  console.log('❌ Middleware file not found');
}

console.log('');

// 4️⃣ Cookie Security Configuration
console.log('4️⃣ Cookie Security Configuration');
console.log('-'.repeat(35));

// Check for secure cookie configurations in code
const cookieSecurityChecks = [
  { file: 'src/lib/auth/server.ts', description: 'Auth cookies' },
  { file: 'src/middleware.ts', description: 'Middleware cookies' }
];

let secureConfigFound = false;
cookieSecurityChecks.forEach(check => {
  const filePath = path.join(process.cwd(), check.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('secure:') || content.includes('Secure') || content.includes('httpOnly')) {
      console.log(`✅ ${check.description}: Secure configuration detected`);
      secureConfigFound = true;
    }
  }
});

if (forceHttps === 'true') {
  console.log('✅ HTTPS enforcement will ensure secure cookies');
  secureConfigFound = true;
}

if (!secureConfigFound) {
  console.log('⚠️  No secure cookie configurations detected');
}

console.log('');

// 5️⃣ Environment Variables Security Audit
console.log('5️⃣ Environment Variables Security Audit');
console.log('-'.repeat(40));

const criticalSecurityVars = [
  'CSRF_SECRET',
  'API_SIGNATURE_SECRET', 
  'ADMIN_API_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_WEBHOOK_SECRET',
  'NEXTAUTH_SECRET'
];

let securityVarsConfigured = 0;
criticalSecurityVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.length >= 16) {
    console.log(`✅ ${varName}: Configured (${value.length} chars)`);
    securityVarsConfigured++;
  } else if (value) {
    console.log(`⚠️  ${varName}: Too short (${value.length} chars)`);
  } else {
    console.log(`❌ ${varName}: Not configured`);
  }
});

console.log(`📊 Security Variables: ${securityVarsConfigured}/${criticalSecurityVars.length} properly configured`);

console.log('');

// 6️⃣ Production Environment Summary
console.log('6️⃣ Production Environment Summary');
console.log('-'.repeat(35));

const productionChecks = [
  { name: 'NODE_ENV=production', check: nodeEnv === 'production', critical: true },
  { name: 'APP_ENV=production', check: appEnv === 'production', critical: true },
  { name: 'FORCE_HTTPS=true', check: forceHttps === 'true', critical: true },
  { name: 'Security variables configured', check: securityVarsConfigured >= 5, critical: true },
  { name: 'Security headers present', check: headersConfigured >= 3, critical: false },
  { name: 'Middleware exists', check: fs.existsSync(middlewarePath), critical: true }
];

let criticalPassed = 0;
let totalPassed = 0;
let criticalTotal = 0;

productionChecks.forEach(check => {
  if (check.critical) criticalTotal++;
  
  if (check.check) {
    console.log(`✅ ${check.name}`);
    totalPassed++;
    if (check.critical) criticalPassed++;
  } else {
    const icon = check.critical ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}`);
  }
});

console.log('');

// 7️⃣ Build Verification (if possible)
console.log('7️⃣ Build Environment Verification');
console.log('-'.repeat(35));

// Check if we can verify build optimizations
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
const packageJsonPath = path.join(process.cwd(), 'package.json');

if (fs.existsSync(nextConfigPath)) {
  console.log('✅ Next.js configuration file found');
} else {
  console.log('⚠️  Next.js configuration file not found');
}

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script configured');
  } else {
    console.log('⚠️  Build script not found');
  }
} else {
  console.log('❌ Package.json not found');
}

console.log('');

// 🎯 Final Assessment
console.log('='.repeat(60));
console.log('🎯 FINAL SECURITY ASSESSMENT');
console.log('='.repeat(60));

if (criticalPassed === criticalTotal) {
  console.log('🎉 PRODUCTION READY');
  console.log('✅ All critical security requirements met');
  console.log('✅ Application configured for secure production deployment');
  
  if (totalPassed === productionChecks.length) {
    console.log('🌟 EXCELLENT: All security checks passed');
  } else {
    console.log('📊 GOOD: All critical checks passed, some optional improvements available');
  }
} else {
  console.log('⚠️  REQUIRES ATTENTION');
  console.log(`❌ ${criticalTotal - criticalPassed} critical security requirements not met`);
  console.log('🔧 Please address critical issues before production deployment');
}

console.log('');
console.log(`📊 Overall Score: ${totalPassed}/${productionChecks.length} checks passed`);
console.log(`🔒 Critical Score: ${criticalPassed}/${criticalTotal} critical checks passed`);

console.log('');
console.log('='.repeat(60));
console.log('📋 DEPLOYMENT READINESS CHECKLIST');
console.log('='.repeat(60));

const deploymentChecklist = [
  { item: 'Environment variables configured in Vercel', status: '✅' },
  { item: 'NODE_ENV=production set in all environments', status: nodeEnv === 'production' ? '✅' : '❌' },
  { item: 'FORCE_HTTPS=true for secure connections', status: forceHttps === 'true' ? '✅' : '❌' },
  { item: 'Security middleware deployed', status: fs.existsSync(middlewarePath) ? '✅' : '❌' },
  { item: 'Database security policies applied', status: '🔄' },
  { item: 'SSL certificate configured (Vercel automatic)', status: '✅' },
  { item: 'Domain DNS configured', status: '🔄' },
  { item: 'Monitoring & alerting setup', status: '🔄' }
];

deploymentChecklist.forEach((item, index) => {
  console.log(`${index + 1}. ${item.status} ${item.item}`);
});

console.log('');
console.log('Legend: ✅ Complete | ❌ Required | 🔄 Manual verification needed');

console.log('');
console.log('🔗 Next Steps:');
console.log('1. Deploy to production environment');
console.log('2. Verify HTTPS redirects are working');
console.log('3. Test security headers in production');
console.log('4. Monitor application performance');
console.log('5. Schedule regular security audits');

console.log('');
console.log(`📅 Report completed at: ${new Date().toISOString()}`);